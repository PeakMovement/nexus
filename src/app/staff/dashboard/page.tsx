import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, initDb } from "@/lib/db";
import Link from "next/link";
import { StaffLogoutButton } from "@/components/staff-logout-button";

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

export default async function StaffDashboardPage() {
  await initDb();
  const cookieStore = await cookies();
  const staffId = cookieStore.get("staff_id")?.value;

  if (!staffId) {
    redirect("/staff");
  }

  const staffRes = await query("SELECT * FROM staff_members WHERE id = $1", [staffId]);
  if (staffRes.rows.length === 0) {
    redirect("/staff");
  }
  const staff = staffRes.rows[0];

  const clientsRes = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM meal_plans mp WHERE mp.client_id = c.id) as plan_count
     FROM clients c WHERE c.staff_id = $1 ORDER BY c.created_at DESC`,
    [staffId]
  );
  const clients = clientsRes.rows;

  const allClientsRes = await query(
    `SELECT c.*, (SELECT COUNT(*) FROM meal_plans mp WHERE mp.client_id = c.id) as plan_count
     FROM clients c WHERE c.staff_id IS NULL ORDER BY c.created_at DESC`
  );
  const unassignedClients = allClientsRes.rows;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {staff.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Staff Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/staff/foods"
            className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
          >
            Food Prices
          </Link>
          <Link
            href="/clients/new"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
          >
            + New Client
          </Link>
          <StaffLogoutButton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-3xl font-bold text-emerald-600">{clients.length}</div>
          <div className="text-gray-500 mt-1">My Clients</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-3xl font-bold text-amber-500">
            {clients.reduce((sum, c) => sum + parseInt(c.plan_count), 0)}
          </div>
          <div className="text-gray-500 mt-1">Total Meal Plans</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">My Clients</h2>
      {clients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow border border-gray-100 mb-8">
          <p className="text-gray-500 mb-2">No clients assigned to you yet.</p>
          <p className="text-sm text-gray-400">Claim unassigned clients below or add a new one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`} className="bg-white rounded-xl shadow border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-800">{client.name}</h2>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${GOAL_COLORS[client.goal] || "bg-gray-100 text-gray-700"}`}>
                  {GOAL_LABELS[client.goal] || client.goal}
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <p>{client.weight_kg}kg | {client.height_cm}cm | {client.age}y | {client.gender}</p>
                <p className="font-medium text-emerald-600">Budget: R{Number(client.budget_zar).toFixed(0)}/week</p>
                <p className="text-gray-400">{client.plan_count} meal plan{client.plan_count !== "1" ? "s" : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {unassignedClients.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Unassigned Clients</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {unassignedClients.map((client) => (
              <div key={client.id} className="bg-white rounded-xl shadow border border-dashed border-gray-300 p-6">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-800">{client.name}</h2>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${GOAL_COLORS[client.goal] || "bg-gray-100 text-gray-700"}`}>
                    {GOAL_LABELS[client.goal] || client.goal}
                  </span>
                </div>
                <div className="text-sm text-gray-500 space-y-1 mb-3">
                  <p>{client.weight_kg}kg | {client.height_cm}cm | {client.age}y</p>
                  <p className="font-medium text-emerald-600">Budget: R{Number(client.budget_zar).toFixed(0)}/week</p>
                </div>
                <form action={async () => {
                  "use server";
                  const { query: q } = await import("@/lib/db");
                  await q("UPDATE clients SET staff_id = $1 WHERE id = $2", [staffId, client.id]);
                  const { redirect: r } = await import("next/navigation");
                  r("/staff/dashboard");
                }}>
                  <button type="submit" className="w-full py-2 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-200 transition-colors">
                    Claim Client
                  </button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
