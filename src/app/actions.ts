"use server";

import { prisma } from "@/lib/db";
import { calculateMacros, type ClientProfile } from "@/lib/nutrition";
import { buildGroceryList } from "@/lib/grocery";
import { generateMealPlan } from "@/lib/mealplan";
import { redirect } from "next/navigation";

export async function createClient(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    age: parseInt(formData.get("age") as string),
    gender: formData.get("gender") as string,
    weightKg: parseFloat(formData.get("weightKg") as string),
    heightCm: parseFloat(formData.get("heightCm") as string),
    bodyFatPct: formData.get("bodyFatPct")
      ? parseFloat(formData.get("bodyFatPct") as string)
      : null,
    activityLevel: formData.get("activityLevel") as string,
    goal: formData.get("goal") as string,
    budgetZAR: parseFloat(formData.get("budgetZAR") as string),
  };

  const client = await prisma.client.create({ data });
  redirect(`/clients/${client.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    age: parseInt(formData.get("age") as string),
    gender: formData.get("gender") as string,
    weightKg: parseFloat(formData.get("weightKg") as string),
    heightCm: parseFloat(formData.get("heightCm") as string),
    bodyFatPct: formData.get("bodyFatPct")
      ? parseFloat(formData.get("bodyFatPct") as string)
      : null,
    activityLevel: formData.get("activityLevel") as string,
    goal: formData.get("goal") as string,
    budgetZAR: parseFloat(formData.get("budgetZAR") as string),
  };

  await prisma.client.update({ where: { id }, data });
  redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
  await prisma.client.delete({ where: { id } });
  redirect("/clients");
}

export async function generatePlan(clientId: string) {
  const client = await prisma.client.findUniqueOrThrow({
    where: { id: clientId },
  });

  const profile: ClientProfile = {
    age: client.age,
    gender: client.gender as "male" | "female",
    weightKg: client.weightKg,
    heightCm: client.heightCm,
    bodyFatPct: client.bodyFatPct ?? undefined,
    activityLevel: client.activityLevel as ClientProfile["activityLevel"],
    goal: client.goal as ClientProfile["goal"],
  };

  const macros = calculateMacros(profile);
  const { items, totalCost } = await buildGroceryList(macros, client.budgetZAR);

  // Create grocery list
  const groceryList = await prisma.groceryList.create({
    data: {
      clientId,
      weekStart: new Date(),
      totalCost,
      budgetZAR: client.budgetZAR,
      items: {
        create: items.map((item) => ({
          foodId: item.foodId,
          quantityKg: item.quantityKg,
          cost: item.cost,
        })),
      },
    },
  });

  // Generate meal plan
  const meals = generateMealPlan(items, macros);

  const mealPlan = await prisma.mealPlan.create({
    data: {
      clientId,
      groceryListId: groceryList.id,
      weekStart: new Date(),
      dailyCalories: macros.calories,
      dailyProtein: macros.proteinG,
      dailyCarbs: macros.carbsG,
      dailyFat: macros.fatG,
      meals: {
        create: meals.map((meal) => ({
          dayOfWeek: meal.dayOfWeek,
          mealType: meal.mealType,
          name: meal.name,
          foods: {
            create: meal.foods.map((f) => ({
              foodId: f.foodId,
              quantity: f.quantity,
            })),
          },
        })),
      },
    },
  });

  redirect(`/clients/${clientId}/plans/${mealPlan.id}`);
}

export async function deletePlan(planId: string, clientId: string) {
  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
  });
  if (plan) {
    await prisma.mealPlan.delete({ where: { id: planId } });
    await prisma.groceryList.delete({ where: { id: plan.groceryListId } });
  }
  redirect(`/clients/${clientId}`);
}
