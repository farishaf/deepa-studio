import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// scrypt with a per-password random salt: "scrypt$<salt>$<hash>" (base64).
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false; // e.g. invited user who hasn't set a password yet
  const expected = Buffer.from(hash, "base64");
  const actual = scryptSync(password, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

let dummy: string | undefined;
/** Burn the same time as a real check so "unknown email" isn't distinguishable by timing. */
export function fakeVerify(password: string) {
  dummy ??= hashPassword(randomBytes(8).toString("hex"));
  verifyPassword(password, dummy);
}

export const UNUSABLE_PASSWORD = "!";

export function passwordIssue(pw: string): string | null {
  if (pw.length < 8) return "Password minimal 8 karakter.";
  if (pw.length > 200) return "Password terlalu panjang.";
  return null;
}
