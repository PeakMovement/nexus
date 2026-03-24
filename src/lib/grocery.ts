import { prisma } from "./db";
import type { MacroTargets } from "./nutrition";

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
 * Build a weekly grocery list that meets macro targets within budget.
 * Strategy:
 * 1. Start with affordable staples to fill protein targets
 * 2. Add carb sources
 * 3. Add fat sources
 * 4. Add vegetables and fruits
 * 5. If budget remains, upgrade to premium items
 */
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

  const foods = await prisma.food.findMany({
    orderBy: { pricePerKg: "asc" },
  });

  const items: GrocerySelection[] = [];
  let totalCost = 0;
  let remainingProtein = weeklyMacros.proteinG;
  let remainingCarbs = weeklyMacros.carbsG;
  let remainingFat = weeklyMacros.fatG;
  let remainingBudget = budgetZAR;

  // Helper to add a food item
  function addFood(food: typeof foods[0], quantityKg: number) {
    const cost = food.pricePerKg * quantityKg;
    if (cost > remainingBudget) {
      quantityKg = remainingBudget / food.pricePerKg;
      if (quantityKg < 0.1) return false;
    }
    const actualCost = food.pricePerKg * quantityKg;
    const proteinG = (food.proteinPer100g / 100) * quantityKg * 1000;
    const carbsG = (food.carbsPer100g / 100) * quantityKg * 1000;
    const fatG = (food.fatPer100g / 100) * quantityKg * 1000;
    const calories = (food.caloriesPer100g / 100) * quantityKg * 1000;

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

  // Phase 1: Fill protein with affordable sources
  const proteinFoods = foods
    .filter((f) => f.category === "protein" && f.isAffordable)
    .sort((a, b) => {
      // Sort by protein per rand (best value first)
      const aValue = a.proteinPer100g / a.pricePerKg;
      const bValue = b.proteinPer100g / b.pricePerKg;
      return bValue - aValue;
    });

  for (const food of proteinFoods) {
    if (remainingProtein <= 0) break;
    const neededKg = (remainingProtein / (food.proteinPer100g * 10));
    const quantityKg = Math.min(neededKg, 3); // max 3kg per item per week
    addFood(food, Math.max(0.5, quantityKg));
  }

  // Phase 2: Fill carbs with affordable sources
  const carbFoods = foods
    .filter((f) => f.category === "carb" && f.isAffordable)
    .sort((a, b) => {
      const aValue = a.carbsPer100g / a.pricePerKg;
      const bValue = b.carbsPer100g / b.pricePerKg;
      return bValue - aValue;
    });

  for (const food of carbFoods) {
    if (remainingCarbs <= 0) break;
    const neededKg = (remainingCarbs / (food.carbsPer100g * 10));
    const quantityKg = Math.min(neededKg, 5); // max 5kg per carb item
    addFood(food, Math.max(0.5, quantityKg));
  }

  // Phase 3: Add fat sources
  const fatFoods = foods
    .filter((f) => f.category === "fat" && f.isAffordable)
    .sort((a, b) => {
      const aValue = a.fatPer100g / a.pricePerKg;
      const bValue = b.fatPer100g / b.pricePerKg;
      return bValue - aValue;
    });

  for (const food of fatFoods) {
    if (remainingFat <= 0) break;
    const neededKg = (remainingFat / (food.fatPer100g * 10));
    const quantityKg = Math.min(neededKg, 2);
    addFood(food, Math.max(0.25, quantityKg));
  }

  // Phase 4: Add vegetables and fruit
  const vegFoods = foods
    .filter((f) => (f.category === "vegetable" || f.category === "fruit") && f.isAffordable)
    .sort((a, b) => a.pricePerKg - b.pricePerKg);

  for (const food of vegFoods.slice(0, 5)) {
    if (remainingBudget < 10) break;
    addFood(food, 1);
  }

  // Phase 5: If budget remains, add premium items
  if (remainingBudget > 50) {
    const premiumFoods = foods.filter((f) => f.isPremium);
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
