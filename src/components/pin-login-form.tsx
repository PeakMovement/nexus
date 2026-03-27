"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PinLoginForm({
  action,
}: {
  action: (prev: unknown, formData: FormData) => Promise<unknown>;
}) {
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state && typeof state === "object" && "redirect" in state) {
      router.push((state as { redirect: string }).redirect);
    }
  }, [state, router]);

  const error = typeof state === "string" ? state : null;

  return (
    <form action={formAction} className="space-y-6 w-full max-w-xs">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
          Enter your 4-digit code
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{4}"
          maxLength={4}
          required
          autoFocus
          placeholder="----"
          className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Verifying..." : "Sign In"}
      </button>
    </form>
  );
}
