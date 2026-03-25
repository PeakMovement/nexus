import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const GOAL_LABELS: Record<string, string> = {
  lose_fat: "Fat Loss",
  maintain: "Maintain",
  build_muscle: "Build Muscle",
};

const GOAL_COLORS: Record<string, string> = {
  lose_fat: "bg-red-100 text-red-700",
  maintain: "bg-blue-100 text-blue-700",
  build_muscle: "bg-green-100 text-green-700",
};

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { mealPlans: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <Link
          href="/clients/new"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
        >
          + New Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow border border-gray-100">
          <p className="text-gray-500 mb-4">No clients yet.</p>
          <Link
            href="/clients/new"
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="bg-white rounded-xl shadow border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">
                  {client.name}
                </h2>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${GOAL_COLORS[client.goal] || "bg-gray-100 text-gray-700"}`}
                >
                  {GOAL_LABELS[client.goal] || client.goal}
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>
                  {client.weightKg}kg | {client.heightCm}cm |{" "}
                  {client.age}y | {client.gender}
                </p>
                <p className="font-medium text-emerald-600">
                  Budget: R{client.budgetZAR.toFixed(0)}/week
                </p>
                <p className="text-gray-400">
                  {client._count.mealPlans} meal plan
                  {client._count.mealPlans !== 1 ? "s" : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
