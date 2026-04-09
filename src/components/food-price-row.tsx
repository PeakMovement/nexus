"use client";

import { useState, useTransition } from "react";
import { updateFoodPrice } from "@/app/staff/foods/actions";

export function FoodPriceRow({ food }: { food: { id: string; name: string; price_per_kg: number; store: string | null; unit: string } }) {
  const [price, setPrice] = useState(Number(food.price_per_kg).toFixed(0));
  const [store, setStore] = useState(food.store || "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await updateFoodPrice(food.id, parseFloat(price), store);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="px-6 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <span className="font-medium text-gray-800 text-sm">{food.name}</span>
        <span className="text-xs text-gray-400 ml-2">/{food.unit}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative w-24">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R</span>
          <input
            type="number"
            step="1"
            min="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="w-32 py-1.5 px-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">Store...</option>
          <option value="Shoprite">Shoprite</option>
          <option value="Checkers">Checkers</option>
          <option value="Pick n Pay">Pick n Pay</option>
          <option value="Woolworths">Woolworths</option>
          <option value="SPAR">SPAR</option>
        </select>
        <button
          onClick={handleSave}
          disabled={isPending}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            saved
              ? "bg-green-100 text-green-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          } disabled:opacity-50`}
        >
          {saved ? "Saved" : isPending ? "..." : "Update"}
        </button>
      </div>
    </div>
  );
}
