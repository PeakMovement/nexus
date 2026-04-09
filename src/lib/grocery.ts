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

/**
 * Value score: how much of the needed macro you get per Rand spent.
 */
function macroValueScore(food: FoodRow, macro: "protein" | "carbs" | "fat"): number {
  const per100 = macro === "protein" ? food.protein_per_100g
    : macro === "carbs" ? food.carbs_per_100g
    : food.fat_per_100g;
  // grams of macro per Rand (per100 * 10 = per kg, divided by price)
  return (per100 * 10) / food.price_per_kg;
}

/**
 * Round quantity to realistic purchase amounts.
 */
function roundQuantity(kg: number): number {
  if (kg < 0.15) return 0.15;
  if (kg < 0.5) return Math.round(kg * 4) / 4; // round to nearest 250g
  return Math.round(kg * 2) / 2; // round to nearest 500g
}

function calcNutrition(food: FoodRow, kg: number) {
  const grams = kg * 1000;
  return {
    proteinG: Math.round((food.protein_per_100g / 100) * grams),
    carbsG: Math.round((food.carbs_per_100g / 100) * grams),
    fatG: Math.round((food.fat_per_100g / 100) * grams),
    calories: Math.round((food.calories_per_100g / 100) * grams),
  };
}

export async function buildGroceryList(
  macros: MacroTargets,
  budgetZAR: number
): Promise<{ items: GrocerySelection[]; totalCost: number }> {
  const weekly = {
    proteinG: macros.proteinG * 7,
    carbsG: macros.carbsG * 7,
    fatG: macros.fatG * 7,
    calories: macros.calories * 7,
  };

  const result = await query<FoodRow>("SELECT * FROM foods ORDER BY price_per_kg ASC");
  const foods = result.rows;

  const items: GrocerySelection[] = [];
  let totalCost = 0;
  let remaining = { protein: weekly.proteinG, carbs: weekly.carbsG, fat: weekly.fatG };
  let budget = budgetZAR;

  // Budget allocation: 45% protein, 20% carbs, 10% fat, 15% veg/fruit, 10% flex
  const budgetSplit = {
    protein: budgetZAR * 0.45,
    carbs: budgetZAR * 0.20,
    fat: budgetZAR * 0.10,
    veg: budgetZAR * 0.15,
    flex: budgetZAR * 0.10,
  };

  function addFood(food: FoodRow, quantityKg: number): boolean {
    quantityKg = roundQuantity(quantityKg);
    const cost = food.price_per_kg * quantityKg;
    if (cost > budget || cost < 1) return false;

    const nutrition = calcNutrition(food, quantityKg);

    items.push({
      foodId: food.id,
      name: food.name,
      category: food.category,
      quantityKg,
      cost: Math.round(cost * 100) / 100,
      ...nutrition,
    });

    totalCost += cost;
    budget -= cost;
    remaining.protein -= nutrition.proteinG;
    remaining.carbs -= nutrition.carbsG;
    remaining.fat -= nutrition.fatG;
    return true;
  }

  // Phase 1: Protein — pick top 3-4 best value affordable proteins for variety
  const proteinFoods = foods
    .filter((f) => f.category === "protein" && f.is_affordable)
    .sort((a, b) => macroValueScore(b, "protein") - macroValueScore(a, "protein"));

  const proteinPicks = proteinFoods.slice(0, Math.min(4, proteinFoods.length));
  const proteinPerItem = remaining.protein / proteinPicks.length;

  for (const food of proteinPicks) {
    if (remaining.protein <= 0) break;
    const neededKg = proteinPerItem / (food.protein_per_100g * 10);
    const maxByBudget = budgetSplit.protein / food.price_per_kg / proteinPicks.length;
    const qty = Math.min(neededKg, maxByBudget, 3);
    addFood(food, qty);
  }

  // Phase 2: Carbs — pick top 3 for variety
  const carbFoods = foods
    .filter((f) => f.category === "carb" && f.is_affordable)
    .sort((a, b) => macroValueScore(b, "carbs") - macroValueScore(a, "carbs"));

  const carbPicks = carbFoods.slice(0, Math.min(3, carbFoods.length));
  const carbsPerItem = remaining.carbs / carbPicks.length;

  for (const food of carbPicks) {
    if (remaining.carbs <= 0) break;
    const neededKg = carbsPerItem / (food.carbs_per_100g * 10);
    const maxByBudget = budgetSplit.carbs / food.price_per_kg / carbPicks.length;
    const qty = Math.min(neededKg, maxByBudget, 4);
    addFood(food, qty);
  }

  // Phase 3: Fats — pick 2
  const fatFoods = foods
    .filter((f) => f.category === "fat" && f.is_affordable)
    .sort((a, b) => macroValueScore(b, "fat") - macroValueScore(a, "fat"));

  for (const food of fatFoods.slice(0, 2)) {
    if (remaining.fat <= 0) break;
    const neededKg = (remaining.fat / 2) / (food.fat_per_100g * 10);
    const qty = Math.min(neededKg, 1);
    addFood(food, qty);
  }

  // Phase 4: Vegetables — pick 3-4 affordable vegs
  const vegFoods = foods
    .filter((f) => f.category === "vegetable" && f.is_affordable)
    .sort((a, b) => a.price_per_kg - b.price_per_kg);

  for (const food of vegFoods.slice(0, 4)) {
    if (budget < 10) break;
    addFood(food, 0.75);
  }

  // Phase 5: Fruit — 1-2 affordable fruits
  const fruitFoods = foods
    .filter((f) => f.category === "fruit" && f.is_affordable)
    .sort((a, b) => a.price_per_kg - b.price_per_kg);

  for (const food of fruitFoods.slice(0, 2)) {
    if (budget < 8) break;
    addFood(food, 0.75);
  }

  // Phase 6: Dairy — 1 item if budget allows
  const dairyFoods = foods
    .filter((f) => f.category === "dairy" && f.is_affordable)
    .sort((a, b) => a.price_per_kg - b.price_per_kg);

  if (dairyFoods.length > 0 && budget > 15) {
    addFood(dairyFoods[0], 1);
  }

  // Phase 7: Pantry staples — 1-2 tinned items
  const pantryFoods = foods
    .filter((f) => f.category === "pantry")
    .sort((a, b) => a.price_per_kg - b.price_per_kg);

  for (const food of pantryFoods.slice(0, 2)) {
    if (budget < 15) break;
    addFood(food, 0.5);
  }

  // Phase 8: Premium items if >R60 left
  if (budget > 60) {
    const premiumFoods = foods.filter((f) => f.is_premium);
    for (const food of premiumFoods.slice(0, 2)) {
      if (budget < 40) break;
      addFood(food, 0.5);
    }
  }

  return {
    items,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
