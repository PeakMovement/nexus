"use server";

import { query, generateId, initDb } from "@/lib/db";
import { calculateMacros, type ClientProfile } from "@/lib/nutrition";
import { buildGroceryList } from "@/lib/grocery";
import { generateMealPlan } from "@/lib/mealplan";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function createClient(formData: FormData) {
  await initDb();
  const id = generateId();
  const now = new Date().toISOString();

  // Auto-assign to logged-in staff if present
  const cookieStore = await cookies();
  const staffId = cookieStore.get("staff_id")?.value || null;

  await query(
    `INSERT INTO clients (id, name, email, age, gender, weight_kg, height_cm, body_fat_pct, activity_level, goal, budget_zar, staff_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      id,
      formData.get("name") as string,
      (formData.get("email") as string) || null,
      parseInt(formData.get("age") as string),
      formData.get("gender") as string,
      parseFloat(formData.get("weightKg") as string),
      parseFloat(formData.get("heightCm") as string),
      formData.get("bodyFatPct") ? parseFloat(formData.get("bodyFatPct") as string) : null,
      formData.get("activityLevel") as string,
      formData.get("goal") as string,
      parseFloat(formData.get("budgetZAR") as string),
      staffId,
      now,
      now,
    ]
  );
  redirect(`/clients/${id}`);
}

export async function updateClient(id: string, formData: FormData) {
  await query(
    `UPDATE clients SET name=$1, email=$2, age=$3, gender=$4, weight_kg=$5, height_cm=$6,
     body_fat_pct=$7, activity_level=$8, goal=$9, budget_zar=$10, updated_at=$11
     WHERE id=$12`,
    [
      formData.get("name") as string,
      (formData.get("email") as string) || null,
      parseInt(formData.get("age") as string),
      formData.get("gender") as string,
      parseFloat(formData.get("weightKg") as string),
      parseFloat(formData.get("heightCm") as string),
      formData.get("bodyFatPct") ? parseFloat(formData.get("bodyFatPct") as string) : null,
      formData.get("activityLevel") as string,
      formData.get("goal") as string,
      parseFloat(formData.get("budgetZAR") as string),
      new Date().toISOString(),
      id,
    ]
  );
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await query("DELETE FROM clients WHERE id=$1", [id]);
  redirect("/clients");
}

export async function generatePlan(clientId: string) {
  const res = await query("SELECT * FROM clients WHERE id=$1", [clientId]);
  const client = res.rows[0];
  if (!client) throw new Error("Client not found");

  const profile: ClientProfile = {
    age: client.age,
    gender: client.gender as "male" | "female",
    weightKg: client.weight_kg,
    heightCm: client.height_cm,
    bodyFatPct: client.body_fat_pct ?? undefined,
    activityLevel: client.activity_level as ClientProfile["activityLevel"],
    goal: client.goal as ClientProfile["goal"],
  };

  const macros = calculateMacros(profile);
  const { items, totalCost } = await buildGroceryList(macros, client.budget_zar);

  // Create grocery list
  const groceryListId = generateId();
  await query(
    `INSERT INTO grocery_lists (id, client_id, week_start, total_cost, budget_zar)
     VALUES ($1,$2,$3,$4,$5)`,
    [groceryListId, clientId, new Date().toISOString(), totalCost, client.budget_zar]
  );

  // Insert grocery items
  for (const item of items) {
    await query(
      `INSERT INTO grocery_items (id, grocery_list_id, food_id, quantity_kg, cost)
       VALUES ($1,$2,$3,$4,$5)`,
      [generateId(), groceryListId, item.foodId, item.quantityKg, item.cost]
    );
  }

  // Generate meal plan
  const meals = generateMealPlan(items, macros);
  const mealPlanId = generateId();

  await query(
    `INSERT INTO meal_plans (id, client_id, grocery_list_id, week_start, daily_calories, daily_protein, daily_carbs, daily_fat)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [mealPlanId, clientId, groceryListId, new Date().toISOString(), macros.calories, macros.proteinG, macros.carbsG, macros.fatG]
  );

  for (const meal of meals) {
    const mealId = generateId();
    await query(
      `INSERT INTO meals (id, meal_plan_id, day_of_week, meal_type, name)
       VALUES ($1,$2,$3,$4,$5)`,
      [mealId, mealPlanId, meal.dayOfWeek, meal.mealType, meal.name]
    );
    for (const f of meal.foods) {
      await query(
        `INSERT INTO meal_foods (id, meal_id, food_id, quantity)
         VALUES ($1,$2,$3,$4)`,
        [generateId(), mealId, f.foodId, f.quantity]
      );
    }
  }

  redirect(`/clients/${clientId}/plans/${mealPlanId}`);
}

export async function deletePlan(planId: string, clientId: string) {
  const res = await query("SELECT grocery_list_id FROM meal_plans WHERE id=$1", [planId]);
  if (res.rows[0]) {
    await query("DELETE FROM meal_plans WHERE id=$1", [planId]);
    await query("DELETE FROM grocery_lists WHERE id=$1", [res.rows[0].grocery_list_id]);
  }
  redirect(`/clients/${clientId}`);
}
