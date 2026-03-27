import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast", snack1: "AM Snack", lunch: "Lunch", snack2: "PM Snack", dinner: "Dinner",
};
const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];
const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins", carb: "Carbs & Grains", fat: "Fats & Oils",
  vegetable: "Vegetables", fruit: "Fruit", dairy: "Dairy", pantry: "Pantry",
};

// Brand colours
const BRAND = { r: 5, g: 150, b: 105 }; // emerald
const BRAND_DARK = { r: 4, g: 120, b: 87 };
const GRAY = { r: 100, g: 100, b: 100 };
const DARK = { r: 30, g: 30, b: 30 };

function drawHeader(doc: jsPDF, clientName: string, subtitle: string, weekStart: string) {
  // Green header bar
  doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
  doc.rect(0, 0, 210, 38, "F");

  // Brand name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("NutriPlan SA", 14, 16);

  // Subtitle
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 24);

  // Client name & date on right
  doc.setFontSize(10);
  doc.text(clientName, 196, 16, { align: "right" });
  doc.setFontSize(8);
  const dateStr = new Date(weekStart).toLocaleDateString("en-ZA", {
    day: "numeric", month: "long", year: "numeric",
  });
  doc.text(`Week of ${dateStr}`, 196, 23, { align: "right" });

  // Reset
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFont("helvetica", "normal");
}

function drawFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text("NutriPlan SA - Budget Meal Planning for South African Coaches", 14, pageHeight - 8);
  doc.text(`Page ${pageNum}`, 196, pageHeight - 8, { align: "right" });
}

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
    `SELECT mp.*, c.name as client_name, c.weight_kg, c.goal FROM meal_plans mp
     JOIN clients c ON c.id = mp.client_id WHERE mp.id=$1 AND mp.client_id=$2`,
    [planId, clientId]
  );
  if (planRes.rows.length === 0) return new Response("Not found", { status: 404 });
  const plan = planRes.rows[0];

  const doc = new jsPDF();
  let pageNum = 1;

  if (type === "mealplan") {
    const mealsRes = await query(
      `SELECT m.*, mf.quantity, f.name as food_name,
              f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g
       FROM meals m LEFT JOIN meal_foods mf ON mf.meal_id = m.id
       LEFT JOIN foods f ON f.id = mf.food_id
       WHERE m.meal_plan_id=$1 ORDER BY m.day_of_week, m.meal_type`,
      [planId]
    );

    // Group meals by day
    const mealsByDay = new Map<number, Map<string, {
      name: string; mealType: string;
      foods: { name: string; qty: number; cals: number; protein: number; carbs: number; fat: number }[];
    }>>();

    for (const row of mealsRes.rows) {
      if (!mealsByDay.has(row.day_of_week)) mealsByDay.set(row.day_of_week, new Map());
      const d = mealsByDay.get(row.day_of_week)!;
      if (!d.has(row.id)) d.set(row.id, { name: row.name, mealType: row.meal_type, foods: [] });
      if (row.food_name) {
        d.get(row.id)!.foods.push({
          name: row.food_name, qty: row.quantity,
          cals: (row.calories_per_100g * row.quantity) / 100,
          protein: (row.protein_per_100g * row.quantity) / 100,
          carbs: (row.carbs_per_100g * row.quantity) / 100,
          fat: (row.fat_per_100g * row.quantity) / 100,
        });
      }
    }

    // Page 1: Header + macro summary
    drawHeader(doc, plan.client_name, "Weekly Meal Plan", plan.week_start);

    // Goal label
    const goalLabels: Record<string, string> = { lose_fat: "Fat Loss", maintain: "Maintenance", build_muscle: "Muscle Building" };
    doc.setFontSize(9);
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    doc.text(`Goal: ${goalLabels[plan.goal] || plan.goal} | Weight: ${plan.weight_kg}kg`, 14, 48);

    // Daily targets box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, 53, 182, 18, 3, 3, "F");

    doc.setFontSize(9);
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.setFont("helvetica", "bold");
    doc.text("Daily Targets", 20, 61);
    doc.setFont("helvetica", "normal");

    const targets = [
      { label: "Calories", value: `${plan.daily_calories} kcal`, x: 70 },
      { label: "Protein", value: `${plan.daily_protein}g`, x: 110 },
      { label: "Carbs", value: `${plan.daily_carbs}g`, x: 145 },
      { label: "Fat", value: `${plan.daily_fat}g`, x: 175 },
    ];

    for (const t of targets) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
      doc.text(t.value, t.x, 61);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
      doc.text(t.label, t.x, 67);
      doc.setFontSize(9);
    }

    let startY = 80;

    for (let day = 1; day <= 7; day++) {
      const dayMeals = Array.from(mealsByDay.get(day)?.values() || [])
        .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
      if (dayMeals.length === 0) continue;

      // Calculate daily totals
      let dayCals = 0, dayP = 0, dayC = 0, dayF = 0;
      for (const m of dayMeals) for (const f of m.foods) {
        dayCals += f.cals; dayP += f.protein; dayC += f.carbs; dayF += f.fat;
      }

      // Check page space
      const neededHeight = 14 + dayMeals.length * 14 + 10;
      if (startY + neededHeight > 270) {
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        startY = 20;
      }

      // Day header bar
      doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
      doc.rect(14, startY, 182, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(DAY_NAMES[day - 1].toUpperCase(), 18, startY + 5.5);

      // Day totals in header
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${Math.round(dayCals)} kcal | P: ${Math.round(dayP)}g | C: ${Math.round(dayC)}g | F: ${Math.round(dayF)}g`,
        192, startY + 5.5, { align: "right" }
      );

      startY += 10;

      // Meal table
      const tableData = dayMeals.map((m) => {
        const mealCals = m.foods.reduce((s, f) => s + f.cals, 0);
        const mealP = m.foods.reduce((s, f) => s + f.protein, 0);
        const mealC = m.foods.reduce((s, f) => s + f.carbs, 0);
        const mealF = m.foods.reduce((s, f) => s + f.fat, 0);

        return [
          MEAL_LABELS[m.mealType] || m.mealType,
          m.foods.map((f) => `${f.name} (${Math.round(f.qty)}g)`).join("\n"),
          `${Math.round(mealCals)}`,
          `${Math.round(mealP)}g`,
          `${Math.round(mealC)}g`,
          `${Math.round(mealF)}g`,
        ];
      });

      autoTable(doc, {
        startY,
        head: [["Meal", "Foods & Portions", "kcal", "P", "C", "F"]],
        body: tableData,
        theme: "plain",
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [60, 60, 60],
          fontSize: 7,
          fontStyle: "bold",
          cellPadding: 2,
        },
        bodyStyles: { fontSize: 7, cellPadding: 2, textColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 22, fontStyle: "bold", textColor: [BRAND_DARK.r, BRAND_DARK.g, BRAND_DARK.b] },
          1: { cellWidth: 100 },
          2: { cellWidth: 14, halign: "center" },
          3: { cellWidth: 14, halign: "center" },
          4: { cellWidth: 14, halign: "center" },
          5: { cellWidth: 14, halign: "center" },
        },
        margin: { left: 14, right: 14 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 6;
    }

    drawFooter(doc, pageNum);

  } else if (type === "grocery") {
    const glRes = await query("SELECT * FROM grocery_lists WHERE id=$1", [plan.grocery_list_id]);
    if (glRes.rows.length === 0) return new Response("Not found", { status: 404 });
    const gl = glRes.rows[0];

    const itemsRes = await query(
      `SELECT gi.*, f.name as food_name, f.category, f.unit, f.store
       FROM grocery_items gi JOIN foods f ON f.id = gi.food_id WHERE gi.grocery_list_id=$1`,
      [gl.id]
    );

    drawHeader(doc, plan.client_name, "Weekly Grocery List", plan.week_start);

    // Budget summary bar
    const budgetUsed = Number(gl.total_cost);
    const budgetTotal = Number(gl.budget_zar);
    const budgetPct = Math.min((budgetUsed / budgetTotal) * 100, 100);
    const isUnder = budgetTotal >= budgetUsed;

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(14, 46, 182, 22, 3, 3, "F");

    // Budget bar background
    doc.setFillColor(220, 220, 220);
    doc.roundedRect(20, 58, 170, 5, 2, 2, "F");

    // Budget bar fill
    doc.setFillColor(
      isUnder ? BRAND.r : 220,
      isUnder ? BRAND.g : 50,
      isUnder ? BRAND.b : 50
    );
    doc.roundedRect(20, 58, Math.max(4, (170 * budgetPct) / 100), 5, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.text(`Budget: R${budgetTotal.toFixed(0)}`, 20, 55);
    doc.setTextColor(BRAND.r, BRAND.g, BRAND.b);
    doc.text(`Total: R${budgetUsed.toFixed(2)}`, 90, 55);
    doc.setTextColor(isUnder ? BRAND.r : 220, isUnder ? BRAND.g : 50, isUnder ? BRAND.b : 50);
    doc.text(
      `${isUnder ? "Saved" : "Over"}: R${Math.abs(budgetTotal - budgetUsed).toFixed(2)}`,
      160, 55
    );

    // Group by store for shopping convenience
    const byStore = new Map<string, typeof itemsRes.rows>();
    for (const item of itemsRes.rows) {
      const store = item.store || "Other";
      const group = byStore.get(store) || [];
      group.push(item);
      byStore.set(store, group);
    }

    let startY = 76;

    // Store-grouped list with checkboxes
    for (const [store, items] of byStore) {
      const storeTotal = items.reduce((sum, i) => sum + Number(i.cost), 0);

      if (startY + 20 + items.length * 10 > 270) {
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        startY = 20;
      }

      // Store header
      doc.setFillColor(BRAND.r, BRAND.g, BRAND.b);
      doc.rect(14, startY, 182, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(store.toUpperCase(), 18, startY + 5.5);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(`R${storeTotal.toFixed(2)}`, 192, startY + 5.5, { align: "right" });
      startY += 10;

      const tableData = items.map((item) => {
        const qty = Number(item.quantity_kg) >= 1
          ? `${Number(item.quantity_kg).toFixed(1)} ${item.unit}`
          : `${Math.round(Number(item.quantity_kg) * 1000)}g`;
        return [
          CATEGORY_LABELS[item.category] || item.category,
          item.food_name,
          qty,
          `R${Number(item.cost).toFixed(2)}`,
        ];
      });

      autoTable(doc, {
        startY,
        head: [["Category", "Item", "Qty", "Cost"]],
        body: tableData,
        theme: "plain",
        headStyles: {
          fillColor: [245, 245, 245],
          textColor: [80, 80, 80],
          fontSize: 7,
          fontStyle: "bold",
          cellPadding: 2,
        },
        bodyStyles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
        columnStyles: {
          0: { cellWidth: 35, textColor: [GRAY.r, GRAY.g, GRAY.b], fontSize: 7 },
          1: { cellWidth: 85, fontStyle: "bold" },
          2: { cellWidth: 28, halign: "center" },
          3: { cellWidth: 28, halign: "right" },
        },
        margin: { left: 14, right: 14 },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        didDrawCell: (data) => {
          // Draw checkbox before item name
          if (data.column.index === 1 && data.section === "body") {
            const x = data.cell.x - 4;
            const y = data.cell.y + 2;
            doc.setDrawColor(180, 180, 180);
            doc.rect(x, y, 3, 3);
          }
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      startY = (doc as any).lastAutoTable.finalY + 8;
    }

    // Also add a by-category summary at the end
    if (startY + 40 > 270) {
      drawFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      startY = 20;
    }

    // Category cost breakdown
    const byCategory = new Map<string, number>();
    for (const item of itemsRes.rows) {
      byCategory.set(item.category, (byCategory.get(item.category) || 0) + Number(item.cost));
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.text("Cost Breakdown by Category", 14, startY);
    startY += 4;

    const catData = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, cost]) => [
        CATEGORY_LABELS[cat] || cat,
        `R${cost.toFixed(2)}`,
        `${Math.round((cost / budgetUsed) * 100)}%`,
      ]);

    catData.push(["TOTAL", `R${budgetUsed.toFixed(2)}`, "100%"]);

    autoTable(doc, {
      startY,
      head: [["Category", "Cost", "% of Total"]],
      body: catData,
      theme: "plain",
      headStyles: {
        fillColor: [240, 240, 240], textColor: [60, 60, 60],
        fontSize: 7, fontStyle: "bold", cellPadding: 2,
      },
      bodyStyles: { fontSize: 8, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: 30, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });

    drawFooter(doc, pageNum);

  } else {
    return new Response("Invalid type", { status: 400 });
  }

  const pdfBytes = doc.output("arraybuffer");
  const filename = type === "mealplan"
    ? `meal-plan-${plan.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`
    : `grocery-list-${plan.client_name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
