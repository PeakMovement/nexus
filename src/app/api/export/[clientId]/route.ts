import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast", snack1: "AM Snack", lunch: "Lunch", snack2: "PM Snack", dinner: "Dinner",
};
const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];
const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins", carb: "Carbs & Grains", fat: "Fats & Oils",
  vegetable: "Vegetables", fruit: "Fruit", dairy: "Dairy", pantry: "Pantry",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const planId = searchParams.get("planId");

  if (!type || !planId) return new Response("Missing type or planId", { status: 400 });

  const planRes = await query(
    `SELECT mp.*, c.name as client_name FROM meal_plans mp
     JOIN clients c ON c.id = mp.client_id WHERE mp.id=$1 AND mp.client_id=$2`,
    [planId, clientId]
  );
  if (planRes.rows.length === 0) return new Response("Not found", { status: 404 });
  const plan = planRes.rows[0];

  const doc = new jsPDF();

  if (type === "mealplan") {
    const mealsRes = await query(
      `SELECT m.*, mf.quantity, f.name as food_name, f.calories_per_100g
       FROM meals m LEFT JOIN meal_foods mf ON mf.meal_id = m.id
       LEFT JOIN foods f ON f.id = mf.food_id
       WHERE m.meal_plan_id=$1 ORDER BY m.day_of_week, m.meal_type`,
      [planId]
    );

    // Group meals
    const mealsByDay = new Map<number, Map<string, { name: string; mealType: string; foods: { name: string; qty: number; cals: number }[] }>>();
    for (const row of mealsRes.rows) {
      if (!mealsByDay.has(row.day_of_week)) mealsByDay.set(row.day_of_week, new Map());
      const d = mealsByDay.get(row.day_of_week)!;
      if (!d.has(row.id)) d.set(row.id, { name: row.name, mealType: row.meal_type, foods: [] });
      if (row.food_name) d.get(row.id)!.foods.push({ name: row.food_name, qty: row.quantity, cals: (row.calories_per_100g * row.quantity) / 100 });
    }

    doc.setFontSize(20); doc.setTextColor(5, 150, 105); doc.text("NutriPlan SA", 14, 20);
    doc.setFontSize(16); doc.setTextColor(30, 30, 30); doc.text(`Weekly Meal Plan - ${plan.client_name}`, 14, 32);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text(`Week of ${new Date(plan.week_start).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`, 14, 40);
    doc.setFontSize(11); doc.setTextColor(30, 30, 30);
    doc.text(`Daily Targets: ${plan.daily_calories} kcal | Protein: ${plan.daily_protein}g | Carbs: ${plan.daily_carbs}g | Fat: ${plan.daily_fat}g`, 14, 50);

    let startY = 58;
    for (let day = 1; day <= 7; day++) {
      const dayMeals = Array.from(mealsByDay.get(day)?.values() || []).sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
      if (dayMeals.length === 0) continue;
      const tableData = dayMeals.map((m) => [
        MEAL_LABELS[m.mealType] || m.mealType, m.name,
        m.foods.map((f) => `${f.name} (${Math.round(f.qty)}g)`).join(", "),
        `${Math.round(m.foods.reduce((s, f) => s + f.cals, 0))}`,
      ]);
      if (startY > 250) { doc.addPage(); startY = 20; }
      doc.setFontSize(12); doc.setTextColor(5, 150, 105); doc.text(DAY_NAMES[day - 1], 14, startY); startY += 2;
      autoTable(doc, {
        startY, head: [["Meal", "Description", "Foods", "kcal"]], body: tableData, theme: "grid",
        headStyles: { fillColor: [5, 150, 105], fontSize: 8 }, bodyStyles: { fontSize: 7 },
        columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 35 }, 2: { cellWidth: 100 }, 3: { cellWidth: 18 } },
        margin: { left: 14 },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 8;
    }
  } else if (type === "grocery") {
    const glRes = await query("SELECT * FROM grocery_lists WHERE id=$1", [plan.grocery_list_id]);
    if (glRes.rows.length === 0) return new Response("Not found", { status: 404 });
    const gl = glRes.rows[0];

    const itemsRes = await query(
      `SELECT gi.*, f.name as food_name, f.category, f.unit, f.store
       FROM grocery_items gi JOIN foods f ON f.id = gi.food_id WHERE gi.grocery_list_id=$1`, [gl.id]
    );

    doc.setFontSize(20); doc.setTextColor(5, 150, 105); doc.text("NutriPlan SA", 14, 20);
    doc.setFontSize(16); doc.setTextColor(30, 30, 30); doc.text(`Grocery List - ${plan.client_name}`, 14, 32);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100);
    doc.text(`Week of ${new Date(plan.week_start).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`, 14, 40);
    doc.setFontSize(11); doc.setTextColor(30, 30, 30);
    doc.text(`Budget: R${Number(gl.budget_zar).toFixed(0)} | Total: R${Number(gl.total_cost).toFixed(2)} | ${gl.budget_zar >= gl.total_cost ? "Under" : "Over"} Budget: R${Math.abs(gl.budget_zar - gl.total_cost).toFixed(2)}`, 14, 50);

    const grouped = new Map<string, typeof itemsRes.rows>();
    for (const item of itemsRes.rows) { const g = grouped.get(item.category) || []; g.push(item); grouped.set(item.category, g); }

    const tableData: string[][] = [];
    for (const [cat, items] of grouped) {
      tableData.push([CATEGORY_LABELS[cat] || cat, "", "", ""]);
      for (const item of items) {
        const qty = Number(item.quantity_kg) >= 1 ? `${Number(item.quantity_kg).toFixed(1)} ${item.unit}` : `${Math.round(Number(item.quantity_kg) * 1000)}g`;
        tableData.push([item.food_name, item.store || "", qty, `R${Number(item.cost).toFixed(2)}`]);
      }
    }
    tableData.push(["TOTAL", "", "", `R${Number(gl.total_cost).toFixed(2)}`]);

    autoTable(doc, {
      startY: 58, head: [["Item", "Store", "Quantity", "Cost"]], body: tableData, theme: "grid",
      headStyles: { fillColor: [5, 150, 105], fontSize: 9 }, bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 35 }, 2: { cellWidth: 35 }, 3: { cellWidth: 30 } },
      margin: { left: 14 },
    });
  } else {
    return new Response("Invalid type", { status: 400 });
  }

  const pdfBytes = doc.output("arraybuffer");
  const filename = type === "mealplan"
    ? `meal-plan-${plan.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`
    : `grocery-list-${plan.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new Response(pdfBytes, {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"` },
  });
}
