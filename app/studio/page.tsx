import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { StudioApp } from "./StudioApp";

export default function StudioPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center font-mono text-sm text-faint">Memuat studio…</main>}>
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  const user = await requireUser();
  return <StudioApp user={user} />;
}
