"use server";

import { requireUser } from "@/lib/auth";
import { passwordIssue, verifyPassword } from "@/lib/password";
import { allow } from "@/lib/ratelimit";
import { createSession, destroyUserSessions } from "@/lib/session";
import { findById, setPassword } from "@/lib/users";

export type PasswordState = { error?: string; message?: string } | undefined;

export async function changePasswordAction(_: PasswordState, fd: FormData): Promise<PasswordState> {
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  if (!allow(`chpw:${me.id}`, 8, 15 * 60_000)) return { error: "Terlalu banyak percobaan. Coba lagi nanti." };
  const row = findById(me.id);
  if (!row || !verifyPassword(current, row.password_hash)) return { error: "Password saat ini salah." };
  if (next !== String(fd.get("confirm") ?? "")) return { error: "Konfirmasi password tidak sama." };
  const issue = passwordIssue(next);
  if (issue) return { error: issue };

  setPassword(me.id, next);
  destroyUserSessions(me.id); // sign out other devices, then keep this one signed in
  await createSession(me.id);
  return { message: "Password berhasil diubah. Perangkat lain sudah dikeluarkan." };
}
