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

// What fraction of daily macros each meal should target
const MEAL_SPLITS: Record<string, { protein: number; carbs: number; fat: number }> = {
  breakfast: { protein: 0.20, carbs: 0.25, fat: 0.20 },
  snack1:    { protein: 0.10, carbs: 0.10, fat: 0.15 },
  lunch:     { protein: 0.30, carbs: 0.30, fat: 0.25 },
  snack2:    { protein: 0.10, carbs: 0.10, fat: 0.15 },
  dinner:    { protein: 0.30, carbs: 0.25, fat: 0.25 },
};

interface FoodWithMacros {
  foodId: string;
  name: string;
  category: string;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  calsPer100g: number;
  totalAvailableG: number;
}

/**
 * Calculate how many grams of a food to use to hit a target macro (in grams).
 */
function gramsForMacro(food: FoodWithMacros, targetMacroG: number, macroType: "protein" | "carbs" | "fat"): number {
  const per100 = macroType === "protein" ? food.proteinPer100g
    : macroType === "carbs" ? food.carbsPer100g
    : food.fatPer100g;
  if (per100 <= 0) return 0;
  return Math.round((targetMacroG / per100) * 100);
}

/**
 * Generate a 7-day meal plan with proper food variety and accurate portions.
 */
export function generateMealPlan(
  groceryItems: GrocerySelection[],
  macros: MacroTargets
): MealEntry[] {
  const meals: MealEntry[] = [];

  // Build food list with macro info
  const allFoods: FoodWithMacros[] = groceryItems.map((item) => ({
    foodId: item.foodId,
    name: item.name,
    category: item.category,
    proteinPer100g: (item.proteinG / (item.quantityKg * 10)), // per 100g
    carbsPer100g: (item.carbsG / (item.quantityKg * 10)),
    fatPer100g: (item.fatG / (item.quantityKg * 10)),
    calsPer100g: (item.calories / (item.quantityKg * 10)),
    totalAvailableG: item.quantityKg * 1000,
  }));

  const byCategory = (cat: string) => allFoods.filter((f) => f.category === cat);

  const proteins = byCategory("protein");
  const carbs = byCategory("carb");
  const fats = byCategory("fat");
  const vegs = [...byCategory("vegetable"), ...byCategory("fruit")];
  const dairy = byCategory("dairy");
  const pantry = byCategory("pantry");

  // Track how much of each food we've used across all 7 days
  const used = new Map<string, number>();
  const getRemaining = (f: FoodWithMacros) => f.totalAvailableG - (used.get(f.foodId) || 0);
  const useFood = (f: FoodWithMacros, grams: number) => {
    const actual = Math.min(grams, getRemaining(f));
    if (actual <= 5) return 0;
    used.set(f.foodId, (used.get(f.foodId) || 0) + actual);
    return actual;
  };

  // Rotate through foods for variety — each day starts at a different offset
  function pickFrom(foods: FoodWithMacros[], dayOffset: number, minGrams: number): FoodWithMacros | null {
    if (foods.length === 0) return null;
    for (let i = 0; i < foods.length; i++) {
      const idx = (dayOffset + i) % foods.length;
      if (getRemaining(foods[idx]) >= minGrams) return foods[idx];
    }
    // Fallback: anything with stock
    return foods.find((f) => getRemaining(f) > 10) || null;
  }

  for (let day = 1; day <= 7; day++) {
    for (const mealType of MEAL_TYPES) {
      const split = MEAL_SPLITS[mealType];
      const mealFoods: { foodId: string; name: string; quantity: number }[] = [];

      const targetProteinG = macros.proteinG * split.protein;
      const targetCarbsG = macros.carbsG * split.carbs;
      const targetFatG = macros.fatG * split.fat;

      // 1. Protein source — rotate by day + meal offset
      const proteinOffset = (day - 1) * 2 + MEAL_TYPES.indexOf(mealType);
      const protein = pickFrom(proteins, proteinOffset, 30);
      if (protein) {
        let grams = gramsForMacro(protein, targetProteinG, "protein");
        grams = Math.max(50, Math.min(grams, 250)); // clamp to realistic portions
        const actual = useFood(protein, grams);
        if (actual > 0) mealFoods.push({ foodId: protein.foodId, name: protein.name, quantity: actual });
      }

      // 2. Carb source — rotate differently from protein
      const carbOffset = (day - 1) * 3 + MEAL_TYPES.indexOf(mealType);
      const carb = pickFrom(carbs, carbOffset, 30);
      if (carb) {
        let grams = gramsForMacro(carb, targetCarbsG, "carbs");
        grams = Math.max(40, Math.min(grams, 300));
        const actual = useFood(carb, grams);
        if (actual > 0) mealFoods.push({ foodId: carb.foodId, name: carb.name, quantity: actual });
      }

      // 3. Fat source for main meals only
      if (mealType === "breakfast" || mealType === "lunch" || mealType === "dinner") {
        const fat = pickFrom(fats, day - 1, 5);
        if (fat) {
          let grams = gramsForMacro(fat, targetFatG, "fat");
          grams = Math.max(5, Math.min(grams, 30)); // fats are calorie-dense
          const actual = useFood(fat, grams);
          if (actual > 0) mealFoods.push({ foodId: fat.foodId, name: fat.name, quantity: actual });
        }
      }

      // 4. Vegetables for lunch and dinner
      if (mealType === "lunch" || mealType === "dinner") {
        const veg = pickFrom(vegs, (day - 1) + (mealType === "dinner" ? 1 : 0), 50);
        if (veg) {
          const actual = useFood(veg, 120);
          if (actual > 0) mealFoods.push({ foodId: veg.foodId, name: veg.name, quantity: actual });
        }
      }

      // 5. Dairy for snacks, fruit for AM snack
      if (mealType === "snack1" || mealType === "snack2") {
        const snackSource = mealType === "snack1"
          ? pickFrom([...dairy, ...vegs.filter((v) => v.category === "fruit")], day - 1, 50)
          : pickFrom([...dairy, ...pantry], day - 1, 50);
        if (snackSource) {
          const actual = useFood(snackSource, 150);
          if (actual > 0) mealFoods.push({ foodId: snackSource.foodId, name: snackSource.name, quantity: actual });
        }
      }

      // 6. Add pantry item to dinner occasionally
      if (mealType === "dinner" && day % 2 === 0 && pantry.length > 0) {
        const p = pickFrom(pantry, day - 1, 50);
        if (p) {
          const actual = useFood(p, 100);
          if (actual > 0) mealFoods.push({ foodId: p.foodId, name: p.name, quantity: actual });
        }
      }

      const mealName = buildMealName(mealFoods);

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

function buildMealName(foods: { name: string }[]): string {
  if (foods.length === 0) return "Rest";
  if (foods.length === 1) return foods[0].name;
  return `${foods[0].name} with ${foods.slice(1).map((f) => f.name).join(" & ")}`;
}

export { DAY_NAMES, MEAL_TYPES };
