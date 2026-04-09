export interface ClientProfile {
  age: number;
  gender: "male" | "female";
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  goal: "lose_fat" | "maintain" | "build_muscle";
}

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  lose_fat: -500,
  maintain: 0,
  build_muscle: 300,
};

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.
 */
export function calculateBMR(profile: ClientProfile): number {
  const { weightKg, heightCm, age, gender } = profile;
  if (gender === "male") {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/**
 * Calculate Total Daily Energy Expenditure.
 */
export function calculateTDEE(profile: ClientProfile): number {
  const bmr = calculateBMR(profile);
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
}

/**
 * Calculate daily macro targets based on profile and goal.
 */
export function calculateMacros(profile: ClientProfile): MacroTargets {
  const tdee = calculateTDEE(profile);
  const calories = Math.round(tdee + GOAL_ADJUSTMENTS[profile.goal]);

  // Protein: 2g/kg for muscle building, 1.8g/kg for fat loss, 1.6g/kg for maintenance
  const proteinMultiplier =
    profile.goal === "build_muscle" ? 2.0 :
    profile.goal === "lose_fat" ? 1.8 : 1.6;
  const proteinG = Math.round(profile.weightKg * proteinMultiplier);

  // Fat: 25% of calories
  const fatG = Math.round((calories * 0.25) / 9);

  // Carbs: remaining calories
  const proteinCals = proteinG * 4;
  const fatCals = fatG * 9;
  const carbsG = Math.round(Math.max(0, calories - proteinCals - fatCals) / 4);

  return { calories, proteinG, carbsG, fatG };
}
