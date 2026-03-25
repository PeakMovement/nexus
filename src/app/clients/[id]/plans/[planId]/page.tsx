import Link from "next/link";
import { notFound } from "next/navigation";
import { query } from "@/lib/db";
import { deletePlan } from "@/app/actions";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast", snack1: "Morning Snack", lunch: "Lunch", snack2: "Afternoon Snack", dinner: "Dinner",
};

export default async function MealPlanPage({ params }: { params: Promise<{ id: string; planId: string }> }) {
  const { id, planId } = await params;

  const planRes = await query(
    `SELECT mp.*, c.name as client_name FROM meal_plans mp
     JOIN clients c ON c.id = mp.client_id WHERE mp.id=$1 AND mp.client_id=$2`, [planId, id]
  );
  if (planRes.rows.length === 0) notFound();
  const plan = planRes.rows[0];

  const mealsRes = await query(
    `SELECT m.*, mf.id as mf_id, mf.quantity, f.name as food_name, f.calories_per_100g, f.protein_per_100g, f.carbs_per_100g, f.fat_per_100g
     FROM meals m
     LEFT JOIN meal_foods mf ON mf.meal_id = m.id
     LEFT JOIN foods f ON f.id = mf.food_id
     WHERE m.meal_plan_id=$1
     ORDER BY m.day_of_week, m.meal_type`, [planId]
  );

  // Group by day and meal
  const mealsByDay = new Map<number, Map<string, { id: string; name: string; mealType: string; foods: { id: string; name: string; quantity: number; cals: number; protein: number; carbs: number; fat: number }[] }>>();
  for (const row of mealsRes.rows) {
    if (!mealsByDay.has(row.day_of_week)) mealsByDay.set(row.day_of_week, new Map());
    const dayMap = mealsByDay.get(row.day_of_week)!;
    if (!dayMap.has(row.id)) {
      dayMap.set(row.id, { id: row.id, name: row.name, mealType: row.meal_type, foods: [] });
    }
    if (row.mf_id) {
      dayMap.get(row.id)!.foods.push({
        id: row.mf_id, name: row.food_name, quantity: row.quantity,
        cals: (row.calories_per_100g * row.quantity) / 100,
        protein: (row.protein_per_100g * row.quantity) / 100,
        carbs: (row.carbs_per_100g * row.quantity) / 100,
        fat: (row.fat_per_100g * row.quantity) / 100,
      });
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/clients/${id}`} className="text-sm text-emerald-600 hover:text-emerald-700">&larr; Back to {plan.client_name}</Link>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Meal Plan - {plan.client_name}</h1>
          <p className="text-gray-500 text-sm">Week of {new Date(plan.week_start).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/clients/${id}/plans/${planId}/grocery`} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">View Grocery List</Link>
          <a href={`/api/export/${id}?type=mealplan&planId=${planId}`} className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium">Export PDF</a>
          <form action={async () => { "use server"; await deletePlan(planId, id); }}>
            <button type="submit" className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">Delete</button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-amber-600">{plan.daily_calories}</div><div className="text-xs text-gray-500">kcal/day</div></div>
        <div className="bg-red-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-red-600">{plan.daily_protein}g</div><div className="text-xs text-gray-500">Protein</div></div>
        <div className="bg-blue-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-blue-600">{plan.daily_carbs}g</div><div className="text-xs text-gray-500">Carbs</div></div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{plan.daily_fat}g</div><div className="text-xs text-gray-500">Fat</div></div>
      </div>

      <div className="space-y-6">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const dayMeals = Array.from(mealsByDay.get(day)?.values() || []);
          const sorted = [...dayMeals].sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType));
          let dayCals = 0, dayP = 0, dayC = 0, dayF = 0;
          for (const m of sorted) for (const f of m.foods) { dayCals += f.cals; dayP += f.protein; dayC += f.carbs; dayF += f.fat; }

          return (
            <div key={day} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              <div className="bg-emerald-600 text-white px-6 py-3 flex justify-between items-center">
                <h3 className="font-semibold">{DAY_NAMES[day - 1]}</h3>
                <span className="text-sm opacity-90">{Math.round(dayCals)} kcal | P:{Math.round(dayP)}g | C:{Math.round(dayC)}g | F:{Math.round(dayF)}g</span>
              </div>
              <div className="divide-y divide-gray-100">
                {sorted.map((meal) => (
                  <div key={meal.id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-32 shrink-0"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{MEAL_LABELS[meal.mealType] || meal.mealType}</span></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 mb-1">{meal.name}</div>
                        <div className="text-sm text-gray-500 space-y-0.5">
                          {meal.foods.map((f) => (
                            <div key={f.id}>{f.name} - {Math.round(f.quantity)}g <span className="text-gray-400 ml-2">({Math.round(f.cals)} kcal)</span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {sorted.length === 0 && <div className="px-6 py-4 text-gray-400 text-sm">No meals planned</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
