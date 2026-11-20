import "server-only";
import { prisma } from "./db";

/** Fixed-window counter. Returns false once `max` hits happened inside `windowMs`. */
export async function allow(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const row = await prisma.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < now) {
    await prisma.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt }, update: { count: 1, resetAt } });
    return true;
  }
  if (row.count >= max) return false;
  await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return true;
}

export const resetLimit = (key: string) => prisma.rateLimit.deleteMany({ where: { key } });
