"use client";

import { useActionState } from "react";

type ClientData = {
  id?: string;
  name?: string;
  email?: string | null;
  age?: number;
  gender?: string;
  weightKg?: number;
  heightCm?: number;
  bodyFatPct?: number | null;
  activityLevel?: string;
  goal?: string;
  budgetZAR?: number;
};

export default function ClientForm({
  action,
  defaultValues,
}: {
  action: (prev: unknown, formData: FormData) => Promise<unknown>;
  defaultValues?: ClientData;
}) {
  const [error, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6 max-w-xl">
      {typeof error === "string" ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : null}

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Personal Info
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={defaultValues?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={defaultValues?.email || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age *
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min={16}
                max={100}
                required
                defaultValue={defaultValues?.age}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                id="gender"
                name="gender"
                required
                defaultValue={defaultValues?.gender || ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="" disabled>
                  Select...
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Body Measurements
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="weightKg" className="block text-sm font-medium text-gray-700 mb-1">
              Weight (kg) *
            </label>
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              min={30}
              max={300}
              required
              defaultValue={defaultValues?.weightKg}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="heightCm" className="block text-sm font-medium text-gray-700 mb-1">
              Height (cm) *
            </label>
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              step="0.1"
              min={100}
              max={250}
              required
              defaultValue={defaultValues?.heightCm}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="bodyFatPct" className="block text-sm font-medium text-gray-700 mb-1">
              Body Fat %
            </label>
            <input
              id="bodyFatPct"
              name="bodyFatPct"
              type="number"
              step="0.1"
              min={3}
              max={60}
              defaultValue={defaultValues?.bodyFatPct ?? ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Goals & Budget
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Activity Level *
            </label>
            <select
              id="activityLevel"
              name="activityLevel"
              required
              defaultValue={defaultValues?.activityLevel || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="" disabled>
                Select...
              </option>
              <option value="sedentary">Sedentary (desk job)</option>
              <option value="light">Light (1-2 days/week)</option>
              <option value="moderate">Moderate (3-5 days/week)</option>
              <option value="active">Active (6-7 days/week)</option>
              <option value="very_active">Very Active (2x/day)</option>
            </select>
          </div>
          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-1">
              Goal *
            </label>
            <select
              id="goal"
              name="goal"
              required
              defaultValue={defaultValues?.goal || ""}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="" disabled>
                Select...
              </option>
              <option value="lose_fat">Lose Fat</option>
              <option value="maintain">Maintain Weight</option>
              <option value="build_muscle">Build Muscle</option>
            </select>
          </div>
          <div>
            <label htmlFor="budgetZAR" className="block text-sm font-medium text-gray-700 mb-1">
              Weekly Budget (ZAR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                R
              </span>
              <input
                id="budgetZAR"
                name="budgetZAR"
                type="number"
                step="10"
                min={100}
                max={10000}
                required
                defaultValue={defaultValues?.budgetZAR}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Saving..." : defaultValues?.id ? "Update Client" : "Create Client"}
      </button>
    </form>
  );
}
