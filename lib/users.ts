import "server-only";
import { prisma } from "./db";
import { hashPassword, UNUSABLE_PASSWORD } from "./password";

export type Role = "admin" | "user";
export type User = { id: string; email: string; name: string; role: Role };
export type UserListItem = User & { createdAt: number; pending: boolean };

export const normalizeEmail = (s: string) => s.trim().toLowerCase();
export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;

export const countUsers = () => prisma.user.count();
export const countAdmins = () => prisma.user.count({ where: { role: "admin" } });
export const findByEmail = (email: string) => prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
export const findById = (id: string) => prisma.user.findUnique({ where: { id } });

export async function listUsers(): Promise<UserListItem[]> {
  const rows = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { name: "asc" }] });
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name,
    role: r.role,
    createdAt: r.createdAt.getTime(),
    pending: r.passwordHash === UNUSABLE_PASSWORD,
  }));
}

/** Without a password the account is "invited": it can only be activated through an invite link.
 *  Throws a Prisma P2002 error if the email is already taken (see isUniqueViolation). */
export async function createUser(input: { name: string; email: string; role: Role; password?: string }): Promise<User> {
  const u = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      role: input.role,
      passwordHash: input.password ? hashPassword(input.password) : UNUSABLE_PASSWORD,
    },
  });
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

export const isUniqueViolation = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

export const setPassword = (userId: string, password: string) =>
  prisma.user.update({ where: { id: userId }, data: { passwordHash: hashPassword(password) } });
export const setRole = (userId: string, role: Role) => prisma.user.update({ where: { id: userId }, data: { role } });
export const deleteUser = (userId: string) => prisma.user.delete({ where: { id: userId } });
