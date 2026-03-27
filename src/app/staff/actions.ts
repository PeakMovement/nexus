"use server";

import { query, initDb } from "@/lib/db";
import { cookies } from "next/headers";

export async function staffLogin(_prev: unknown, formData: FormData) {
  await initDb();
  const pin = formData.get("pin") as string;

  if (!pin || pin.length !== 4) {
    return "Please enter a 4-digit code.";
  }

  const res = await query(
    "SELECT id, name, role FROM staff_members WHERE pin = $1",
    [pin]
  );

  if (res.rows.length === 0) {
    return "Invalid code. Please try again.";
  }

  const staff = res.rows[0];
  const cookieStore = await cookies();

  if (staff.role === "admin") {
    cookieStore.set("admin_id", staff.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
    });
    return { redirect: "/admin" };
  }

  cookieStore.set("staff_id", staff.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return { redirect: `/staff/dashboard` };
}

export async function staffLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("staff_id");
  cookieStore.delete("admin_id");
}
