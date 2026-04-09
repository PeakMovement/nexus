import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";

const CATEGORY_ORDER = ["protein", "carb", "fat", "vegetable", "fruit", "dairy", "pantry"];
const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins", carb: "Carbs & Grains", fat: "Fats & Oils",
  vegetable: "Vegetables", fruit: "Fruit", dairy: "Dairy", pantry: "Pantry",
};

export default async function GroceryListPage({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const { id, planId } = await params;

  const planRes = await query(
    `SELECT mp.*, c.name as client_name, gl.id as gl_id, gl.total_cost, gl.budget_zar
     FROM meal_plans mp
     JOIN clients c ON c.id = mp.client_id
     JOIN grocery_lists gl ON gl.id = mp.grocery_list_id
     WHERE mp.id=$1 AND mp.client_id=$2`, [planId, id]
  );
  if (planRes.rows.length === 0) notFound();
  const plan = planRes.rows[0];

  const itemsRes = await query(
    `SELECT gi.*, f.name as food_name, f.category, f.unit, f.store
     FROM grocery_items gi
     JOIN foods f ON f.id = gi.food_id
     WHERE gi.grocery_list_id=$1`, [plan.gl_id]
  );

  const grouped = new Map<string, typeof itemsRes.rows>();
  for (const item of itemsRes.rows) {
    const group = grouped.get(item.category) || [];
    group.push(item);
    grouped.set(item.category, group);
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped.has(c));
  const budgetDiff = plan.budget_zar - plan.total_cost;
  const isUnderBudget = budgetDiff >= 0;

  return (
    <div>
      <div className="mb-6">
        <Link href={`/clients/${id}/plans/${planId}`} className="text-sm text-emerald-600 hover:text-emerald-700">&larr; Back to Meal Plan</Link>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Grocery List - {plan.client_name}</h1>
          <p className="text-gray-500 text-sm">Week of {new Date(plan.week_start).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <a href={`/api/export/${id}?type=grocery&planId=${planId}`} className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium self-start">Export PDF</a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
          <div className="text-sm text-gray-500">Budget</div>
          <div className="text-xl font-bold text-gray-800">R{Number(plan.budget_zar).toFixed(0)}</div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
          <div className="text-sm text-gray-500">Total Cost</div>
          <div className="text-xl font-bold text-emerald-600">R{Number(plan.total_cost).toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 text-center">
          <div className="text-sm text-gray-500">{isUnderBudget ? "Under Budget" : "Over Budget"}</div>
          <div className={`text-xl font-bold ${isUnderBudget ? "text-green-600" : "text-red-600"}`}>R{Math.abs(budgetDiff).toFixed(2)}</div>
        </div>
      </div>

      <div className="space-y-6">
        {sortedCategories.map((category) => {
          const items = grouped.get(category)!;
          const catTotal = items.reduce((sum, item) => sum + Number(item.cost), 0);
          return (
            <div key={category} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">{CATEGORY_LABELS[category] || category}</h3>
                <span className="text-sm font-medium text-gray-500">R{catTotal.toFixed(2)}</span>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((item) => (
                  <div key={item.id} className="px-6 py-3 flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{item.food_name}</span>
                      <span className="text-sm text-gray-400 ml-2">{item.store}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-600">
                        {Number(item.quantity_kg) >= 1 ? `${Number(item.quantity_kg).toFixed(1)} ${item.unit}` : `${Math.round(Number(item.quantity_kg) * 1000)}g`}
                      </span>
                      <span className="ml-4 font-medium text-gray-800">R{Number(item.cost).toFixed(2)}</span>
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
