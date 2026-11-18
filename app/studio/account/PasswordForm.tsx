"use client";

import { useActionState } from "react";
import { Field, TextInput } from "../ui";
import { changePasswordAction } from "./actions";

export function PasswordForm() {
  const [s, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <h2 className="m-0 text-base font-extrabold">Ganti password</h2>
      <Field label="Password saat ini"><TextInput name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="Password baru"><TextInput name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
      <Field label="Ulangi password baru"><TextInput name="confirm" type="password" autoComplete="new-password" minLength={8} required /></Field>
      {s?.error && <p role="alert" className="m-0 rounded-xl border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-800">{s.error}</p>}
      {s?.message && <p role="status" className="m-0 rounded-xl border border-ink/15 bg-sun/40 px-3 py-2 text-sm">{s.message}</p>}
      <button className="btn !bg-ink !py-2.5 !text-paper" disabled={pending}>{pending ? "Menyimpan…" : "Simpan password"}</button>
    </form>
  );
}
