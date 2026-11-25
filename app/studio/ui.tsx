"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { addDays, dow, todayISO } from "./store";

gsap.registerPlugin(useGSAP);

/* ---------- motion helpers ---------- */

const motionOK = () => typeof window !== "undefined" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
/** Duration that collapses to 0 when the user prefers reduced motion. */
export const D = (s: number) => (motionOK() ? s : 0);

/** Tactile press feedback for every `.btn` / `[data-press]` element (delegated, one listener pair). */
export function usePressFeedback() {
  useEffect(() => {
    const target = (e: Event) => (e.target as HTMLElement | null)?.closest?.<HTMLElement>(".btn, [data-press]") ?? null;
    const down = (e: PointerEvent) => {
      const el = target(e);
      if (el && !(el as HTMLButtonElement).disabled) gsap.to(el, { scale: 0.95, duration: D(0.1), ease: "power2.out", overwrite: "auto" });
    };
    const up = (e: PointerEvent) => {
      const el = target(e);
      if (el) gsap.to(el, { scale: 1, duration: D(0.5), ease: "elastic.out(1.1, 0.45)", overwrite: "auto", clearProps: "transform" });
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerup", up);
      document.removeEventListener("pointercancel", up);
    };
  }, []);
}

const fmtDate = (iso: string, o: Intl.DateTimeFormatOptions) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("id-ID", { timeZone: "UTC", ...o });

/* ---------- Pill ---------- */

export function Pill({
  children,
  color,
  selected,
  onClick,
  size = "md",
  className = "",
  title,
}: {
  children: ReactNode;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
  className?: string;
  title?: string;
}) {
  const base = `inline-flex items-center gap-1.5 rounded-full border font-bold leading-none whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-200 ${
    size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
  }`;
  const style = color
    ? { background: selected ? color : color + "33", borderColor: selected ? "var(--color-ink)" : "transparent" }
    : undefined;
  const tone = color ? "text-ink" : selected ? "border-ink bg-ink text-paper" : "border-transparent bg-ink/[0.07] text-ink";
  const dot = color && <span className="size-1.5 rounded-full" style={{ background: selected ? "var(--color-ink)" : color }} />;
  if (!onClick)
    return (
      <span className={`${base} ${tone} ${className}`} style={style} title={title}>
        {dot}
        {children}
      </span>
    );
  return (
    <button
      type="button"
      data-press
      onClick={onClick}
      aria-pressed={!!selected}
      title={title}
      className={`${base} ${tone} cursor-pointer hover:border-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected ? "shadow-[0_2px_0_var(--color-ink)]" : ""} ${className}`}
      style={style}
    >
      {dot}
      {children}
    </button>
  );
}

/* ---------- Field, TextInput, TextArea ---------- */

export function Field({ label, children, className = "" }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{label}</span>
      {children}
    </div>
  );
}

export function TextInput({
  icon,
  className = "",
  ghost,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode; ghost?: boolean }) {
  return (
    <span className={`relative flex items-center ${className}`}>
      {icon && <span className="pointer-events-none absolute left-3 text-faint">{icon}</span>}
      <input {...rest} className={`${ghost ? "field-ghost" : "field"} w-full ${icon ? "!pl-9" : ""}`} />
    </span>
  );
}

export function TextArea({ className = "", ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`field w-full resize-y leading-relaxed ${className}`} />;
}

export const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="9" cy="9" r="6" />
    <path d="M14 14l4 4" />
  </svg>
);
const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-faint transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
    <path d="M5 8l5 5 5-5" />
  </svg>
);

/* ---------- Popover (portal, animated, auto-flip) ---------- */

