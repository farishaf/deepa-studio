import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./db";

export type TokenPurpose = "reset" | "invite";
export const HOUR = 3600 * 1000;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** One live token per user+purpose; only its hash is stored. */
export async function issueToken(userId: string, purpose: TokenPurpose, ttlMs: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, purpose } }),
    prisma.authToken.create({ data: { tokenHash: sha(token), userId, purpose, expiresAt: new Date(Date.now() + ttlMs) } }),
  ]);
  return token;
}

export async function peekToken(token: string): Promise<{ userId: string; purpose: TokenPurpose; email: string; name: string } | null> {
  if (!token) return null;
  const t = await prisma.authToken.findFirst({
    where: { tokenHash: sha(token), expiresAt: { gt: new Date() } },
    include: { user: { select: { email: true, name: true } } },
  });
  return t ? { userId: t.userId, purpose: t.purpose, email: t.user.email, name: t.user.name } : null;
}

export const clearTokens = (userId: string) => prisma.authToken.deleteMany({ where: { userId } });
