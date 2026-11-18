import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { db } from "./db";
import { isHttps } from "./request";
import type { User } from "./users";

export const SESSION_COOKIE = "deepa_session";
const TTL = 30 * 24 * 3600 * 1000;
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Only a hash of the token is stored, so a leaked database can't be replayed as cookies. */
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + TTL;
  db().prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
  db().prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha(token), userId, expires);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/",
    expires: new Date(expires),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  jar.delete(SESSION_COOKIE);
}

export const destroyUserSessions = (userId: string) => db().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);

export async function readSessionUser(): Promise<User | null> {
  await connection(); // the expiry check uses Date.now(), which must not run during prerender
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha(token), Date.now()) as User | undefined;
  // node:sqlite rows have a null prototype; Client Components only accept plain objects
  return row ? { id: row.id, email: row.email, name: row.name, role: row.role } : null;
}
