import "server-only";
import { prisma } from "./db";
import { hashPassword } from "./password";

/** Optional: create the first admin from env so a public deploy never exposes /setup. Runs once at server start. */
export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if ((await prisma.user.count()) > 0) return;
  await prisma.user.create({
    data: { email, name: process.env.ADMIN_NAME?.trim() || "Admin", role: "admin", passwordHash: hashPassword(password) },
  });
  console.log(`[auth] created initial admin ${email}`);
}
