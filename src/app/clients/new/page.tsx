import ClientForm from "@/components/client-form";
import { createClient } from "@/app/actions";
import Link from "next/link";

export default function NewClientPage() {
  async function action(_prev: unknown, formData: FormData) {
    "use server";
    return createClient(formData);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to Clients
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Add New Client
      </h1>
      <ClientForm action={action} />
    </div>
  );
}
