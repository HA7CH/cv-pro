"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { login, logout, getSession } from "@/lib/auth";
import { createPat, revokePat } from "@/lib/pat";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await login(username, password);
  if (!ok) {
    redirect("/admin/login?error=1");
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

export async function createTokenAction(
  formData: FormData,
): Promise<{ token: string } | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "unauthorized" };
  const name = String(formData.get("name") ?? "").trim() || "untitled";
  const { token } = await createPat(session.username, name);
  revalidatePath("/admin/tokens");
  return { token };
}

export async function revokeTokenAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const id = String(formData.get("id") ?? "");
  if (id) await revokePat(id);
  revalidatePath("/admin/tokens");
}
