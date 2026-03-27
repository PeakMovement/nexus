import PinLoginForm from "@/components/pin-login-form";
import { staffLogin } from "./actions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function StaffLoginPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-emerald-700 mb-2">Staff Portal</h1>
        <p className="text-gray-500">Enter your code to access your dashboard</p>
      </div>
      <PinLoginForm action={staffLogin} />
      <Link href="/" className="mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors">
        Back to home
      </Link>
    </div>
  );
}
