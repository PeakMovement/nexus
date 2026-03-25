import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

const foods = [
  // PROTEIN SOURCES
  { name: "Chicken Breast", category: "protein", proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, caloriesPer100g: 165, pricePerKg: 75, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Chicken Thighs (bone-in)", category: "protein", proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 10, caloriesPer100g: 209, pricePerKg: 55, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Chicken Livers", category: "protein", proteinPer100g: 24, carbsPer100g: 1, fatPer100g: 6, caloriesPer100g: 167, pricePerKg: 35, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Eggs (per dozen ~720g)", category: "protein", proteinPer100g: 13, carbsPer100g: 1, fatPer100g: 11, caloriesPer100g: 155, pricePerKg: 52, store: "Checkers", isAffordable: true, isPremium: false },
  { name: "Beef Mince", category: "protein", proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 15, caloriesPer100g: 250, pricePerKg: 90, store: "Checkers", isAffordable: true, isPremium: false },
  { name: "Tinned Pilchards", category: "protein", proteinPer100g: 21, carbsPer100g: 0, fatPer100g: 9, caloriesPer100g: 170, pricePerKg: 40, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Tinned Tuna", category: "protein", proteinPer100g: 26, carbsPer100g: 0, fatPer100g: 1, caloriesPer100g: 116, pricePerKg: 120, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Polony", category: "protein", proteinPer100g: 12, carbsPer100g: 4, fatPer100g: 22, caloriesPer100g: 260, pricePerKg: 45, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Hake Fillets (frozen)", category: "protein", proteinPer100g: 17, carbsPer100g: 0, fatPer100g: 1, caloriesPer100g: 82, pricePerKg: 65, store: "Checkers", isAffordable: true, isPremium: false },
  { name: "Stewing Beef", category: "protein", proteinPer100g: 28, carbsPer100g: 0, fatPer100g: 12, caloriesPer100g: 225, pricePerKg: 100, store: "Checkers", isAffordable: true, isPremium: false },
  { name: "Salmon Fillets", category: "protein", proteinPer100g: 20, carbsPer100g: 0, fatPer100g: 13, caloriesPer100g: 208, pricePerKg: 250, store: "Woolworths", isAffordable: false, isPremium: true },
  { name: "Lamb Chops", category: "protein", proteinPer100g: 25, carbsPer100g: 0, fatPer100g: 21, caloriesPer100g: 294, pricePerKg: 180, store: "Pick n Pay", isAffordable: false, isPremium: true },
  { name: "Biltong", category: "protein", proteinPer100g: 56, carbsPer100g: 1, fatPer100g: 3, caloriesPer100g: 250, pricePerKg: 350, store: "Checkers", isAffordable: false, isPremium: true },
  // CARB SOURCES
  { name: "White Rice", category: "carb", proteinPer100g: 7, carbsPer100g: 80, fatPer100g: 0.6, caloriesPer100g: 360, pricePerKg: 15, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Brown Rice", category: "carb", proteinPer100g: 8, carbsPer100g: 77, fatPer100g: 2.7, caloriesPer100g: 362, pricePerKg: 20, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Pap (Maize Meal)", category: "carb", proteinPer100g: 8, carbsPer100g: 73, fatPer100g: 1.5, caloriesPer100g: 340, pricePerKg: 12, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "White Bread", category: "carb", proteinPer100g: 9, carbsPer100g: 49, fatPer100g: 3, caloriesPer100g: 265, pricePerKg: 18, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Brown Bread", category: "carb", proteinPer100g: 10, carbsPer100g: 46, fatPer100g: 3.5, caloriesPer100g: 254, pricePerKg: 18, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Potatoes", category: "carb", proteinPer100g: 2, carbsPer100g: 17, fatPer100g: 0.1, caloriesPer100g: 77, pricePerKg: 14, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Sweet Potatoes", category: "carb", proteinPer100g: 2, carbsPer100g: 20, fatPer100g: 0.1, caloriesPer100g: 86, pricePerKg: 18, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Pasta", category: "carb", proteinPer100g: 13, carbsPer100g: 71, fatPer100g: 1.5, caloriesPer100g: 350, pricePerKg: 22, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Oats", category: "carb", proteinPer100g: 13, carbsPer100g: 68, fatPer100g: 7, caloriesPer100g: 389, pricePerKg: 25, store: "Checkers", isAffordable: true, isPremium: false },
  { name: "Samp", category: "carb", proteinPer100g: 8, carbsPer100g: 73, fatPer100g: 1, caloriesPer100g: 340, pricePerKg: 14, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Lentils (dried)", category: "carb", proteinPer100g: 25, carbsPer100g: 60, fatPer100g: 1, caloriesPer100g: 352, pricePerKg: 30, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Sugar Beans (dried)", category: "carb", proteinPer100g: 22, carbsPer100g: 61, fatPer100g: 1.5, caloriesPer100g: 347, pricePerKg: 28, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Basmati Rice", category: "carb", proteinPer100g: 7, carbsPer100g: 78, fatPer100g: 0.5, caloriesPer100g: 350, pricePerKg: 40, store: "Pick n Pay", isAffordable: false, isPremium: true },
  { name: "Quinoa", category: "carb", proteinPer100g: 14, carbsPer100g: 64, fatPer100g: 6, caloriesPer100g: 368, pricePerKg: 90, store: "Woolworths", isAffordable: false, isPremium: true },
  // FAT SOURCES
  { name: "Sunflower Oil", category: "fat", proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, caloriesPer100g: 884, pricePerKg: 30, unit: "litre", store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Peanut Butter", category: "fat", proteinPer100g: 25, carbsPer100g: 20, fatPer100g: 50, caloriesPer100g: 588, pricePerKg: 55, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Margarine", category: "fat", proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 80, caloriesPer100g: 717, pricePerKg: 40, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Peanuts (raw)", category: "fat", proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49, caloriesPer100g: 567, pricePerKg: 50, store: "Checkers", isAffordable: true, isPremium: false },
  { name: "Avocado", category: "fat", proteinPer100g: 2, carbsPer100g: 9, fatPer100g: 15, caloriesPer100g: 160, pricePerKg: 40, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Olive Oil", category: "fat", proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100, caloriesPer100g: 884, pricePerKg: 120, unit: "litre", store: "Woolworths", isAffordable: false, isPremium: true },
  // VEGETABLES
  { name: "Cabbage", category: "vegetable", proteinPer100g: 1.3, carbsPer100g: 6, fatPer100g: 0.1, caloriesPer100g: 25, pricePerKg: 12, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Onions", category: "vegetable", proteinPer100g: 1.1, carbsPer100g: 9, fatPer100g: 0.1, caloriesPer100g: 40, pricePerKg: 14, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Carrots", category: "vegetable", proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, caloriesPer100g: 41, pricePerKg: 12, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Tomatoes", category: "vegetable", proteinPer100g: 0.9, carbsPer100g: 4, fatPer100g: 0.2, caloriesPer100g: 18, pricePerKg: 18, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Spinach", category: "vegetable", proteinPer100g: 2.9, carbsPer100g: 3.6, fatPer100g: 0.4, caloriesPer100g: 23, pricePerKg: 20, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Green Peppers", category: "vegetable", proteinPer100g: 0.9, carbsPer100g: 5, fatPer100g: 0.2, caloriesPer100g: 20, pricePerKg: 25, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Butternut", category: "vegetable", proteinPer100g: 1, carbsPer100g: 12, fatPer100g: 0.1, caloriesPer100g: 45, pricePerKg: 15, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Beetroot", category: "vegetable", proteinPer100g: 1.6, carbsPer100g: 10, fatPer100g: 0.2, caloriesPer100g: 43, pricePerKg: 15, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Broccoli", category: "vegetable", proteinPer100g: 2.8, carbsPer100g: 7, fatPer100g: 0.4, caloriesPer100g: 34, pricePerKg: 45, store: "Woolworths", isAffordable: false, isPremium: true },
  // FRUIT
  { name: "Bananas", category: "fruit", proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, caloriesPer100g: 89, pricePerKg: 15, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Apples", category: "fruit", proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, caloriesPer100g: 52, pricePerKg: 20, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Oranges", category: "fruit", proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, caloriesPer100g: 47, pricePerKg: 15, store: "Shoprite", isAffordable: true, isPremium: false },
  // DAIRY
  { name: "Full Cream Milk", category: "dairy", proteinPer100g: 3.3, carbsPer100g: 5, fatPer100g: 3.3, caloriesPer100g: 61, pricePerKg: 18, unit: "litre", store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Maas (Amasi)", category: "dairy", proteinPer100g: 3.5, carbsPer100g: 4, fatPer100g: 3, caloriesPer100g: 56, pricePerKg: 15, unit: "litre", store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Cottage Cheese", category: "dairy", proteinPer100g: 11, carbsPer100g: 3, fatPer100g: 4, caloriesPer100g: 98, pricePerKg: 70, store: "Pick n Pay", isAffordable: true, isPremium: false },
  { name: "Greek Yoghurt", category: "dairy", proteinPer100g: 10, carbsPer100g: 4, fatPer100g: 5, caloriesPer100g: 100, pricePerKg: 90, store: "Woolworths", isAffordable: false, isPremium: true },
  // PANTRY
  { name: "Tinned Tomatoes", category: "pantry", proteinPer100g: 1, carbsPer100g: 4, fatPer100g: 0.1, caloriesPer100g: 20, pricePerKg: 20, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Chakalaka (tinned)", category: "pantry", proteinPer100g: 2, carbsPer100g: 8, fatPer100g: 2, caloriesPer100g: 55, pricePerKg: 25, store: "Shoprite", isAffordable: true, isPremium: false },
  { name: "Baked Beans (tinned)", category: "pantry", proteinPer100g: 5, carbsPer100g: 16, fatPer100g: 0.5, caloriesPer100g: 94, pricePerKg: 22, store: "Shoprite", isAffordable: true, isPremium: false },
];

async function seed() {
  console.log("Seeding food database...");
  await prisma.food.deleteMany();

  for (const food of foods) {
    await prisma.food.create({
      data: {
        name: food.name,
        category: food.category,
        proteinPer100g: food.proteinPer100g,
        carbsPer100g: food.carbsPer100g,
        fatPer100g: food.fatPer100g,
        caloriesPer100g: food.caloriesPer100g,
        pricePerKg: food.pricePerKg,
        unit: (food as Record<string, unknown>).unit as string || "kg",
        store: food.store ?? null,
        isAffordable: food.isAffordable,
        isPremium: food.isPremium,
      },
    });
  }

  console.log(`Seeded ${foods.length} food items.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
