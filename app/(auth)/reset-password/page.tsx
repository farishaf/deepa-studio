import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { peekToken } from "@/lib/tokens";
import { ResetForm } from "../forms";

type Search = Promise<{ [k: string]: string | string[] | undefined }>;

export default function ResetPasswordPage({ searchParams }: { searchParams: Search }) {
  return (
    <Suspense fallback={<p className="m-0 font-mono text-sm text-faint">Memuat…</p>}>
      <Reset searchParams={searchParams} />
    </Suspense>
  );
}

async function Reset({ searchParams }: { searchParams: Search }) {
  await connection();
  const sp = await searchParams;
  const token = typeof sp.token === "string" ? sp.token : "";
  const info = peekToken(token);
  if (!info)
    return (
      <div className="flex flex-col gap-3 text-sm">
        <p className="m-0">Link tidak valid atau sudah kedaluwarsa.</p>
        <Link href="/forgot-password" className="underline underline-offset-4">Minta link baru</Link>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      <p className="m-0 text-sm text-faint">
        {info.purpose === "invite" ? "Selamat datang" : "Halo"}, <b className="text-ink">{info.name}</b>. Buat password untuk <span className="font-mono">{info.email}</span>.
      </p>
      <ResetForm token={token} />
    </div>
  );
}
