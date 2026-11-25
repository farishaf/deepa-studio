"use client";

import { useSyncExternalStore } from "react";

/* ---------- types ---------- */

export const STATUSES = [
  { id: "idea", label: "Ide", color: "#b9b4ab" },
  { id: "planned", label: "Direncanakan", color: "#7fb8e6" },
  { id: "doing", label: "Dikerjakan", color: "#f2d338" },
  { id: "review", label: "Review", color: "#f0a35e" },
  { id: "done", label: "Selesai", color: "#7bc47f" },
] as const;
export type Status = (typeof STATUSES)[number]["id"];

export const TYPES = [
  { id: "content", label: "Konten" },
  { id: "marketing", label: "Marketing" },
  { id: "project", label: "Proyek klien" },
  { id: "internal", label: "Internal" },
] as const;
export type ItemType = (typeof TYPES)[number]["id"];

export const OWNERS = ["Faris", "Herlina", "Tim"] as const;
export const CHANNELS = ["Instagram", "TikTok", "LinkedIn", "Blog", "WhatsApp", "Website", "-"] as const;

export type Item = {
  id: string;
  title: string;
  type: ItemType;
  status: Status;
  group: string; // project / campaign name → Gantt row group
  owner: string;
  channel: string;
  start: string; // YYYY-MM-DD
  end: string; // inclusive
  progress: number; // 0-100
  description: string;
};

/* ---------- date helpers (UTC day math, timezone-safe) ---------- */

const DAY = 86400000;
export const toDay = (iso: string) => Math.floor(Date.parse(iso + "T00:00:00Z") / DAY);
export const fromDay = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
export const addDays = (iso: string, n: number) => fromDay(toDay(iso) + n);
export const diffDays = (a: string, b: string) => toDay(b) - toDay(a);
export const todayISO = () => {
  const d = new Date();
  return fromDay(Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / DAY));
};
export const dow = (iso: string) => new Date(iso + "T00:00:00Z").getUTCDay(); // 0 = Sunday

/* ---------- store ---------- */

type State = { items: Item[]; ready: boolean };
const KEY = "deepa-studio:v1";
const SERVER: State = { items: [], ready: false };

let state: State = SERVER;
let loaded = false;
const listeners = new Set<() => void>();

function seed(): Item[] {
  const t = todayISO();
  const mk = (
    n: number,
    title: string,
    type: ItemType,
    status: Status,
    group: string,
    owner: string,
    channel: string,
    off: number,
    len: number,
    progress: number,
    description = "",
  ): Item => ({
    id: "seed" + n,
    title,
    type,
    status,
    group,
    owner,
    channel,
    start: addDays(t, off),
    end: addDays(t, off + len - 1),
    progress,
    description,
  });
  return [
    mk(1, "Riset kompetitor & audiens", "marketing", "done", "Kampanye Q1", "Herlina", "-", -9, 4, 100, "Petakan 5 kompetitor lokal: gaya visual, frekuensi posting, dan celah yang bisa kita isi."),
    mk(2, "Kalender konten 1 bulan", "marketing", "doing", "Kampanye Q1", "Herlina", "-", -3, 6, 60, "Tema bulan ini: before/after brand UMKM.\nTarget 12 posting: 6 Reels, 4 carousel, 2 artikel."),
    mk(3, "Reels: proses bikin logo", "content", "planned", "Kampanye Q1", "Herlina", "Instagram", 4, 2, 0, "Video 30–45 detik: dari sketsa kasar sampai logo final. Musik santai, teks singkat."),
    mk(4, "Carousel: 5 tanda website perlu redesign", "content", "idea", "Kampanye Q1", "Faris", "Instagram", 7, 3, 0),
    mk(5, "Artikel blog: kenapa UMKM butuh landing page", "content", "planned", "Kampanye Q1", "Faris", "Blog", 9, 4, 0),
    mk(6, "Discovery & wireframe", "project", "done", "Klien: Kopi Senja", "Faris", "-", -8, 5, 100, "Workshop kebutuhan, sitemap, dan wireframe halaman utama disetujui klien."),
    mk(7, "Desain UI & brand kit", "project", "doing", "Klien: Kopi Senja", "Herlina", "-", -2, 7, 45),
    mk(8, "Development & integrasi", "project", "planned", "Klien: Kopi Senja", "Faris", "-", 5, 9, 0),
    mk(9, "Review & rilis", "project", "idea", "Klien: Kopi Senja", "Tim", "-", 14, 3, 0),
    mk(10, "Rapikan portfolio studio", "internal", "review", "Internal", "Tim", "Website", -1, 5, 80, "Tambah 3 studi kasus terbaru dan perbarui foto tim."),
    mk(11, "Template proposal & invoice", "internal", "planned", "Internal", "Tim", "-", 3, 4, 0),
  ];
}

// older saved data used `notes`; fold it into `description`
export function normalize(raw: unknown): Item[] {
  return (raw as (Item & { notes?: string })[]).map(({ notes, ...i }) => ({ ...i, description: i.description ?? notes ?? "" }));
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  let items: Item[] | null = null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) items = normalize(JSON.parse(raw));
  } catch {}
  state = { items: items ?? seed(), ready: true };
}

function commit(items: Item[]) {
  state = { items, ready: true };
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    try {
      state = { items: e.newValue ? normalize(JSON.parse(e.newValue)) : seed(), ready: true };
      cb();
    } catch {}
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useStudio() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return state;
    },
    () => SERVER,
  );
}

export const actions = {
  add(partial: Partial<Item> & { start: string }): string {
    const id = "i" + Math.random().toString(36).slice(2, 9);
    const item: Item = {
      id,
      title: "Item baru",
      type: "content",
      status: "idea",
      group: "Umum",
      owner: "Tim",
      channel: "-",
      end: partial.start,
      progress: 0,
      description: "",
      ...partial,
    };
    commit([...state.items, item]);
    return id;
  },
  update(id: string, patch: Partial<Item>) {
    commit(
      state.items.map((i) => {
        if (i.id !== id) return i;
        const n = { ...i, ...patch };
        if (n.end < n.start) n.end = n.start;
        if (patch.status === "done") n.progress = 100;
        return n;
      }),
    );
  },
  remove(id: string) {
    commit(state.items.filter((i) => i.id !== id));
  },
  replaceAll(items: Item[]) {
    commit(normalize(items));
  },
  reset() {
    commit(seed());
  },
};
