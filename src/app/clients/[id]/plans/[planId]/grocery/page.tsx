import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

const CATEGORY_ORDER = [
  "protein",
  "carb",
  "fat",
  "vegetable",
  "fruit",
  "dairy",
  "pantry",
];
const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins",
  carb: "Carbs & Grains",
  fat: "Fats & Oils",
  vegetable: "Vegetables",
  fruit: "Fruit",
  dairy: "Dairy",
  pantry: "Pantry",
};

export default async function GroceryListPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id, planId } = await params;

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      client: true,
      groceryList: {
        include: {
          items: {
            include: { food: true },
          },
        },
      },
    },
  });

  if (!plan || plan.clientId !== id || !plan.groceryList) notFound();

  const { groceryList } = plan;

  // Group items by category
  const grouped = new Map<string, typeof groceryList.items>();
  for (const item of groceryList.items) {
    const cat = item.food.category;
    const group = grouped.get(cat) || [];
    group.push(item);
    grouped.set(cat, group);
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped.has(c));
  const budgetDiff = groceryList.budgetZAR - groceryList.totalCost;
  const isUnderBudget = budgetDiff >= 0;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/clients/${id}/plans/${planId}`}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to Meal Plan
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Grocery List - {plan.client.name}
          </h1>
          <p className="text-gray-500 text-sm">
            Week of{" "}
            {plan.weekStart.toLocaleDateString("en-ZA", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <a
          href={`/api/export/${id}?type=grocery&planId=${planId}`}
          className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium self-start"
        >
          Export PDF
        </a>
      </div>

      {/* Budget Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
          <div className="text-sm text-gray-500">Budget</div>
          <div className="text-xl font-bold text-gray-800">
            R{groceryList.budgetZAR.toFixed(0)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
          <div className="text-sm text-gray-500">Total Cost</div>
          <div className="text-xl font-bold text-emerald-600">
            R{groceryList.totalCost.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
          <div className="text-sm text-gray-500">
            {isUnderBudget ? "Under Budget" : "Over Budget"}
          </div>
          <div
            className={`text-xl font-bold ${isUnderBudget ? "text-green-600" : "text-red-600"}`}
          >
            R{Math.abs(budgetDiff).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Grocery Items by Category */}
      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const items = grouped.get(category)!;
          const categoryTotal = items.reduce((sum, item) => sum + item.cost, 0);
          return (
            <div
              key={category}
              className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden"
            >
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <span className="text-sm font-medium text-gray-500">
                  R{categoryTotal.toFixed(2)}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="px-6 py-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-gray-800">
                        {item.food.name}
                      </span>
                      <span className="text-sm text-gray-400 ml-2">
                        {item.food.store}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">
                        {item.quantityKg >= 1
                          ? `${item.quantityKg.toFixed(1)} ${item.food.unit}`
                          : `${Math.round(item.quantityKg * 1000)}g`}
                      </span>
                      <span className="ml-4 font-medium text-gray-800">
                        R{item.cost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
