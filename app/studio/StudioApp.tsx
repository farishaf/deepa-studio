"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Board } from "./Board";
import { CalendarView } from "./Calendar";
import { Timeline } from "./Timeline";
import {
  actions, addDays, CHANNELS, diffDays, OWNERS, STATUSES, TYPES, todayISO, useStudio,
  type Item, type ItemType, type Status,
} from "./store";
import { logoutAction } from "@/app/(auth)/actions";
import type { User } from "@/lib/users";
import { D, DatePicker, Field, Modal, Pill, Popover, SearchIcon, Select, TextArea, TextInput, usePressFeedback } from "./ui";

type View = "timeline" | "calendar" | "board";
const VIEWS: { id: View; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "calendar", label: "Kalender" },
  { id: "board", label: "Board" },
];
const OWNER_OPTS = [{ value: "", label: "Semua PIC" }, ...OWNERS.map((o) => ({ value: o, label: o }))];
const TYPE_OPTS = [{ value: "", label: "Semua tipe" }, ...TYPES.map((t) => ({ value: t.id, label: t.label }))];

export function StudioApp({ user }: { user: User }) {
  const { items, ready } = useStudio();
  // the view isn't rendered until the store is ready (client-only), so reading storage here can't mismatch hydration
  const [view, setView] = useState<View>(() => {
    try {
      const v = typeof window === "undefined" ? null : localStorage.getItem("deepa-studio:view");
      if (VIEWS.some((x) => x.id === v)) return v as View;
    } catch {}
    return "timeline";
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [owner, setOwner] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const tabs = useRef<Record<string, HTMLButtonElement | null>>({});
  const placed = useRef(false);

  usePressFeedback();

  const pick = (v: View) => {
    setView(v);
    try { localStorage.setItem("deepa-studio:view", v); } catch {}
  };

  // sliding pill behind the active tab
  useGSAP(
    () => {
      const b = tabs.current[view];
      if (!b || !indicator.current) return;
      const to = { x: b.offsetLeft, width: b.offsetWidth };
      if (!placed.current) gsap.set(indicator.current, to);
      else gsap.to(indicator.current, { ...to, duration: D(0.45), ease: "power3.out" });
      placed.current = true;
    },
    { dependencies: [view, ready] },
  );

  // content eases in whenever the view changes
  useGSAP(
    () => {
      if (!ready || !stage.current) return;
      gsap.from(stage.current, { opacity: 0, y: 10, duration: D(0.3), ease: "power2.out", clearProps: "opacity,transform" });
      gsap.from("[data-enter]", { opacity: 0, y: 12, duration: D(0.45), stagger: { amount: 0.4 }, ease: "power2.out", clearProps: "opacity,transform" });
    },
    { dependencies: [view, ready], scope: stage },
  );

  const today = ready ? todayISO() : "";
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!owner || i.owner === owner) &&
          (!type || i.type === type) &&
          (!q || (i.title + i.group + i.description).toLowerCase().includes(q.toLowerCase())),
      ),
    [items, owner, type, q],
  );

  if (!ready) return <main className="grid min-h-screen place-items-center font-mono text-sm text-faint">Memuat studio…</main>;

  const stats = {
    doing: items.filter((i) => i.status === "doing").length,
    week: items.filter((i) => i.status !== "done" && i.start <= addDays(today, 7) && i.end >= today).length,
    late: items.filter((i) => i.end < today && i.status !== "done").length,
    done: items.length ? Math.round((items.filter((i) => i.status === "done").length / items.length) * 100) : 0,
  };

  const create = (start: string) => setOpenId(actions.add({ start, end: start }));
  const exportJson = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }));
    a.download = `deepa-studio-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importJson = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data) || data.some((d) => !d.id || !d.start || !d.end)) throw new Error();
      if (confirm(`Ganti semua data dengan ${data.length} item dari file ini?`)) actions.replaceAll(data);
    } catch {
      alert("File tidak valid.");
    }
  };

  return (
    <main className="mx-auto max-w-[1400px] px-[clamp(16px,3vw,40px)] py-6">
      <header className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <p className="m-0 font-mono text-xs text-faint">DEEPA · INTERNAL</p>
          <h1 className="m-0 text-4xl font-extrabold tracking-[-0.04em]">Studio</h1>
        </div>
        <nav className="relative flex rounded-full border border-ink/20 bg-white p-1" aria-label="Tampilan">
          <span ref={indicator} className="absolute inset-y-1 left-0 rounded-full bg-ink" aria-hidden />
          {VIEWS.map((v) => (
            <button
              key={v.id}
              ref={(el) => { tabs.current[v.id] = el; }}
              onClick={() => pick(v.id)}
              aria-current={view === v.id}
              className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-bold transition-colors duration-300 ${view === v.id ? "text-paper" : "hover:text-ink/60"}`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" aria-label="Cari item" icon={<SearchIcon />} className="w-44" />
          <Select label="Filter PIC" value={owner} onChange={setOwner} options={OWNER_OPTS} className="w-36" />
          <Select label="Filter tipe" value={type} onChange={setType} options={TYPE_OPTS} className="w-40" />
          <button className="btn !bg-sun !py-2 font-extrabold" onClick={() => create(today)}>+ Item</button>
          <AccountMenu user={user} />
        </div>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sedang dikerjakan" value={stats.doing} />
        <Stat label="Aktif 7 hari ke depan" value={stats.week} />
        <Stat label="Terlambat" value={stats.late} warn={stats.late > 0} />
        <Stat label="Selesai" value={stats.done} suffix="%" />
      </section>

      <div ref={stage}>
        {view === "timeline" && <Timeline items={filtered} today={today} onOpen={setOpenId} />}
        {view === "calendar" && <CalendarView items={filtered} today={today} onOpen={setOpenId} onCreate={create} />}
        {view === "board" && <Board items={filtered} today={today} onOpen={setOpenId} />}
      </div>

      <footer className="mt-8 flex flex-wrap items-center gap-2 font-mono text-xs text-faint">
        <span>Data tersimpan di browser ini.</span>
        <button className="btn" onClick={exportJson}>Export JSON</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
        <button className="btn" onClick={() => confirm("Kembalikan ke data contoh? Data saat ini akan hilang.") && actions.reset()}>Reset contoh</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
      </footer>

      {openId && items.some((i) => i.id === openId) && (
        <ItemModal key={openId} id={openId} items={items} onClose={() => setOpenId(null)} />
      )}
    </main>
  );
}

