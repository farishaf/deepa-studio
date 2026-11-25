"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, TextInput } from "@/app/studio/ui";
import { forgotPasswordAction, loginAction, resetPasswordAction, setupAction, type FormState } from "./actions";

const primary = "btn !w-full !bg-ink !py-2.5 !text-paper";

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button className={primary} disabled={pending}>
      {pending ? "Memproses…" : children}
    </button>
  );
}
const FormError = ({ s }: { s: FormState }) =>
  s?.error ? (
    <p role="alert" className="m-0 rounded-xl border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-800">
      {s.error}
    </p>
  ) : null;

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [s, action, pending] = useActionState(loginAction, undefined);
  const notes: Record<string, string> = {
    reset: "Password berhasil diubah. Silakan masuk.",
    welcome: "Password sudah dibuat. Silakan masuk.",
  };
  return (
    <form action={action} className="flex flex-col gap-4">
      {notice && notes[notice] && <p className="m-0 rounded-xl border border-ink/15 bg-sun/40 px-3 py-2 text-sm">{notes[notice]}</p>}
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <TextInput name="email" type="email" autoComplete="email" required defaultValue={s?.email} autoFocus />
      </Field>
      <Field label="Password">
        <TextInput name="password" type="password" autoComplete="current-password" required />
      </Field>
      <FormError s={s} />
      <Submit pending={pending}>Masuk</Submit>
      <Link href="/forgot-password" className="text-center text-sm underline underline-offset-4">
        Lupa password?
      </Link>
    </form>
  );
}

export function ForgotForm() {
  const [s, action, pending] = useActionState(forgotPasswordAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="m-0 text-sm text-faint">Masukkan email akun Kakak. Kami kirim link untuk membuat password baru.</p>
      <Field label="Email">
        <TextInput name="email" type="email" autoComplete="email" required defaultValue={s?.email} autoFocus />
      </Field>
      <FormError s={s} />
      {s?.message && <p role="status" className="m-0 rounded-xl border border-ink/15 bg-sun/40 px-3 py-2 text-sm">{s.message}</p>}
      {s?.devLink && (
        <p className="m-0 break-all rounded-xl border border-dashed border-ink/30 px-3 py-2 font-mono text-xs">
          Mode dev (SMTP belum diatur): <a className="underline" href={s.devLink}>{s.devLink}</a>
        </p>
      )}
      <Submit pending={pending}>Kirim link reset</Submit>
      <Link href="/login" className="text-center text-sm underline underline-offset-4">
        Kembali ke login
      </Link>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [s, action, pending] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <Field label="Password baru">
        <TextInput name="password" type="password" autoComplete="new-password" minLength={8} required autoFocus />
      </Field>
      <Field label="Ulangi password">
        <TextInput name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormError s={s} />
      <Submit pending={pending}>Simpan password</Submit>
    </form>
  );
}

export function SetupForm() {
  const [s, action, pending] = useActionState(setupAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="m-0 text-sm text-faint">Belum ada akun. Buat akun admin pertama untuk mulai memakai Studio.</p>
      <Field label="Nama">
        <TextInput name="name" autoComplete="name" required defaultValue={s?.name} autoFocus />
      </Field>
      <Field label="Email">
        <TextInput name="email" type="email" autoComplete="email" required defaultValue={s?.email} />
      </Field>
      <Field label="Password">
        <TextInput name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormError s={s} />
      <Submit pending={pending}>Buat akun admin</Submit>
    </form>
  );
}
