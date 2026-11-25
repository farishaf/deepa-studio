import "server-only";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client (SQLite through the libSQL driver adapter). The file lives at DATABASE_URL
 * (default file:./data/deepa.db) and is created/migrated by `prisma migrate deploy`, which
 * `npm run dev` and `npm start` run automatically.
 */
const g = globalThis as unknown as { __prisma?: PrismaClient };

export const prisma =
  g.__prisma ??
  (g.__prisma = new PrismaClient({
    adapter: new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./data/deepa.db" }),
  }));
