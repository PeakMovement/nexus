import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deletePlan } from "@/app/actions";

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_ORDER = ["breakfast", "snack1", "lunch", "snack2", "dinner"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  snack1: "Morning Snack",
  lunch: "Lunch",
  snack2: "Afternoon Snack",
  dinner: "Dinner",
};

export default async function MealPlanPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>;
}) {
  const { id, planId } = await params;

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    include: {
      client: true,
      meals: {
        include: {
          foods: {
            include: { food: true },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }],
      },
    },
  });

  if (!plan || plan.clientId !== id) notFound();

  // Group meals by day
  const mealsByDay = new Map<number, typeof plan.meals>();
  for (const meal of plan.meals) {
    const dayMeals = mealsByDay.get(meal.dayOfWeek) || [];
    dayMeals.push(meal);
    mealsByDay.set(meal.dayOfWeek, dayMeals);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/clients/${id}`}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to {plan.client.name}
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Meal Plan - {plan.client.name}
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
        <div className="flex gap-3">
          <Link
            href={`/clients/${id}/plans/${planId}/grocery`}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
          >
            View Grocery List
          </Link>
          <a
            href={`/api/export/${id}?type=mealplan&planId=${planId}`}
            className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors text-sm font-medium"
          >
            Export PDF
          </a>
          <form
            action={async () => {
              "use server";
              await deletePlan(planId, id);
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Daily Targets Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-amber-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">
            {plan.dailyCalories}
          </div>
          <div className="text-xs text-gray-500">kcal/day</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {plan.dailyProtein}g
          </div>
          <div className="text-xs text-gray-500">Protein</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {plan.dailyCarbs}g
          </div>
          <div className="text-xs text-gray-500">Carbs</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {plan.dailyFat}g
          </div>
          <div className="text-xs text-gray-500">Fat</div>
        </div>
      </div>

      {/* 7-Day Plan */}
      <div className="space-y-6">
        {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
          const dayMeals = mealsByDay.get(day) || [];
          // Sort meals by meal order
          const sortedMeals = [...dayMeals].sort(
            (a, b) =>
              MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)
          );

          // Calculate day totals
          let dayCals = 0;
          let dayProtein = 0;
          let dayCarbs = 0;
          let dayFat = 0;
          for (const meal of sortedMeals) {
            for (const mf of meal.foods) {
              const mult = mf.quantity / 100;
              dayCals += mf.food.caloriesPer100g * mult;
              dayProtein += mf.food.proteinPer100g * mult;
              dayCarbs += mf.food.carbsPer100g * mult;
              dayFat += mf.food.fatPer100g * mult;
            }
          }

          return (
            <div
              key={day}
              className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden"
            >
              <div className="bg-emerald-600 text-white px-6 py-3 flex justify-between items-center">
                <h3 className="font-semibold">{DAY_NAMES[day - 1]}</h3>
                <span className="text-sm opacity-90">
                  {Math.round(dayCals)} kcal | P:{Math.round(dayProtein)}g | C:
                  {Math.round(dayCarbs)}g | F:{Math.round(dayFat)}g
                </span>
              </div>
              <div className="divide-y divide-gray-100">
                {sortedMeals.map((meal) => (
                  <div key={meal.id} className="px-6 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-32 shrink-0">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          {MEAL_LABELS[meal.mealType] || meal.mealType}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 mb-1">
                          {meal.name}
                        </div>
                        <div className="text-sm text-gray-500 space-y-0.5">
                          {meal.foods.map((mf) => (
                            <div key={mf.id}>
                              {mf.food.name} - {Math.round(mf.quantity)}g
                              <span className="text-gray-400 ml-2">
                                ({Math.round((mf.food.caloriesPer100g * mf.quantity) / 100)} kcal)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {sortedMeals.length === 0 && (
                  <div className="px-6 py-4 text-gray-400 text-sm">
                    No meals planned
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