export function Popover({
  anchor,
  open,
  onClose,
  children,
  matchWidth,
  className = "",
}: {
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  matchWidth?: boolean;
  className?: string;
}) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  const ref = useRef<HTMLDivElement>(null);
  const up = useRef(false);

  useLayoutEffect(() => {
    if (!mounted || !open) return;
    const place = () => {
      const el = ref.current;
      const a = anchor.current?.getBoundingClientRect();
      if (!el || !a) return;
      const h = el.offsetHeight;
      const w = matchWidth ? a.width : el.offsetWidth;
      up.current = a.bottom + 6 + h > innerHeight - 8 && a.top - h - 6 > 8;
      el.style.top = (up.current ? a.top - h - 6 : a.bottom + 6) + "px";
      el.style.left = Math.max(8, Math.min(a.left, innerWidth - w - 8)) + "px";
      if (matchWidth) el.style.width = a.width + "px";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [mounted, open, anchor, matchWidth]);

  useEffect(() => {
    const el = ref.current;
    if (!mounted || !el) return;
    const dy = up.current ? 8 : -8;
    if (open) {
      gsap.fromTo(el, { opacity: 0, y: dy, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: D(0.24), ease: "power3.out", overwrite: true });
    } else {
      gsap.to(el, { opacity: 0, y: dy / 2, scale: 0.98, duration: D(0.14), ease: "power2.in", overwrite: true, onComplete: () => setMounted(false) });
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !anchor.current?.contains(t)) onClose();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation(); // don't also close a parent modal
        onClose();
      } else if (e.key === "Tab") onClose();
    };
    document.addEventListener("pointerdown", down);
    window.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      window.removeEventListener("keydown", key, true);
    };
  }, [open, onClose, anchor]);

  if (!mounted) return null;
  return createPortal(
    <div
      ref={ref}
      className={`fixed z-[70] rounded-2xl border border-ink/15 bg-white p-1.5 shadow-[0_12px_40px_-8px_rgb(20_19_18/0.25)] ${className}`}
      style={{ top: 0, left: 0 }}
    >
      {children}
    </div>,
    document.body,
  );
}

/* ---------- Select (custom dropdown) ---------- */

export type Option = { value: string; label: string; color?: string };

