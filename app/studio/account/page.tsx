import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Link href="/studio" className="font-mono text-xs text-faint underline underline-offset-4">← Studio</Link>
      <h1 className="mb-6 mt-2 text-4xl font-extrabold tracking-[-0.04em]">Akun</h1>
      <Suspense fallback={<p className="font-mono text-sm text-faint">Memuat…</p>}>
        <Account />
      </Suspense>
    </main>
  );
}

async function Account() {
  const user = await requireUser();
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-ink/15 bg-white p-6">
      <div>
        <div className="text-lg font-extrabold">{user.name}</div>
        <div className="font-mono text-xs text-faint">{user.email} · {user.role}</div>
      </div>
      <PasswordForm />
    </div>
  );
}
