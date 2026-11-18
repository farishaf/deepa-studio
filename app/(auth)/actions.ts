"use server";

import { redirect } from "next/navigation";
import { allow, resetLimit } from "@/lib/ratelimit";
import { clientIp, appUrl } from "@/lib/request";
import { createSession, destroySession, destroyUserSessions } from "@/lib/session";
import { clearTokens, HOUR, issueToken, peekToken } from "@/lib/tokens";
import { createUser, countUsers, findByEmail, isEmail, normalizeEmail, setPassword } from "@/lib/users";
import { fakeVerify, passwordIssue, verifyPassword } from "@/lib/password";
import { sendMail } from "@/lib/mail";

export type FormState = { error?: string; message?: string; devLink?: string; email?: string; name?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
// only allow same-site relative paths after login
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/studio");

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(str(fd, "email"));
  const password = str(fd, "password");
  if (!email || !password) return { error: "Isi email dan password.", email };

  const ip = await clientIp();
  if (!allow(`login:ip:${ip}`, 30, 15 * 60_000) || !allow(`login:${email}`, 8, 15 * 60_000)) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam 15 menit.", email };
  }

  const user = findByEmail(email);
  if (!user) fakeVerify(password);
  if (!user || !verifyPassword(password, user.password_hash)) return { error: "Email atau password salah.", email };

  resetLimit(`login:${email}`);
  await createSession(user.id);
  redirect(safeNext(str(fd, "next")));
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = normalizeEmail(str(fd, "email"));
  if (!isEmail(email)) return { error: "Masukkan email yang valid.", email };
  if (!allow(`forgot:ip:${await clientIp()}`, 10, 15 * 60_000) || !allow(`forgot:${email}`, 3, 15 * 60_000)) {
    return { error: "Terlalu banyak permintaan. Coba lagi nanti.", email };
  }

  // Same answer whether or not the account exists, so emails can't be enumerated.
  const message = "Jika email terdaftar, link reset password sudah dikirim. Link berlaku 1 jam.";
  const user = findByEmail(email);
  if (!user) return { message };

  const token = issueToken(user.id, "reset", HOUR);
  const base = appUrl();
  if (!base) {
    console.warn("[auth] APP_URL is not set; not emailing a reset link built from request headers.");
    return { message };
  }
  const link = `${base}/reset-password?token=${token}`;
  const sent = await sendMail(user.email, "Reset password DEEPA Studio", `Halo ${user.name},\n\nKlik link ini untuk membuat password baru (berlaku 1 jam):\n${link}\n\nAbaikan email ini jika Kakak tidak memintanya.`);
  // Dev convenience only: with no SMTP configured, show the link so the flow can be tried locally.
  return { message, devLink: !sent && process.env.NODE_ENV !== "production" ? link : undefined };
}

export async function resetPasswordAction(_: FormState, fd: FormData): Promise<FormState> {
  const token = str(fd, "token");
  const password = str(fd, "password");
  const info = peekToken(token);
  if (!info) return { error: "Link tidak valid atau sudah kedaluwarsa. Minta link baru." };
  if (password !== str(fd, "confirm")) return { error: "Konfirmasi password tidak sama." };
  const issue = passwordIssue(password);
  if (issue) return { error: issue };

  setPassword(info.userId, password);
  clearTokens(info.userId);
  destroyUserSessions(info.userId); // sign out everywhere
  redirect(`/login?notice=${info.purpose === "invite" ? "welcome" : "reset"}`);
}

export async function setupAction(_: FormState, fd: FormData): Promise<FormState> {
  const name = str(fd, "name").trim();
  const email = normalizeEmail(str(fd, "email"));
  const password = str(fd, "password");
  if (countUsers() > 0) redirect("/login");
  if (!name) return { error: "Nama wajib diisi.", name, email };
  if (!isEmail(email)) return { error: "Masukkan email yang valid.", name, email };
  const issue = passwordIssue(password);
  if (issue) return { error: issue, name, email };

  const user = createUser({ name, email, role: "admin", password });
  await createSession(user.id);
  redirect("/studio");
}
