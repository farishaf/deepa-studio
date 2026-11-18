import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { countUsers } from "@/lib/users";
import { SetupForm } from "../forms";

export default function SetupPage() {
  return (
    <Suspense fallback={<p className="m-0 font-mono text-sm text-faint">Memuat…</p>}>
      <Setup />
    </Suspense>
  );
}

async function Setup() {
  await connection();
  if (countUsers() > 0) redirect("/login"); // only available until the first account exists
  return <SetupForm />;
}
