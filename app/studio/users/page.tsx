import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { UsersAdmin } from "./UsersAdmin";

export default function UsersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/studio" className="font-mono text-xs text-faint underline underline-offset-4">← Studio</Link>
      <h1 className="mb-6 mt-2 text-4xl font-extrabold tracking-[-0.04em]">Pengguna</h1>
      <Suspense fallback={<p className="font-mono text-sm text-faint">Memuat…</p>}>
        <Users />
      </Suspense>
    </main>
  );
}

async function Users() {
  const me = await requireAdmin(); // non-admins are redirected to /studio
  await connection();
  return <UsersAdmin users={await listUsers()} meId={me.id} />;
}