function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const item = "block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-sun/50";
  return (
    <>
      <button ref={btn} className="btn flex items-center gap-2 !py-1.5" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <span className="grid size-6 place-items-center rounded-full bg-ink text-xs text-paper">{user.name.slice(0, 1).toUpperCase()}</span>
        <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
      </button>
      <Popover anchor={btn} open={open} onClose={close} className="w-60">
        <div role="menu">
          <div className="border-b border-ink/10 px-3 pb-2 pt-1">
            <div className="truncate font-bold">{user.name}</div>
            <div className="mb-1.5 truncate font-mono text-xs text-faint">{user.email}</div>
            <Pill size="sm" color={user.role === "admin" ? "#f2d338" : undefined}>{user.role === "admin" ? "Admin" : "User"}</Pill>
          </div>
          <div className="pt-1.5">
            {user.role === "admin" && <Link role="menuitem" href="/studio/users" className={item}>Kelola pengguna</Link>}
            <Link role="menuitem" href="/studio/account" className={item}>Ganti password</Link>
            <form action={logoutAction}>
              <button role="menuitem" className={`${item} text-red-700`}>Keluar</button>
            </form>
          </div>
        </div>
      </Popover>
    </>
  );
}

function Stat({ label, value, suffix = "", warn }: { label: string; value: number; suffix?: string; warn?: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const shown = useRef(0);
  useGSAP(
    () => {
      const o = { v: shown.current };
      gsap.to(o, {
        v: value,
        duration: D(0.8),
        ease: "power2.out",
        onUpdate: () => {
          shown.current = o.v;
          if (el.current) el.current.textContent = Math.round(o.v) + suffix;
        },
      });
    },
    { dependencies: [value, suffix] },
  );
  return (
    <div className={`rounded-2xl border p-4 transition-colors duration-500 ${warn ? "border-red-500/60 bg-red-50" : "border-ink/15 bg-white"}`}>
      <div ref={el} className="text-3xl font-extrabold tracking-tight" aria-label={`${value}${suffix}`} />
      <div className="font-mono text-xs text-faint">{label}</div>
    </div>
  );
}

/* ---------- item detail modal ---------- */

function ItemModal({ id, items, onClose }: { id: string; items: Item[]; onClose: () => void }) {
  const item = items.find((i) => i.id === id)!;
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (p: Partial<Item>) => actions.update(id, p);
  const groups = [...new Set(items.map((i) => i.group))];
  const days = diffDays(item.start, item.end) + 1;
  const status = STATUSES.find((s) => s.id === item.status)!;

  return (
    <Modal label="Detail item" onClose={onClose}>
      {(close) => (
        <>
          <div className="flex items-center gap-3 border-b border-ink/10 px-6 py-4">
            <span className="font-mono text-xs text-faint">ITEM</span>
            <Pill color={status.color} size="sm">{status.label}</Pill>
            <span className="font-mono text-xs text-faint">{days} hari</span>
            <button className="btn ml-auto" onClick={close} aria-label="Tutup">✕</button>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto px-6 py-5">
            <div data-stagger>
              <input
                className="field-ghost w-full text-2xl font-extrabold tracking-tight"
                value={item.title}
                onChange={(e) => set({ title: e.target.value })}
                aria-label="Judul"
                placeholder="Judul item"
                autoFocus
              />
            </div>

            <Field label="Deskripsi" className="" >
              <div data-stagger>
                <TextArea
                  rows={4}
                  value={item.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Tulis detail: tujuan, brief, link referensi, hal yang perlu disiapkan…"
                  aria-label="Deskripsi"
                />
              </div>
            </Field>

            <div className="grid gap-5 sm:grid-cols-2" data-stagger>
              <Field label="Status">
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <Pill key={s.id} color={s.color} selected={item.status === s.id} onClick={() => set({ status: s.id as Status })}>{s.label}</Pill>
                  ))}
                </div>
              </Field>
              <Field label="Tipe">
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <Pill key={t.id} selected={item.type === t.id} onClick={() => set({ type: t.id as ItemType })}>{t.label}</Pill>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" data-stagger>
              <Field label="Mulai">
                <DatePicker
                  label="Tanggal mulai"
                  value={item.start}
                  // keep the duration when the start moves
                  onChange={(d) => set({ start: d, end: addDays(d, diffDays(item.start, item.end)) })}
                />
              </Field>
              <Field label="Selesai">
                <DatePicker label="Tanggal selesai" value={item.end} min={item.start} onChange={(d) => set({ end: d })} />
              </Field>
              <Field label="PIC">
                <Select label="PIC" value={item.owner} onChange={(v) => set({ owner: v })} options={[...new Set([...OWNERS, item.owner])].map((o) => ({ value: o, label: o }))} />
              </Field>
              <Field label="Channel">
                <Select label="Channel" value={item.channel} onChange={(v) => set({ channel: v })} options={[...new Set([...CHANNELS, item.channel])].map((c) => ({ value: c, label: c === "-" ? "Tanpa channel" : c }))} />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2" data-stagger>
              <Field label="Proyek / kampanye (baris di timeline)">
                <TextInput value={item.group} onChange={(e) => set({ group: e.target.value })} aria-label="Proyek atau kampanye" />
                <div className="flex flex-wrap gap-1.5">
                  {groups.filter((g) => g !== item.group).map((g) => (
                    <Pill key={g} size="sm" onClick={() => set({ group: g })}>{g}</Pill>
                  ))}
                </div>
              </Field>
              <Field label={`Progres · ${item.progress}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  className="range"
                  style={{ "--p": `${item.progress}%` } as React.CSSProperties}
                  value={item.progress}
                  onChange={(e) => set({ progress: +e.target.value })}
                  aria-label="Progres"
                />
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink/10 px-6 py-4">
            {confirmDel ? (
              <span className="flex items-center gap-2 text-sm">
                Hapus permanen?
                <button className="btn !border-red-600 !bg-red-600 !text-white" onClick={() => { actions.remove(id); onClose(); }}>Ya, hapus</button>
                <button className="btn" onClick={() => setConfirmDel(false)}>Batal</button>
              </span>
            ) : (
              <button className="btn text-red-700" onClick={() => setConfirmDel(true)}>Hapus item</button>
            )}
            <button className="btn !bg-ink !text-paper" onClick={close}>Selesai</button>
          </div>
        </>
      )}
    </Modal>
  );
}
