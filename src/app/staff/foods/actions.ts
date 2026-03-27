"use server";

import { query } from "@/lib/db";

export async function updateFoodPrice(foodId: string, price: number, store: string) {
  if (price < 1 || price > 9999) throw new Error("Invalid price");
  await query(
    "UPDATE foods SET price_per_kg = $1, store = $2 WHERE id = $3",
    [price, store || null, foodId]
  );
}
