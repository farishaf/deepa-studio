import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionUser } from "./session";

// Data Access Layer: every page and Server Action re-verifies the session here.
// The proxy only does an optimistic cookie check; this is the real authorization.
export const getCurrentUser = cache(readSessionUser);

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/studio");
  return user;
}
