"use client";

import { useRef, useState } from "react";
import { actions, addDays, diffDays, dow, STATUSES, type Item } from "./store";

const ROW = 38;
const GROUP = 30;
const LABEL_W = 230;

type Drag = { id: string; mode: "move" | "l" | "r"; x0: number; delta: number; moved: boolean };

const statusColor = (s: string) => STATUSES.find((x) => x.id === s)?.color ?? "#ccc";
const fmt = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", { timeZone: "UTC", ...o });

export function Timeline({
  items,
  today,
  onOpen,
}: {
  items: Item[];
  today: string;
  onOpen: (id: string) => void;
}) {
  const [dayW, setDayW] = useState(34);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // timeline range
  const minS = items.length ? items.reduce((m, i) => (i.start < m ? i.start : m), today) : today;
  const maxE = items.length ? items.reduce((m, i) => (i.end > m ? i.end : m), today) : today;
  const early = addDays(minS, -7);
  const origin = addDays(early, -((dow(early) + 6) % 7)); // a Monday, ≥7 days before the first item
  const total = Math.max(70, diffDays(origin, maxE) + 28);
  const W = total * dayW;

  // grouped rows
  const groups = new Map<string, Item[]>();
  for (const i of items) groups.set(i.group, [...(groups.get(i.group) ?? []), i]);
  type Row = { kind: "g"; name: string; y: number; n: number } | { kind: "i"; item: Item; y: number };
  const rows: Row[] = [];
  let y = 0;
  for (const [name, list] of [...groups].sort((a, b) => a[0].localeCompare(b[0]))) {
    rows.push({ kind: "g", name, y, n: list.length });
    y += GROUP;
    for (const item of [...list].sort((a, b) => a.start.localeCompare(b.start))) {
      rows.push({ kind: "i", item, y });
      y += ROW;
    }
  }
  const H = Math.max(y, 120);

  const days = Array.from({ length: total }, (_, k) => addDays(origin, k));
  const months: { label: string; left: number; width: number }[] = [];
  days.forEach((d, k) => {
    const label = fmt(d, { month: "long", year: "numeric" });
    const last = months[months.length - 1];
    if (last && last.label === label) last.width += dayW;
    else months.push({ label, left: k * dayW, width: dayW });
  });

  const shown = (it: Item) => {
    if (!drag || drag.id !== it.id) return it;
    const d = drag.delta;
    if (drag.mode === "move") return { ...it, start: addDays(it.start, d), end: addDays(it.end, d) };
    if (drag.mode === "l") return { ...it, start: addDays(it.start, Math.min(d, diffDays(it.start, it.end))) };
    return { ...it, end: addDays(it.end, Math.max(d, -diffDays(it.start, it.end))) };
  };

  const begin = (e: React.PointerEvent, id: string, mode: Drag["mode"]) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id, mode, x0: e.clientX, delta: 0, moved: false };
    setDrag(dragRef.current);
  };
  const move = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    const next = { ...d, delta: Math.round(dx / dayW), moved: d.moved || Math.abs(dx) > 4 };
    dragRef.current = next;
    setDrag(next);
  };
  const end = () => {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d) return;
    if (!d.moved) return onOpen(d.id);
    const it = items.find((i) => i.id === d.id);
    if (!it || d.delta === 0) return;
    const n = shown(it);
    // `shown` reads state `drag`, which is still set in this closure
    actions.update(d.id, { start: n.start, end: n.end });
  };

  const todayX = diffDays(origin, today) * dayW;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm">
        <button className="btn" onClick={() => scroller.current?.scrollTo({ left: Math.max(0, todayX - 200), behavior: "smooth" })}>
          Ke hari ini
        </button>
        <span className="ml-auto font-mono text-xs text-faint">Zoom</span>
        <input type="range" min={18} max={64} value={dayW} onChange={(e) => setDayW(+e.target.value)} className="w-28 accent-ink" aria-label="Zoom timeline" />
      </div>

      <div ref={scroller} className="relative max-h-[70vh] overflow-auto rounded-2xl border border-ink/15 bg-white select-none">
        {/* header */}
        <div className="sticky top-0 z-50 flex bg-paper" style={{ width: LABEL_W + W }}>
          <div className="sticky left-0 z-[60] shrink-0 border-b border-r border-ink/15 bg-paper px-3 py-2 font-mono text-xs text-faint" style={{ width: LABEL_W }}>
            ITEM · {items.length}
          </div>
          <div className="relative border-b border-ink/15" style={{ width: W, height: 52 }}>
            {months.map((m) => (
              <div key={m.label} className="absolute top-0 truncate border-r border-ink/10 px-2 py-1 text-xs font-bold capitalize" style={{ left: m.left, width: m.width }}>
                {m.label}
              </div>
            ))}
            {days.map((d, k) => {
              const wk = dow(d) === 0 || dow(d) === 6;
              return (
                <div
                  key={d}
                  className={`absolute bottom-0 text-center font-mono text-[10px] leading-[22px] ${wk ? "text-faint" : ""} ${d === today ? "bg-sun font-bold" : ""}`}
                  style={{ left: k * dayW, width: dayW }}
                >
                  {dayW >= 26 ? +d.slice(8) : +d.slice(8) % 5 === 0 ? +d.slice(8) : ""}
                </div>
              );
            })}
          </div>
        </div>

        {/* body */}
        <div className="flex" style={{ width: LABEL_W + W, height: H }}>
          <div className="sticky left-0 z-40 shrink-0 border-r border-ink/15 bg-white" style={{ width: LABEL_W }}>
            {rows.map((r) =>
              r.kind === "g" ? (
                <div key={"g" + r.name} className="flex items-center justify-between bg-paper px-3 text-xs font-extrabold uppercase tracking-wide" style={{ height: GROUP }}>
                  <span className="truncate">{r.name}</span>
                  <span className="font-mono text-faint">{r.n}</span>
                </div>
              ) : (
                <button
                  key={r.item.id}
                  onClick={() => onOpen(r.item.id)}
                  className="flex w-full items-center gap-2 border-b border-ink/5 px-3 text-left text-sm hover:bg-paper"
                  style={{ height: ROW }}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: statusColor(r.item.status) }} />
                  <span className="truncate">{r.item.title}</span>
                </button>
              ),
            )}
          </div>

          <div
            className="relative"
            style={{
              width: W,
              backgroundImage: `linear-gradient(to right, rgb(20 19 18 / 0.06) 1px, transparent 1px)`,
              backgroundSize: `${dayW}px 100%`,
              backgroundPosition: `${-0}px 0`,
            }}
          >
            {/* weekend shading */}
            {days.map((d, k) =>
              dow(d) === 0 || dow(d) === 6 ? (
                <div key={d} className="absolute inset-y-0 bg-ink/[0.035]" style={{ left: k * dayW, width: dayW }} />
              ) : null,
            )}
            {rows.map((r) =>
              r.kind === "g" ? (
                <div key={"g" + r.name} className="absolute inset-x-0 bg-paper/70" style={{ top: r.y, height: GROUP }} />
              ) : (
                <div key={r.item.id} className="absolute inset-x-0 border-b border-ink/5" style={{ top: r.y, height: ROW }} />
              ),
            )}
            {todayX >= 0 && <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-ink" style={{ left: todayX + dayW / 2 }} />}

            {rows.map((r) => {
              if (r.kind !== "i") return null;
              const it = shown(r.item);
              const left = diffDays(origin, it.start) * dayW;
              const width = (diffDays(it.start, it.end) + 1) * dayW;
              const active = drag?.id === it.id;
              const color = statusColor(it.status);
              return (
                <div
                  key={it.id}
                  data-enter
                  onPointerDown={(e) => begin(e, it.id, "move")}
                  onPointerMove={move}
                  onPointerUp={end}
                  onPointerCancel={end}
                  title={`${it.title}\n${fmt(it.start, { day: "numeric", month: "short" })} – ${fmt(it.end, { day: "numeric", month: "short" })} · ${it.owner}`}
                  className={`absolute z-20 flex cursor-grab items-center overflow-hidden rounded-lg border border-ink/60 text-xs font-bold touch-none ${active ? "cursor-grabbing shadow-lg ring-2 ring-ink" : ""}`}
                  style={{ left, width, top: r.y + 6, height: ROW - 12, background: color + "66" }}
                >
                  <div className="absolute inset-y-0 left-0" style={{ width: `${it.progress}%`, background: color }} />
                  <span className="relative truncate px-3">{it.title}</span>
                  <span onPointerDown={(e) => begin(e, it.id, "l")} onPointerMove={move} onPointerUp={end} className="absolute inset-y-0 left-0 z-10 w-2 cursor-ew-resize hover:bg-ink/25" />
                  <span onPointerDown={(e) => begin(e, it.id, "r")} onPointerMove={move} onPointerUp={end} className="absolute inset-y-0 right-0 z-10 w-2 cursor-ew-resize hover:bg-ink/25" />
                </div>
              );
            })}
            {!rows.length && <p className="p-6 text-sm text-faint">Belum ada item. Tambah lewat tombol “+ Item”.</p>}
          </div>
        </div>
      </div>
      <p className="font-mono text-xs text-faint">Geser bar untuk memindah jadwal · tarik tepi kiri/kanan untuk ubah durasi · klik untuk edit</p>
    </div>
  );
}
