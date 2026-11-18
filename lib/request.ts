import "server-only";
import { headers } from "next/headers";

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
}

export async function isHttps() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? (h.get("origin")?.startsWith("https") ? "https" : "http");
  return proto.split(",")[0].trim() === "https";
}

/** Configured public URL. Required (in production) before links are *emailed*, since the Host header can be spoofed. */
export function appUrl(): string | null {
  const u = process.env.APP_URL?.replace(/\/$/, "");
  if (u) return u;
  return process.env.NODE_ENV === "production" ? null : "http://localhost:3000";
}

/** Best-effort URL from the current request, only used for links shown to a signed-in admin. */
export async function requestUrl(): Promise<string> {
  const configured = process.env.APP_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${(await isHttps()) ? "https" : "http"}://${host}`;
}
