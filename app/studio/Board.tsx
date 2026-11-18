"use client";

import { useState } from "react";
import { actions, STATUSES, TYPES, type Item, type Status } from "./store";

export function Board({ items, today, onOpen }: { items: Item[]; today: string; onOpen: (id: string) => void }) {
  const [over, setOver] = useState<Status | null>(null);
  return (
    <div className="grid gap-3 overflow-x-auto pb-2 [grid-template-columns:repeat(5,minmax(220px,1fr))]">
      {STATUSES.map((s) => {
        const list = items.filter((i) => i.status === s.id).sort((a, b) => a.start.localeCompare(b.start));
        return (
          <section
            key={s.id}
            onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
            onDragLeave={() => setOver((o) => (o === s.id ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/plain");
              if (items.some((i) => i.id === id)) actions.update(id, { status: s.id });
            }}
            className={`flex min-h-64 flex-col gap-2 rounded-2xl border border-ink/15 p-2 ${over === s.id ? "bg-sun/40" : "bg-white"}`}
          >
            <h3 className="m-0 flex items-center gap-2 px-1 text-sm font-extrabold">
              <span className="size-2.5 rounded-full" style={{ background: s.color }} />
              {s.label}
              <span className="ml-auto font-mono text-xs text-faint">{list.length}</span>
            </h3>
            {list.map((i) => {
              const late = i.end < today && i.status !== "done";
              return (
                <article
                  key={i.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                  onClick={() => onOpen(i.id)}
                  className="cursor-grab rounded-xl border border-ink/20 bg-paper p-2.5 text-sm hover:border-ink"
                >
                  <div className="font-bold leading-snug">{i.title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-[10px] text-faint">
                    <span className="rounded bg-ink/10 px-1.5 py-0.5 text-ink">{TYPES.find((t) => t.id === i.type)?.label}</span>
                    {i.channel !== "-" && <span>{i.channel}</span>}
                    <span>{i.owner}</span>
                    <span className={late ? "font-bold text-red-600" : ""}>{i.end.slice(5).split("-").reverse().join("/")}{late ? " · telat" : ""}</span>
                  </div>
                  <div className="mt-2 h-1 rounded bg-ink/10"><div className="h-full rounded bg-ink" style={{ width: `${i.progress}%` }} /></div>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
