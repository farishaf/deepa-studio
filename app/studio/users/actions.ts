"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { appUrl, requestUrl } from "@/lib/request";
import { destroyUserSessions } from "@/lib/session";
import { clearTokens, HOUR, issueToken } from "@/lib/tokens";
import { countAdmins, createUser, deleteUser, findByEmail, findById, isEmail, normalizeEmail, setRole, type Role } from "@/lib/users";

export type CreateState = { error?: string; created?: { name: string; email: string; link: string; emailed: boolean } } | undefined;
export type Result = { error?: string; link?: string };

const isRole = (r: unknown): r is Role => r === "admin" || r === "user";

async function sendLink(email: string, name: string, link: string, invite: boolean) {
  // Only email links built from a configured APP_URL; the admin always gets the link on screen too.
  if (!appUrl()) return false;
  return sendMail(
    email,
    invite ? "Undangan DEEPA Studio" : "Reset password DEEPA Studio",
    invite
      ? `Halo ${name},\n\nKakak diundang ke DEEPA Studio. Buat password lewat link ini (berlaku 7 hari):\n${link}`
      : `Halo ${name},\n\nAdmin membuatkan link untuk membuat password baru (berlaku 1 jam):\n${link}`,
  );
}

export async function createUserAction(_: CreateState, fd: FormData): Promise<CreateState> {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const email = normalizeEmail(String(fd.get("email") ?? ""));
  const role = fd.get("role");
  if (!name) return { error: "Nama wajib diisi." };
  if (!isEmail(email)) return { error: "Email tidak valid." };
  if (!isRole(role)) return { error: "Pilih role." };
  if (findByEmail(email)) return { error: "Email sudah terdaftar." };

  const user = createUser({ name, email, role });
  const link = `${await requestUrl()}/reset-password?token=${issueToken(user.id, "invite", 7 * 24 * HOUR)}`;
  const emailed = await sendLink(email, name, link, true);
  revalidatePath("/studio/users");
  return { created: { name, email, link, emailed } };
}

export async function setRoleAction(userId: string, role: Role): Promise<Result> {
  const me = await requireAdmin();
  if (!isRole(role)) return { error: "Role tidak valid." };
  const target = findById(userId);
  if (!target) return { error: "Pengguna tidak ditemukan." };
  if (target.id === me.id) return { error: "Tidak bisa mengubah role akun sendiri." };
  if (target.role === "admin" && role !== "admin" && countAdmins() <= 1) return { error: "Harus ada minimal satu admin." };
  setRole(userId, role);
  revalidatePath("/studio/users");
  return {};
}

export async function resetLinkAction(userId: string): Promise<Result> {
  await requireAdmin();
  const target = findById(userId);
  if (!target) return { error: "Pengguna tidak ditemukan." };
  const link = `${await requestUrl()}/reset-password?token=${issueToken(userId, "reset", HOUR)}`;
  await sendLink(target.email, target.name, link, false);
  return { link };
}

export async function deleteUserAction(userId: string): Promise<Result> {
  const me = await requireAdmin();
  const target = findById(userId);
  if (!target) return { error: "Pengguna tidak ditemukan." };
  if (target.id === me.id) return { error: "Tidak bisa menghapus akun sendiri." };
  if (target.role === "admin" && countAdmins() <= 1) return { error: "Harus ada minimal satu admin." };
  destroyUserSessions(userId);
  clearTokens(userId);
  deleteUser(userId);
  revalidatePath("/studio/users");
  return {};
}
