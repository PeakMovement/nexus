import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NutriPlan SA - Budget Meal Planning",
  description: "Budget-focused meal planning for South African fitness coaches",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <nav className="bg-emerald-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-xl font-bold tracking-tight">
                NutriPlan SA
              </Link>
              <div className="flex space-x-4">
                <Link
                  href="/clients"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Clients
                </Link>
                <Link
                  href="/clients/new"
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  + New Client
                </Link>
                <Link
                  href="/staff"
                  className="px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-500 transition-colors"
                >
                  Staff Portal
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          {children}
        </main>
        <footer className="bg-gray-100 border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
            NutriPlan SA - Budget Meal Planning for South African Coaches
          </div>
        </footer>
      </body>
    </html>
  );
}
