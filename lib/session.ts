import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "./db";
import { isHttps } from "./request";
import type { User } from "./users";

export const SESSION_COOKIE = "deepa_session";
const TTL = 30 * 24 * 3600 * 1000;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Only a hash of the token is stored, so a leaked database can't be replayed as cookies. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + TTL);
  await prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  await prisma.session.create({ data: { tokenHash: sha(token), userId, expiresAt: expires } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: sha(token) } });
  jar.delete(SESSION_COOKIE);
}

export const destroyUserSessions = (userId: string) => prisma.session.deleteMany({ where: { userId } });

export async function readSessionUser(): Promise<User | null> {
  await connection(); // the expiry check uses the current time, which must not run during prerender
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await prisma.session.findFirst({
    where: { tokenHash: sha(token), expiresAt: { gt: new Date() } },
    select: { user: { select: { id: true, email: true, name: true, role: true } } },
  });
  return s?.user ?? null;
}
