"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Board } from "./Board";
import { CalendarView } from "./Calendar";
import { Timeline } from "./Timeline";
import { actions, CHANNELS, OWNERS, STATUSES, TYPES, todayISO, useStudio, type Item, type ItemType, type Status } from "./store";

type View = "timeline" | "calendar" | "board";
const VIEWS: { id: View; label: string }[] = [
  { id: "timeline", label: "Timeline" },
  { id: "calendar", label: "Kalender" },
  { id: "board", label: "Board" },
];

export function StudioApp() {
  const { items, ready } = useStudio();
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

  // the view isn't rendered until the store is ready (client-only), so reading storage here can't mismatch hydration
  const pick = (v: View) => {
    setView(v);
    try { localStorage.setItem("deepa-studio:view", v); } catch {}
  };

  const today = ready ? todayISO() : "";
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (!owner || i.owner === owner) &&
          (!type || i.type === type) &&
          (!q || (i.title + i.group + i.notes).toLowerCase().includes(q.toLowerCase())),
      ),
    [items, owner, type, q],
  );

  if (!ready) return <main className="grid min-h-screen place-items-center font-mono text-sm text-faint">Memuat studio…</main>;

  const stats = {
    doing: items.filter((i) => i.status === "doing").length,
    week: items.filter((i) => i.status !== "done" && i.start <= addWeek(today) && i.end >= today).length,
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
        <nav className="flex rounded-full border border-ink/20 bg-white p-1" aria-label="Tampilan">
          {VIEWS.map((v) => (
            <button key={v.id} onClick={() => pick(v.id)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${view === v.id ? "bg-ink text-paper" : "hover:bg-ink/5"}`}>
              {v.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari…" className="field w-36" />
          <select value={owner} onChange={(e) => setOwner(e.target.value)} className="field" aria-label="Filter PIC">
            <option value="">Semua PIC</option>
            {OWNERS.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="field" aria-label="Filter tipe">
            <option value="">Semua tipe</option>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button className="btn bg-sun font-extrabold" onClick={() => create(today)}>+ Item</button>
        </div>
      </header>

      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Sedang dikerjakan" value={stats.doing} />
        <Stat label="Aktif 7 hari ke depan" value={stats.week} />
        <Stat label="Terlambat" value={stats.late} warn={stats.late > 0} />
        <Stat label="Selesai" value={stats.done + "%"} />
      </section>

      {view === "timeline" && <Timeline items={filtered} today={today} onOpen={setOpenId} />}
      {view === "calendar" && <CalendarView items={filtered} today={today} onOpen={setOpenId} onCreate={create} />}
      {view === "board" && <Board items={filtered} today={today} onOpen={setOpenId} />}

      <footer className="mt-8 flex flex-wrap items-center gap-2 font-mono text-xs text-faint">
        <span>Data tersimpan di browser ini.</span>
        <button className="btn" onClick={exportJson}>Export JSON</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>Import JSON</button>
        <button className="btn" onClick={() => confirm("Kembalikan ke data contoh? Data saat ini akan hilang.") && actions.reset()}>Reset contoh</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }} />
      </footer>

      {openId && <Editor key={openId} item={items.find((i) => i.id === openId)} groups={[...new Set(items.map((i) => i.group))]} onClose={() => setOpenId(null)} />}
    </main>
  );
}

const addWeek = (iso: string) => new Date(Date.parse(iso + "T00:00:00Z") + 7 * 86400000).toISOString().slice(0, 10);

function Stat({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${warn ? "border-red-500/60 bg-red-50" : "border-ink/15 bg-white"}`}>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="font-mono text-xs text-faint">{label}</div>
    </div>
  );
}

function Editor({ item, groups, onClose }: { item?: Item; groups: string[]; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  if (!item) return null;
  const set = (p: Partial<Item>) => actions.update(item.id, p);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="flex h-full w-full max-w-md flex-col gap-3 overflow-y-auto bg-paper p-5 shadow-2xl" role="dialog" aria-label="Edit item">
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-extrabold">Edit item</h2>
          <button className="btn" onClick={onClose}>Tutup</button>
        </div>
        <Field label="Judul"><input className="field w-full" value={item.title} onChange={(e) => set({ title: e.target.value })} autoFocus /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipe">
            <select className="field w-full" value={item.type} onChange={(e) => set({ type: e.target.value as ItemType })}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="field w-full" value={item.status} onChange={(e) => set({ status: e.target.value as Status })}>
              {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Mulai"><input type="date" className="field w-full" value={item.start} onChange={(e) => e.target.value && set({ start: e.target.value })} /></Field>
          <Field label="Selesai"><input type="date" className="field w-full" value={item.end} min={item.start} onChange={(e) => e.target.value && set({ end: e.target.value })} /></Field>
          <Field label="PIC">
            <select className="field w-full" value={item.owner} onChange={(e) => set({ owner: e.target.value })}>
              {[...new Set([...OWNERS, item.owner])].map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Channel">
            <select className="field w-full" value={item.channel} onChange={(e) => set({ channel: e.target.value })}>
              {[...new Set([...CHANNELS, item.channel])].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Proyek / kampanye (baris di timeline)">
          <input className="field w-full" list="groups" value={item.group} onChange={(e) => set({ group: e.target.value })} />
          <datalist id="groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
        </Field>
        <Field label={`Progres · ${item.progress}%`}>
          <input type="range" min={0} max={100} step={5} className="w-full accent-ink" value={item.progress} onChange={(e) => set({ progress: +e.target.value })} />
        </Field>
        <Field label="Catatan"><textarea className="field min-h-28 w-full" value={item.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        <button className="btn mt-auto self-start text-red-700" onClick={() => { if (confirm("Hapus item ini?")) { actions.remove(item.id); onClose(); } }}>Hapus item</button>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-xs text-faint">{label}</span>
      {children}
    </label>
  );
}
