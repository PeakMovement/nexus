import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Home() {
  const clientCount = await prisma.client.count();
  const planCount = await prisma.mealPlan.count();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold text-emerald-700 mb-4">
          NutriPlan SA
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Budget Meal Planning for South African Fitness Coaches
        </p>
        <p className="text-gray-500 mb-8">
          Create personalised meal plans that hit macro targets while staying
          within your clients&apos; grocery budgets. Powered by real South
          African food prices.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="text-3xl font-bold text-emerald-600">
              {clientCount}
            </div>
            <div className="text-gray-500 mt-1">Clients</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
            <div className="text-3xl font-bold text-amber-500">
              {planCount}
            </div>
            <div className="text-gray-500 mt-1">Meal Plans Generated</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/clients"
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Manage Clients
          </Link>
          <Link
            href="/clients/new"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-emerald-600 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
          >
            + Add New Client
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl text-center">
        <div>
          <div className="text-2xl mb-2">1</div>
          <h3 className="font-semibold text-gray-800 mb-1">Add Client</h3>
          <p className="text-sm text-gray-500">
            Enter body stats, fitness goal, and weekly grocery budget in Rands.
          </p>
        </div>
        <div>
          <div className="text-2xl mb-2">2</div>
          <h3 className="font-semibold text-gray-800 mb-1">Generate Plan</h3>
          <p className="text-sm text-gray-500">
            Auto-calculate macros and build a 7-day meal plan within budget.
          </p>
        </div>
        <div>
          <div className="text-2xl mb-2">3</div>
          <h3 className="font-semibold text-gray-800 mb-1">Export & Shop</h3>
          <p className="text-sm text-gray-500">
            Download the meal plan and grocery list as PDF for your client.
          </p>
        </div>
      </div>
    </div>
  );
}
