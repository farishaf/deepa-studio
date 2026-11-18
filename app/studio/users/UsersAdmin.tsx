"use client";

import { useActionState, useState, useTransition } from "react";
import { Field, Modal, Pill, Select, TextInput } from "../ui";
import { createUserAction, deleteUserAction, resetLinkAction, setRoleAction, type Result } from "./actions";
import type { Role, UserListItem } from "@/lib/users";

const ROLES = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
];

export function UsersAdmin({ users, meId }: { users: UserListItem[]; meId: string }) {
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState<{ text: string; link?: string } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<Result>, ok?: (r: Result) => void) =>
    start(async () => {
      const r = await fn();
      if (r.error) setMsg({ text: r.error });
      else ok?.(r);
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <p className="m-0 text-sm text-faint">Admin bisa menambah pengguna dan mengatur role. User hanya memakai Studio.</p>
        <button className="btn ml-auto !bg-sun font-extrabold" onClick={() => setAdding(true)}>+ Tambah pengguna</button>
      </div>

      {msg && (
        <div role="status" className="flex flex-col gap-2 rounded-2xl border border-ink/15 bg-sun/40 p-3 text-sm">
          <span>{msg.text}</span>
          {msg.link && <LinkBox link={msg.link} />}
          <button className="btn self-start" onClick={() => setMsg(null)}>Tutup</button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-ink/15 bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-paper font-mono text-xs text-faint">
            <tr><th className="px-4 py-2">Nama</th><th className="px-4 py-2">Role</th><th className="px-4 py-2 text-right">Aksi</th></tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const me = u.id === meId;
              return (
                <tr key={u.id} className="border-t border-ink/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-bold">
                      {u.name}
                      {me && <Pill size="sm">Anda</Pill>}
                      {u.pending && <Pill size="sm" color="#f0a35e">Belum aktif</Pill>}
                    </div>
                    <div className="font-mono text-xs text-faint">{u.email}</div>
                  </td>
                  <td className="w-40 px-4 py-3">
                    {me ? (
                      <Pill>{u.role === "admin" ? "Admin" : "User"}</Pill>
                    ) : (
                      <Select label={`Role ${u.name}`} size="sm" value={u.role} options={ROLES} onChange={(r) => run(() => setRoleAction(u.id, r as Role))} />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        className="btn"
                        disabled={pending}
                        onClick={() => run(() => resetLinkAction(u.id), (r) => setMsg({ text: `Link ${u.pending ? "undangan" : "reset password"} untuk ${u.name}:`, link: r.link }))}
                      >
                        {u.pending ? "Link undangan" : "Link reset"}
                      </button>
                      {!me &&
                        (confirm === u.id ? (
                          <>
                            <button className="btn !border-red-600 !bg-red-600 !text-white" onClick={() => { setConfirm(null); run(() => deleteUserAction(u.id)); }}>Ya, hapus</button>
                            <button className="btn" onClick={() => setConfirm(null)}>Batal</button>
                          </>
                        ) : (
                          <button className="btn text-red-700" onClick={() => setConfirm(u.id)}>Hapus</button>
                        ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {adding && <AddUserModal onClose={() => setAdding(false)} />}
    </div>
  );
}

function LinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <input readOnly value={link} className="field w-full font-mono !text-xs" onFocus={(e) => e.currentTarget.select()} aria-label="Link" />
      <button
        className="btn shrink-0"
        onClick={async () => {
          try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
        }}
      >
        {copied ? "Tersalin ✓" : "Salin"}
      </button>
    </div>
  );
}

function AddUserModal({ onClose }: { onClose: () => void }) {
  const [s, action, pending] = useActionState(createUserAction, undefined);
  const [role, setRole] = useState<Role>("user");
  return (
    <Modal label="Tambah pengguna" onClose={onClose}>
      {(close) => (
        <div className="flex flex-col gap-4 overflow-y-auto p-6">
          <div className="flex items-center">
            <h2 className="m-0 text-xl font-extrabold">Tambah pengguna</h2>
            <button className="btn ml-auto" onClick={close} aria-label="Tutup">✕</button>
          </div>
          {s?.created ? (
            <div className="flex flex-col gap-3 text-sm">
              <p className="m-0">
                <b>{s.created.name}</b> ditambahkan. {s.created.emailed ? "Undangan sudah dikirim lewat email." : "Kirim link ini ke yang bersangkutan (berlaku 7 hari):"}
              </p>
              <LinkBox link={s.created.link} />
              <button className="btn self-end !bg-ink !text-paper" onClick={close}>Selesai</button>
            </div>
          ) : (
            <form action={action} className="flex flex-col gap-4">
              <input type="hidden" name="role" value={role} />
              <Field label="Nama"><TextInput name="name" required autoFocus /></Field>
              <Field label="Email"><TextInput name="email" type="email" required /></Field>
              <Field label="Role">
                <div className="flex gap-1.5">
                  <Pill selected={role === "user"} onClick={() => setRole("user")}>User</Pill>
                  <Pill selected={role === "admin"} onClick={() => setRole("admin")}>Admin</Pill>
                </div>
              </Field>
              {s?.error && <p role="alert" className="m-0 rounded-xl border border-red-500/40 bg-red-50 px-3 py-2 text-sm text-red-800">{s.error}</p>}
              <p className="m-0 text-xs text-faint">Pengguna membuat passwordnya sendiri lewat link undangan.</p>
              <button className="btn !bg-ink !py-2.5 !text-paper" disabled={pending}>{pending ? "Menyimpan…" : "Tambah & buat link undangan"}</button>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