export function Select({
  value,
  onChange,
  options,
  label,
  placeholder = "Pilih…",
  className = "",
  size = "md",
}: {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  label: string;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const sel = options.find((o) => o.value === value);

  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };
  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    btn.current?.focus();
  };
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open || !list.current) return;
    gsap.from(list.current.children, { opacity: 0, y: -5, duration: D(0.2), stagger: 0.018, ease: "power2.out", clearProps: "all" });
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, open, id]);

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    const n = options.length;
    const move = (to: number) => {
      e.preventDefault();
      setActive(to);
    };
    if (e.key === "ArrowDown") move((active + 1) % n);
    else if (e.key === "ArrowUp") move((active - 1 + n) % n);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(n - 1);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(options[active].value);
    }
  };

  return (
    <>
      <button
        ref={btn}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-${active}` : undefined}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKey}
        data-open={open}
        className={`field flex items-center justify-between gap-2 text-left ${size === "sm" ? "!py-1.5" : ""} ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {sel?.color && <span className="size-2 shrink-0 rounded-full" style={{ background: sel.color }} />}
          <span className={`truncate ${sel ? "" : "text-faint"}`}>{sel?.label ?? placeholder}</span>
        </span>
        <Chevron open={open} />
      </button>
      <Popover anchor={btn} open={open} onClose={close} matchWidth className="max-h-64 overflow-y-auto">
        <div ref={list} id={`${id}-list`} role="listbox" aria-label={label} className="flex flex-col gap-0.5">
          {options.map((o, i) => (
            <div
              key={o.value}
              id={`${id}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(o.value)}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors duration-150 ${i === active ? "bg-sun/50" : ""} ${o.value === value ? "font-bold" : ""}`}
            >
              {o.color && <span className="size-2 shrink-0 rounded-full" style={{ background: o.color }} />}
              <span className="truncate">{o.label}</span>
              {o.value === value && (
                <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </Popover>
    </>
  );
}

/* ---------- DatePicker ---------- */

const WEEK = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export function DatePicker({ value, onChange, min, label }: { value: string; onChange: (iso: string) => void; min?: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(value.slice(0, 7));
  const btn = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const dir = useRef(0);
  const today = todayISO();

  const first = view + "-01";
  const cells = Array.from({ length: 42 }, (_, k) => addDays(first, k - ((dow(first) + 6) % 7)));
  const close = useCallback(() => setOpen(false), []);
  const shift = (n: number) => {
    dir.current = n;
    const d = new Date(first + "T00:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + n);
    setView(d.toISOString().slice(0, 7));
  };
  const pick = (d: string) => {
    onChange(d);
    setOpen(false);
    btn.current?.focus();
  };

  // slide the day grid in the direction of travel when the month changes
  useEffect(() => {
    if (!open || !grid.current || !dir.current) return;
    gsap.fromTo(grid.current, { opacity: 0, x: dir.current * 22 }, { opacity: 1, x: 0, duration: D(0.28), ease: "power3.out", overwrite: true });
    dir.current = 0;
  }, [view, open]);

  const onGridKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    if (!step) return;
    e.preventDefault();
    const btns = [...(grid.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? [])];
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    btns[Math.max(0, Math.min(btns.length - 1, i + step))]?.focus();
  };

  const monthLabel = fmtDate(first, { month: "long", year: "numeric" });
  return (
    <>
      <button
        ref={btn}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            dir.current = 0;
            setView(value.slice(0, 7));
          }
          setOpen(!open);
        }}
        className="field flex items-center justify-between gap-2 text-left"
      >
        <span>{fmtDate(value, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="shrink-0 text-faint">
          <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
          <path d="M3 8.5h14M7 2.5v3M13 2.5v3" />
        </svg>
      </button>
      <Popover anchor={btn} open={open} onClose={close} className="w-[17.5rem] p-3">
        <div role="dialog" aria-label={label}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="btn !px-2.5" onClick={() => shift(-1)} aria-label="Bulan sebelumnya">←</button>
            <span className="text-sm font-extrabold capitalize">{monthLabel}</span>
            <button type="button" className="btn !px-2.5" onClick={() => shift(1)} aria-label="Bulan berikutnya">→</button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center font-mono text-[10px] text-faint">
            {WEEK.map((w) => <span key={w}>{w}</span>)}
          </div>
          <div ref={grid} className="grid grid-cols-7 gap-0.5" onKeyDown={onGridKey}>
            {cells.map((d) => {
              const off = !d.startsWith(view);
              const dis = !!min && d < min;
              const on = d === value;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={dis}
                  data-press
                  onClick={() => pick(d)}
                  aria-label={fmtDate(d, { day: "numeric", month: "long", year: "numeric" })}
                  aria-pressed={on}
                  className={`grid aspect-square place-items-center rounded-full text-xs transition-colors duration-150 ${
                    on ? "bg-ink font-bold text-paper" : dis ? "cursor-not-allowed text-faint/40" : "hover:bg-sun/60"
                  } ${off && !on ? "text-faint/60" : ""} ${d === today && !on ? "font-extrabold ring-1 ring-ink" : ""}`}
                >
                  {+d.slice(8)}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex justify-between border-t border-ink/10 pt-2">
            <button type="button" className="btn" disabled={!!min && today < min} onClick={() => pick(today)}>Hari ini</button>
            <button type="button" className="btn" onClick={close}>Tutup</button>
          </div>
        </div>
      </Popover>
    </>
  );
}

/* ---------- Modal (centered, animated in/out) ---------- */

export function Modal({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: (close: () => void) => ReactNode;
}) {
  const backdrop = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => setClosing(true), []);

  useGSAP(
    () => {
      if (!closing) return;
      gsap
        .timeline({ onComplete: onClose })
        .to(panel.current, { opacity: 0, y: 18, scale: 0.97, duration: D(0.2), ease: "power2.in" })
        .to(backdrop.current, { opacity: 0, duration: D(0.2) }, 0);
    },
    { dependencies: [closing] },
  );

  useGSAP(
    () => {
      gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: D(0.3) });
      gsap.fromTo(panel.current, { opacity: 0, y: 32, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: D(0.45), ease: "power3.out" });
      gsap.from("[data-stagger]", { opacity: 0, y: 12, duration: D(0.4), stagger: 0.05, delay: 0.12, ease: "power2.out", clearProps: "opacity,transform" });
    },
    { scope: panel },
  );

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, [close]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={label}>
      <div ref={backdrop} className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={close} />
      <div ref={panel} className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-ink/15 bg-paper shadow-[0_30px_80px_-20px_rgb(20_19_18/0.45)]">
        {children(close)}
      </div>
    </div>
  );
}
