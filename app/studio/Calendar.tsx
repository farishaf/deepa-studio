"use client";

import { useState } from "react";
import { actions, addDays, diffDays, dow, STATUSES, type Item } from "./store";

const statusColor = (s: string) => STATUSES.find((x) => x.id === s)?.color ?? "#ccc";
const WEEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function CalendarView({
  items,
  today,
  onOpen,
  onCreate,
}: {
  items: Item[];
  today: string;
  onOpen: (id: string) => void;
  onCreate: (day: string) => void;
}) {
  const [month, setMonth] = useState(today.slice(0, 7)); // YYYY-MM
  const [over, setOver] = useState<string | null>(null);

  const first = month + "-01";
  const gridStart = addDays(first, -((dow(first) + 6) % 7));
  const cells = Array.from({ length: 42 }, (_, k) => addDays(gridStart, k));
  const shiftMonth = (n: number) => {
    const d = new Date(first + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    setMonth(d.toISOString().slice(0, 7));
  };
  const label = new Date(first + "T00:00:00Z").toLocaleDateString("id-ID", { timeZone: "UTC", month: "long", year: "numeric" });

  const drop = (e: React.DragEvent, day: string) => {
    e.preventDefault();
    setOver(null);
    const [id, off] = e.dataTransfer.getData("text/plain").split("|");
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const len = diffDays(it.start, it.end);
    const start = addDays(day, -Number(off || 0));
    actions.update(id, { start, end: addDays(start, len) });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => shiftMonth(-1)} aria-label="Bulan sebelumnya">←</button>
        <h2 className="m-0 min-w-44 text-center text-xl font-extrabold capitalize">{label}</h2>
        <button className="btn" onClick={() => shiftMonth(1)} aria-label="Bulan berikutnya">→</button>
        <button className="btn ml-2" onClick={() => setMonth(today.slice(0, 7))}>Hari ini</button>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-7 overflow-hidden rounded-2xl border border-ink/15 bg-white">
          {WEEK.map((w) => (
            <div key={w} className="border-b border-ink/15 bg-paper px-2 py-1.5 font-mono text-xs text-faint">{w}</div>
          ))}
          {cells.map((d) => {
            const inMonth = d.startsWith(month);
            const list = items.filter((i) => i.start <= d && i.end >= d);
            return (
              <div
                key={d}
                onDragOver={(e) => { e.preventDefault(); setOver(d); }}
                onDragLeave={() => setOver((o) => (o === d ? null : o))}
                onDrop={(e) => drop(e, d)}
                onDoubleClick={() => onCreate(d)}
                className={`min-h-28 border-b border-r border-ink/10 p-1.5 ${inMonth ? "" : "bg-paper/60 text-faint"} ${over === d ? "bg-sun/40" : ""}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className={`grid size-6 place-items-center rounded-full font-mono text-xs ${d === today ? "bg-ink text-paper" : ""}`}>{+d.slice(8)}</span>
                  <button onClick={() => onCreate(d)} className="rounded px-1 text-sm text-faint opacity-40 hover:bg-ink/10 hover:opacity-100" aria-label={`Tambah item ${d}`}>+</button>
                </div>
                <div className="flex flex-col gap-1">
                  {list.slice(0, 3).map((i) => (
                    <button
                      key={i.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", `${i.id}|${diffDays(i.start, d)}`)}
                      onClick={() => onOpen(i.id)}
                      className={`cursor-grab truncate rounded-md border border-ink/40 px-1.5 py-0.5 text-left text-[11px] font-bold ${i.status === "done" ? "line-through opacity-60" : ""}`}
                      style={{ background: statusColor(i.status) + "88" }}
                      title={i.title}
                    >
                      {i.start === d || dow(d) === 1 ? i.title : <span className="opacity-60">↳ {i.title}</span>}
                    </button>
                  ))}
                  {list.length > 3 && <span className="px-1 font-mono text-[10px] text-faint">+{list.length - 3} lagi</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="font-mono text-xs text-faint">Tarik item ke tanggal lain · klik dua kali pada tanggal untuk membuat item</p>
    </div>
  );
}
