import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { calculateMacros, type ClientProfile } from "@/lib/nutrition";
import { generatePlan, deleteClient } from "@/app/actions";

const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Active",
  very_active: "Very Active",
};

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "Fat Loss",
  maintain: "Maintain",
  build_muscle: "Build Muscle",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      mealPlans: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!client) notFound();

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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to Clients
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
          {client.email && (
            <p className="text-gray-500 text-sm">{client.email}</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            href={`/clients/${client.id}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Edit Profile
          </Link>
          <form
            action={async () => {
              "use server";
              await deleteClient(client.id);
            }}
          >
            <button
              type="submit"
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Age</dt>
              <dd className="font-medium">{client.age} years</dd>
            </div>
            <div>
              <dt className="text-gray-500">Gender</dt>
              <dd className="font-medium capitalize">{client.gender}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Weight</dt>
              <dd className="font-medium">{client.weightKg} kg</dd>
            </div>
            <div>
              <dt className="text-gray-500">Height</dt>
              <dd className="font-medium">{client.heightCm} cm</dd>
            </div>
            {client.bodyFatPct && (
              <div>
                <dt className="text-gray-500">Body Fat</dt>
                <dd className="font-medium">{client.bodyFatPct}%</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Activity</dt>
              <dd className="font-medium">
                {ACTIVITY_LABELS[client.activityLevel] || client.activityLevel}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Goal</dt>
              <dd className="font-medium">
                {GOAL_LABELS[client.goal] || client.goal}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Weekly Budget</dt>
              <dd className="font-semibold text-emerald-600">
                R{client.budgetZAR.toFixed(0)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Macros Card */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Daily Targets
          </h2>
          <div className="space-y-4">
            <MacroBar
              label="Calories"
              value={macros.calories}
              unit="kcal"
              max={4000}
              color="bg-amber-500"
            />
            <MacroBar
              label="Protein"
              value={macros.proteinG}
              unit="g"
              max={300}
              color="bg-red-500"
            />
            <MacroBar
              label="Carbs"
              value={macros.carbsG}
              unit="g"
              max={500}
              color="bg-blue-500"
            />
            <MacroBar
              label="Fat"
              value={macros.fatG}
              unit="g"
              max={200}
              color="bg-yellow-500"
            />
          </div>
        </div>
      </div>

      {/* Generate Plan Button */}
      <div className="mb-8">
        <form
          action={async () => {
            "use server";
            await generatePlan(client.id);
          }}
        >
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Generate New Meal Plan
          </button>
        </form>
      </div>

      {/* Meal Plan History */}
      {client.mealPlans.length > 0 && (
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Meal Plans
          </h2>
          <div className="space-y-3">
            {client.mealPlans.map((plan) => (
              <Link
                key={plan.id}
                href={`/clients/${client.id}/plans/${plan.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <span className="font-medium text-gray-800">
                    Week of{" "}
                    {plan.weekStart.toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-sm text-gray-500 ml-3">
                    {plan.dailyCalories} kcal/day
                  </span>
                </div>
                <span className="text-emerald-600 text-sm font-medium">
                  View &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MacroBar({
  label,
  value,
  unit,
  max,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">
          {value} {unit}
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
