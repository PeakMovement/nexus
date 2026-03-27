"use client";

import { useRouter } from "next/navigation";
import { staffLogout } from "@/app/staff/actions";

export function StaffLogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await staffLogout();
        router.push("/staff");
      }}
      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
    >
      Sign Out
    </button>
  );
}
