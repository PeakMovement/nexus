import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  snack1: "AM Snack",
  lunch: "Lunch",
  snack2: "PM Snack",
  dinner: "Dinner",
};
const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];
const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins",
  carb: "Carbs & Grains",
  fat: "Fats & Oils",
  vegetable: "Vegetables",
  fruit: "Fruit",
  dairy: "Dairy",
  pantry: "Pantry",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const planId = searchParams.get("planId");

  if (!type || !planId) {
    return new Response("Missing type or planId", { status: 400 });
  }

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      client: true,
      meals: {
        include: { foods: { include: { food: true } } },
        orderBy: [{ dayOfWeek: "asc" }],
      },
      groceryList: {
        include: { items: { include: { food: true } } },
      },
    },
  });

  if (!plan || plan.clientId !== clientId) {
    return new Response("Not found", { status: 404 });
  }

  const doc = new jsPDF();

  if (type === "mealplan") {
    generateMealPlanPDF(doc, plan);
  } else if (type === "grocery") {
    generateGroceryPDF(doc, plan);
  } else {
    return new Response("Invalid type", { status: 400 });
  }

  const pdfBytes = doc.output("arraybuffer");
  const filename =
    type === "mealplan"
      ? `meal-plan-${plan.client.name.replace(/\s+/g, "-").toLowerCase()}.pdf`
      : `grocery-list-${plan.client.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

type FoodData = {
  name: string;
  category: string;
  unit: string;
  store: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  pricePerKg: number;
};

type MealFoodData = {
  id: string;
  food: FoodData;
  quantity: number;
};

type MealData = {
  id: string;
  dayOfWeek: number;
  mealType: string;
  name: string;
  foods: MealFoodData[];
};

type GroceryItemData = {
  id: string;
  food: FoodData;
  quantityKg: number;
  cost: number;
};

type PlanWithRelations = {
  id: string;
  clientId: string;
  weekStart: Date;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  client: { name: string };
  meals: MealData[];
  groceryList: {
    budgetZAR: number;
    totalCost: number;
    items: GroceryItemData[];
  } | null;
};

function generateMealPlanPDF(doc: jsPDF, plan: PlanWithRelations) {
  // Header
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105);
  doc.text("NutriPlan SA", 14, 20);

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(`Weekly Meal Plan - ${plan.client.name}`, 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Week of ${plan.weekStart.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    40
  );

  // Macro targets
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Daily Targets: ${plan.dailyCalories} kcal | Protein: ${plan.dailyProtein}g | Carbs: ${plan.dailyCarbs}g | Fat: ${plan.dailyFat}g`,
    14,
    50
  );

  // Build table data for each day
  let startY = 58;
  for (let day = 1; day <= 7; day++) {
    const dayMeals = plan.meals
      .filter((m) => m.dayOfWeek === day)
      .sort(
        (a, b) =>
          MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
      );

    if (dayMeals.length === 0) continue;

    const tableData = dayMeals.map((meal) => {
      const foodList = meal.foods
        .map(
          (mf) =>
            `${mf.food.name} (${Math.round(mf.quantity)}g)`
        )
        .join(", ");
      const cals = meal.foods.reduce(
        (sum, mf) => sum + (mf.food.caloriesPer100g * mf.quantity) / 100,
        0
      );
      return [
        MEAL_LABELS[meal.mealType] || meal.mealType,
        meal.name,
        foodList,
        `${Math.round(cals)}`,
      ];
    });

    // Check if we need a new page
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(12);
    doc.setTextColor(5, 150, 105);
    doc.text(DAY_NAMES[day - 1], 14, startY);
    startY += 2;

    autoTable(doc, {
      startY,
      head: [["Meal", "Description", "Foods", "kcal"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 100 },
        3: { cellWidth: 18 },
      },
      margin: { left: 14 },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startY = (doc as any).lastAutoTable.finalY + 8;
  }
}

function generateGroceryPDF(doc: jsPDF, plan: PlanWithRelations) {
  if (!plan.groceryList) return;

  // Header
  doc.setFontSize(20);
  doc.setTextColor(5, 150, 105);
  doc.text("NutriPlan SA", 14, 20);

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(`Grocery List - ${plan.client.name}`, 14, 32);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Week of ${plan.weekStart.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}`,
    14,
    40
  );

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(
    `Budget: R${plan.groceryList.budgetZAR.toFixed(0)} | Total: R${plan.groceryList.totalCost.toFixed(2)} | ${plan.groceryList.budgetZAR >= plan.groceryList.totalCost ? "Under" : "Over"} Budget: R${Math.abs(plan.groceryList.budgetZAR - plan.groceryList.totalCost).toFixed(2)}`,
    14,
    50
  );

  // Group items by category
  const grouped = new Map<
    string,
    typeof plan.groceryList.items
  >();
  for (const item of plan.groceryList.items) {
    const cat = item.food.category;
    const group = grouped.get(cat) || [];
    group.push(item);
    grouped.set(cat, group);
  }

  const tableData: (string | number)[][] = [];
  for (const [category, items] of grouped) {
    tableData.push([
      {
        content: CATEGORY_LABELS[category] || category,
        colSpan: 4,
        styles: { fontStyle: "bold", fillColor: [240, 240, 240] },
      } as unknown as string,
      "",
      "",
      "",
    ]);
    for (const item of items) {
      const qty =
        item.quantityKg >= 1
          ? `${item.quantityKg.toFixed(1)} ${item.food.unit}`
          : `${Math.round(item.quantityKg * 1000)}g`;
      tableData.push([
        item.food.name,
        item.food.store || "",
        qty,
        `R${item.cost.toFixed(2)}`,
      ]);
    }
  }

  // Total row
  tableData.push([
    {
      content: "TOTAL",
      colSpan: 3,
      styles: { fontStyle: "bold" },
    } as unknown as string,
    "",
    "",
    `R${plan.groceryList.totalCost.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 58,
    head: [["Item", "Store", "Quantity", "Cost"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [5, 150, 105], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
    },
    margin: { left: 14 },
  });
}
