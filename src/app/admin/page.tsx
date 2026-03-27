import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { query, initDb } from "@/lib/db";
import { StaffLogoutButton } from "@/components/staff-logout-button";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await initDb();
  const cookieStore = await cookies();
  const adminId = cookieStore.get("admin_id")?.value;

  if (!adminId) {
    redirect("/staff");
  }

  const adminRes = await query(
    "SELECT * FROM staff_members WHERE id = $1 AND role = 'admin'",
    [adminId]
  );
  if (adminRes.rows.length === 0) {
    redirect("/staff");
  }

  // Get all staff members
  const staffRes = await query(
    "SELECT * FROM staff_members WHERE role = 'staff' ORDER BY created_at ASC"
  );
  const staffMembers = staffRes.rows;

  // Get client counts per staff member
  const staffStats: Array<{
    id: string; name: string; pin: string; created_at: string;
    clientCount: number; planCount: number;
  }> = await Promise.all(
    staffMembers.map(async (s) => {
      const clientCount = await query(
        "SELECT COUNT(*) as count FROM clients WHERE staff_id = $1",
        [s.id]
      );
      const planCount = await query(
        `SELECT COUNT(*) as count FROM meal_plans mp
         JOIN clients c ON mp.client_id = c.id
         WHERE c.staff_id = $1`,
        [s.id]
      );
      return {
        id: s.id as string,
        name: s.name as string,
        pin: s.pin as string,
        created_at: s.created_at as string,
        clientCount: parseInt(clientCount.rows[0].count),
        planCount: parseInt(planCount.rows[0].count),
      };
    })
  );

  // Overall stats
  const totalClients = await query("SELECT COUNT(*) as count FROM clients");
  const totalPlans = await query("SELECT COUNT(*) as count FROM meal_plans");
  const unassignedClients = await query(
    "SELECT COUNT(*) as count FROM clients WHERE staff_id IS NULL"
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1>
          <p className="text-gray-500 text-sm mt-1">System overview and staff management</p>
        </div>
        <StaffLogoutButton />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-3xl font-bold text-indigo-600">{staffMembers.length}</div>
          <div className="text-gray-500 mt-1">Staff Members</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-3xl font-bold text-emerald-600">{parseInt(totalClients.rows[0].count)}</div>
          <div className="text-gray-500 mt-1">Total Clients</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-3xl font-bold text-amber-500">{parseInt(totalPlans.rows[0].count)}</div>
          <div className="text-gray-500 mt-1">Meal Plans Generated</div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="text-3xl font-bold text-red-500">{parseInt(unassignedClients.rows[0].count)}</div>
          <div className="text-gray-500 mt-1">Unassigned Clients</div>
        </div>
      </div>

      {/* Staff Breakdown */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Staff Breakdown</h2>
      <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Staff Member</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">PIN</th>
              <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Clients</th>
              <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Meal Plans</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staffStats.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-800">{s.name}</div>
                </td>
                <td className="px-6 py-4">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{s.pin}</code>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-700 font-semibold rounded-full text-sm">
                    {s.clientCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-700 font-semibold rounded-full text-sm">
                    {s.planCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(s.created_at).toLocaleDateString("en-ZA")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
