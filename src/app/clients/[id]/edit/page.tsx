import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateClient } from "@/app/actions";
import ClientForm from "@/components/client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) notFound();

  async function action(_prev: unknown, formData: FormData) {
    "use server";
    return updateClient(id, formData);
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/clients/${id}`}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to Client
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Edit {client.name}
      </h1>
      <ClientForm
        action={action}
        defaultValues={{
          id: client.id,
          name: client.name,
          email: client.email,
          age: client.age,
          gender: client.gender,
          weightKg: client.weightKg,
          heightCm: client.heightCm,
          bodyFatPct: client.bodyFatPct,
          activityLevel: client.activityLevel,
          goal: client.goal,
          budgetZAR: client.budgetZAR,
        }}
      />
    </div>
  );
}
