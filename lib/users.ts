import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { hashPassword, UNUSABLE_PASSWORD } from "./password";

export type Role = "admin" | "user";
export type User = { id: string; email: string; name: string; role: Role };
export type UserRow = User & { password_hash: string; created_at: number };
export type UserListItem = User & { created_at: number; pending: boolean };

export const normalizeEmail = (s: string) => s.trim().toLowerCase();
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
const pub = ({ id, email, name, role }: UserRow): User => ({ id, email, name, role });

export const countUsers = () => (db().prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
export const countAdmins = () => (db().prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").get() as { n: number }).n;
export const findByEmail = (email: string) =>
  db().prepare("SELECT * FROM users WHERE email = ?").get(normalizeEmail(email)) as UserRow | undefined;
export const findById = (id: string) => db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;

export function listUsers(): UserListItem[] {
  const rows = db().prepare("SELECT * FROM users ORDER BY role, name COLLATE NOCASE").all() as UserRow[];
  return rows.map((r) => ({ ...pub(r), created_at: r.created_at, pending: r.password_hash === UNUSABLE_PASSWORD }));
}

/** Without a password the account is "invited": it can only be activated through an invite link. */
export function createUser(input: { name: string; email: string; role: Role; password?: string }): User {
  const row: UserRow = {
    id: randomUUID(),
    name: input.name.trim(),
    email: normalizeEmail(input.email),
    role: input.role,
    password_hash: input.password ? hashPassword(input.password) : UNUSABLE_PASSWORD,
    created_at: Date.now(),
  };
  db()
    .prepare("INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(row.id, row.email, row.name, row.role, row.password_hash, row.created_at);
  return pub(row);
}

export function setPassword(userId: string, password: string) {
  db().prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), userId);
}
export const setRole = (userId: string, role: Role) => db().prepare("UPDATE users SET role = ? WHERE id = ?").run(role, userId);
export const deleteUser = (userId: string) => db().prepare("DELETE FROM users WHERE id = ?").run(userId);
