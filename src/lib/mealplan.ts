import type { MacroTargets } from "./nutrition";
import type { GrocerySelection } from "./grocery";

export interface MealEntry {
  dayOfWeek: number;
  mealType: string;
  name: string;
  foods: { foodId: string; name: string; quantity: number }[];
}

const MEAL_TYPES = ["breakfast", "snack1", "lunch", "snack2", "dinner"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const MEAL_TEMPLATES: Record<string, { proteinPct: number; carbPct: number; fatPct: number }> = {
  breakfast: { proteinPct: 0.2, carbPct: 0.25, fatPct: 0.2 },
  snack1: { proteinPct: 0.1, carbPct: 0.1, fatPct: 0.15 },
  lunch: { proteinPct: 0.3, carbPct: 0.3, fatPct: 0.25 },
  snack2: { proteinPct: 0.1, carbPct: 0.1, fatPct: 0.15 },
  dinner: { proteinPct: 0.3, carbPct: 0.25, fatPct: 0.25 },
};

/**
 * Generate a 7-day meal plan from the grocery list items.
 */
export function generateMealPlan(
  groceryItems: GrocerySelection[],
  macros: MacroTargets
): MealEntry[] {
  const meals: MealEntry[] = [];

  // Categorize available foods
  const proteinFoods = groceryItems.filter((f) => f.category === "protein");
  const carbFoods = groceryItems.filter((f) => f.category === "carb");
  const fatFoods = groceryItems.filter((f) => f.category === "fat");
  const vegFoods = groceryItems.filter((f) => f.category === "vegetable" || f.category === "fruit");
  const dairyFoods = groceryItems.filter((f) => f.category === "dairy");
  const pantryFoods = groceryItems.filter((f) => f.category === "pantry");

  // Track remaining quantities (in grams for the week)
  const remaining = new Map<string, number>();
  for (const item of groceryItems) {
    remaining.set(item.foodId, (item.quantityKg * 1000));
  }

  function pickFood(foods: GrocerySelection[], targetGrams: number): { foodId: string; name: string; quantity: number } | null {
    for (const food of foods) {
      const left = remaining.get(food.foodId) || 0;
      if (left >= targetGrams * 0.3) {
        const used = Math.min(targetGrams, left);
        remaining.set(food.foodId, left - used);
        return { foodId: food.foodId, name: food.name, quantity: Math.round(used) };
      }
    }
    // If nothing has enough, use whatever is available
    for (const food of foods) {
      const left = remaining.get(food.foodId) || 0;
      if (left > 10) {
        const used = Math.min(targetGrams, left);
        remaining.set(food.foodId, left - used);
        return { foodId: food.foodId, name: food.name, quantity: Math.round(used) };
      }
    }
    return null;
  }

  for (let day = 1; day <= 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const template = MEAL_TEMPLATES[mealType];
      const mealFoods: { foodId: string; name: string; quantity: number }[] = [];

      // Calculate target grams for this meal based on macro distribution
      const proteinTarget = (macros.proteinG * template.proteinPct * 1000) /
        (proteinFoods[0]?.proteinG ? (proteinFoods[0].proteinG / proteinFoods[0].quantityKg / 1000) : 200);
      const carbTarget = (macros.carbsG * template.carbPct * 1000) /
        (carbFoods[0]?.carbsG ? (carbFoods[0].carbsG / carbFoods[0].quantityKg / 1000) : 700);

      // Add protein source
      const proteinGrams = Math.round(macros.proteinG * template.proteinPct * 1000 /
        (proteinFoods.length > 0 ? proteinFoods[0].proteinG / proteinFoods[0].quantityKg : 200));
      const proteinPick = pickFood(proteinFoods, Math.min(250, Math.max(50, proteinGrams)));
      if (proteinPick) mealFoods.push(proteinPick);

      // Add carb source
      const carbGrams = Math.round(macros.carbsG * template.carbPct * 1000 /
        (carbFoods.length > 0 ? carbFoods[0].carbsG / carbFoods[0].quantityKg : 700));
      const carbPick = pickFood(carbFoods, Math.min(300, Math.max(50, carbGrams)));
      if (carbPick) mealFoods.push(carbPick);

      // Add fat source for main meals
      if (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner") {
        const fatPick = pickFood(fatFoods, 15);
        if (fatPick) mealFoods.push(fatPick);
      }

      // Add vegetables to lunch and dinner
      if ((mealType === "lunch" || mealType === "dinner") && vegFoods.length > 0) {
        const vegPick = pickFood(vegFoods, 150);
        if (vegPick) mealFoods.push(vegPick);
      }

      // Add dairy to snacks if available
      if ((mealType === "snack1" || mealType === "snack2") && dairyFoods.length > 0) {
        const dairyPick = pickFood(dairyFoods, 100);
        if (dairyPick) mealFoods.push(dairyPick);
      }

      // Generate a descriptive meal name
      const mealName = generateMealName(mealType, mealFoods, day);

      meals.push({
        dayOfWeek: day,
        mealType,
        name: mealName,
        foods: mealFoods,
      });
    }
  }

  return meals;
}

function generateMealName(
  mealType: string,
  foods: { name: string }[],
  day: number
): string {
  const foodNames = foods.map((f) => f.name);
  if (foodNames.length === 0) return `${DAY_NAMES[day - 1]} ${mealType}`;

  const mainFood = foodNames[0];
  const secondary = foodNames.length > 1 ? ` with ${foodNames.slice(1).join(" & ")}` : "";

  const mealLabel = mealType === "snack1" || mealType === "snack2" ? "Snack" :
    mealType.charAt(0).toUpperCase() + mealType.slice(1);

  return `${mainFood}${secondary}`;
}

export { DAY_NAMES, MEAL_TYPES };
