import "server-only";
import { db } from "./db";

/** Fixed-window counter in SQLite. Returns false once `max` hits happened inside `windowMs`. */
export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const row = db().prepare("SELECT count, reset_at FROM rate_limits WHERE key = ?").get(key) as { count: number; reset_at: number } | undefined;
  if (!row || row.reset_at < now) {
    db().prepare("INSERT OR REPLACE INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)").run(key, now + windowMs);
    return true;
  }
  if (row.count >= max) return false;
  db().prepare("UPDATE rate_limits SET count = count + 1 WHERE key = ?").run(key);
  return true;
}

export const resetLimit = (key: string) => db().prepare("DELETE FROM rate_limits WHERE key = ?").run(key);
