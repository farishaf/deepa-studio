import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export type TokenPurpose = "reset" | "invite";
export const HOUR = 3600 * 1000;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** One live token per user+purpose; only its hash is stored. */
export function issueToken(userId: string, purpose: TokenPurpose, ttlMs: number): string {
  const token = randomBytes(32).toString("base64url");
  db().prepare("DELETE FROM auth_tokens WHERE user_id = ? AND purpose = ?").run(userId, purpose);
  db().prepare("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, ?, ?)").run(sha(token), userId, purpose, Date.now() + ttlMs);
  return token;
}

export function peekToken(token: string): { userId: string; purpose: TokenPurpose; email: string; name: string } | null {
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT t.user_id AS userId, t.purpose, u.email, u.name FROM auth_tokens t JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = ? AND t.expires_at > ?`,
    )
    .get(sha(token), Date.now()) as { userId: string; purpose: TokenPurpose; email: string; name: string } | undefined;
  return row ?? null;
}

export const clearTokens = (userId: string) => db().prepare("DELETE FROM auth_tokens WHERE user_id = ?").run(userId);
