"use client";

import { useState } from "react";
import { actions, STATUSES, TYPES, type Item, type Status } from "./store";
import { Pill } from "./ui";

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
                  data-enter
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)}
                  onClick={() => onOpen(i.id)}
                  className="cursor-grab rounded-xl border border-ink/20 bg-paper p-3 text-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink hover:shadow-[0_6px_0_-2px_rgb(20_19_18/0.12)]"
                >
                  <div className="font-bold leading-snug">{i.title}</div>
                  {i.description && <p className="m-0 mt-1 line-clamp-2 text-xs leading-snug text-faint">{i.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Pill size="sm">{TYPES.find((t) => t.id === i.type)?.label}</Pill>
                    {i.channel !== "-" && <Pill size="sm">{i.channel}</Pill>}
                    <Pill size="sm">{i.owner}</Pill>
                    <Pill size="sm" color={late ? "#ef4444" : undefined}>{i.end.slice(5).split("-").reverse().join("/")}{late ? " · telat" : ""}</Pill>
                  </div>
                  <div className="mt-2.5 h-1 overflow-hidden rounded bg-ink/10"><div className="h-full rounded bg-ink transition-[width] duration-500" style={{ width: `${i.progress}%` }} /></div>
                </article>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
