import { query } from "./db";
import type { MacroTargets } from "./nutrition";

export interface FoodRow {
  id: string;
  name: string;
  category: string;
  protein_per_100g: number;
  carbs_per_100g: number;
  fat_per_100g: number;
  calories_per_100g: number;
  price_per_kg: number;
  unit: string;
  store: string | null;
  is_affordable: boolean;
  is_premium: boolean;
}

export interface GrocerySelection {
  foodId: string;
  name: string;
  category: string;
  quantityKg: number;
  cost: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  calories: number;
}

export async function buildGroceryList(
  macros: MacroTargets,
  budgetZAR: number
): Promise<{ items: GrocerySelection[]; totalCost: number }> {
  const weeklyMacros = {
    proteinG: macros.proteinG * 7,
    carbsG: macros.carbsG * 7,
    fatG: macros.fatG * 7,
    calories: macros.calories * 7,
  };

  const result = await query<FoodRow>("SELECT * FROM foods ORDER BY price_per_kg ASC");
  const foods = result.rows;

  const items: GrocerySelection[] = [];
  let totalCost = 0;
  let remainingProtein = weeklyMacros.proteinG;
  let remainingCarbs = weeklyMacros.carbsG;
  let remainingFat = weeklyMacros.fatG;
  let remainingBudget = budgetZAR;

  function addFood(food: FoodRow, quantityKg: number) {
    const cost = food.price_per_kg * quantityKg;
    if (cost > remainingBudget) {
      quantityKg = remainingBudget / food.price_per_kg;
      if (quantityKg < 0.1) return false;
    }
    const actualCost = food.price_per_kg * quantityKg;
    const proteinG = (food.protein_per_100g / 100) * quantityKg * 1000;
    const carbsG = (food.carbs_per_100g / 100) * quantityKg * 1000;
    const fatG = (food.fat_per_100g / 100) * quantityKg * 1000;
    const calories = (food.calories_per_100g / 100) * quantityKg * 1000;

    items.push({
      foodId: food.id,
      name: food.name,
      category: food.category,
      quantityKg: Math.round(quantityKg * 100) / 100,
      cost: Math.round(actualCost * 100) / 100,
      proteinG: Math.round(proteinG),
      carbsG: Math.round(carbsG),
      fatG: Math.round(fatG),
      calories: Math.round(calories),
    });

    totalCost += actualCost;
    remainingBudget -= actualCost;
    remainingProtein -= proteinG;
    remainingCarbs -= carbsG;
    remainingFat -= fatG;
    return true;
  }

  // Phase 1: Fill protein
  const proteinFoods = foods
    .filter((f) => f.category === "protein" && f.is_affordable)
    .sort((a, b) => (b.protein_per_100g / b.price_per_kg) - (a.protein_per_100g / a.price_per_kg));

  for (const food of proteinFoods) {
    if (remainingProtein <= 0) break;
    const neededKg = remainingProtein / (food.protein_per_100g * 10);
    const quantityKg = Math.min(neededKg, 3);
    addFood(food, Math.max(0.5, quantityKg));
  }

  // Phase 2: Fill carbs
  const carbFoods = foods
    .filter((f) => f.category === "carb" && f.is_affordable)
    .sort((a, b) => (b.carbs_per_100g / b.price_per_kg) - (a.carbs_per_100g / a.price_per_kg));

  for (const food of carbFoods) {
    if (remainingCarbs <= 0) break;
    const neededKg = remainingCarbs / (food.carbs_per_100g * 10);
    const quantityKg = Math.min(neededKg, 5);
    addFood(food, Math.max(0.5, quantityKg));
  }

  // Phase 3: Fill fat
  const fatFoods = foods
    .filter((f) => f.category === "fat" && f.is_affordable)
    .sort((a, b) => (b.fat_per_100g / b.price_per_kg) - (a.fat_per_100g / a.price_per_kg));

  for (const food of fatFoods) {
    if (remainingFat <= 0) break;
    const neededKg = remainingFat / (food.fat_per_100g * 10);
    const quantityKg = Math.min(neededKg, 2);
    addFood(food, Math.max(0.25, quantityKg));
  }

  // Phase 4: Vegetables and fruit
  const vegFoods = foods
    .filter((f) => (f.category === "vegetable" || f.category === "fruit") && f.is_affordable)
    .sort((a, b) => a.price_per_kg - b.price_per_kg);

  for (const food of vegFoods.slice(0, 5)) {
    if (remainingBudget < 10) break;
    addFood(food, 1);
  }

  // Phase 5: Premium items if budget remains
  if (remainingBudget > 50) {
    const premiumFoods = foods.filter((f) => f.is_premium);
    for (const food of premiumFoods.slice(0, 3)) {
      if (remainingBudget < 30) break;
      addFood(food, 0.5);
    }
  }

  return {
    items,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
