import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { countUsers } from "@/lib/users";
import { LoginForm } from "../forms";

type Search = Promise<{ [k: string]: string | string[] | undefined }>;

export default function LoginPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="m-0 font-mono text-sm text-faint">Memuat…</p>}>
      <Login searchParams={searchParams} />
    </Suspense>
  );
}

async function Login({ searchParams }: { searchParams: Search }) {
  await connection(); // the user count must be read per request, not at build time
  if (countUsers() === 0) redirect("/setup");
  if (await getCurrentUser()) redirect("/studio");
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/studio";
  const notice = typeof sp.notice === "string" ? sp.notice : undefined;
  return <LoginForm next={next} notice={notice} />;
}
