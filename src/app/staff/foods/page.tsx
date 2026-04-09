import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, initDb } from "@/lib/db";
import Link from "next/link";
import { FoodPriceRow } from "@/components/food-price-row";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  protein: "Proteins", carb: "Carbs & Grains", fat: "Fats & Oils",
  vegetable: "Vegetables", fruit: "Fruit", dairy: "Dairy", pantry: "Pantry",
};

const CATEGORY_ORDER = ["protein", "carb", "fat", "vegetable", "fruit", "dairy", "pantry"];

export default async function FoodPricesPage() {
  await initDb();
  const cookieStore = await cookies();
  const staffId = cookieStore.get("staff_id")?.value;
  const adminId = cookieStore.get("admin_id")?.value;

  if (!staffId && !adminId) {
    redirect("/staff");
  }

  const foodsRes = await query(
    "SELECT * FROM foods ORDER BY category, name"
  );
  const foods = foodsRes.rows;

  const grouped = new Map<string, typeof foods>();
  for (const food of foods) {
    const group = grouped.get(food.category) || [];
    group.push(food);
    grouped.set(food.category, group);
  }

  const sortedCategories = CATEGORY_ORDER.filter((c) => grouped.has(c));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Food Prices</h1>
          <p className="text-gray-500 text-sm mt-1">Update prices to keep meal plans accurate</p>
        </div>
        <Link
          href={staffId ? "/staff/dashboard" : "/admin"}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Back
        </Link>
      </div>

      <div className="space-y-8">
        {sortedCategories.map((category) => {
          const items = grouped.get(category)!;
          return (
            <div key={category} className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">{CATEGORY_LABELS[category] || category}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {items.map((food) => (
                  <FoodPriceRow key={food.id} food={{
                    id: food.id as string,
                    name: food.name as string,
                    price_per_kg: Number(food.price_per_kg),
                    store: (food.store as string | null),
                    unit: food.unit as string,
                  }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
