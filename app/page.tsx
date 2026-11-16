"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

type Handler = (e: Event) => void;
type Safe = (fn: Handler) => Handler;

/* ---------- content ---------- */

const LOOP = "M14,34 C8,10 92,2 116,22 C134,40 92,60 52,58 C16,56 2,38 24,16";

const VALUES = [
  { n: "01", title: "Illuminate", desc: "Menerangi ide dan potensi bisnis. Kami bantu temukan peluang dan ubah ide jadi solusi yang punya arah.", path: "M30,8 C18,8 12,18 14,28 C15,36 22,40 23,46 L37,46 C38,40 45,36 46,28 C48,18 42,8 30,8 M24,52 L36,52" },
  { n: "02", title: "Innovate", desc: "Teknologi, kreativitas, dan strategi digabung jadi solusi yang relevan, efektif, dan berkelanjutan.", path: "M30,4 L30,56 M4,30 L56,30 M12,12 L48,48 M48,12 L12,48" },
  { n: "03", title: "Empower", desc: "Brand makin kuat, operasional makin efisien, bisnis makin siap bersaing dan tumbuh.", path: "M6,52 L22,34 L32,44 L52,14 M38,14 L52,14 L52,28" },
];

const SERVICES = [
  { title: "IT & Development", pic: "Faris", photo: "layar kode + kopi", note: "rapi & cepat", items: ["Website", "Landing Page", "Portfolio", "Blog / Magazine", "Company Profile", "SaaS", "E-Commerce", "Corporate (ERP)"] },
  { title: "Desain & Branding", pic: "Herlina", photo: "sketsa logo di kertas", note: "punya karakter", items: ["Social Media", "Key Visual", "Brand Identity", "Rebranding", "Logo", "Printed", "Packaging", "Stationery"] },
];

const CLIENTS = [
  { title: "UMKM & bisnis lokal", desc: "Coffee shop, resto, butik, salon. Logo, landing page, e-commerce.", photo: "barista di kedai kopi", note: "naik kelas!", path: "M100,30 L100,70 M100,130 L100,170 M30,100 L70,100 M130,100 L170,100 M52,52 L78,78 M148,52 L122,78" },
  { title: "Startup", desc: "Company profile, SaaS, UI/UX, dan brand identity.", photo: "tim kecil diskusi", note: "gas terus", path: "M30,160 L90,100 L120,130 L175,60 M150,60 L175,60 L175,85" },
  { title: "Perusahaan & instansi", desc: "Corporate website, ERP, sistem informasi, rebranding.", photo: "gedung kantor", note: "serius tapi seru", path: "M40,100 C40,40 160,40 160,100 C160,160 40,160 50,90 C58,50 140,50 140,100" },
  { title: "Personal brand", desc: "Kreator, fotografer, konsultan, freelancer. Portfolio & personal branding.", photo: "kreator pegang kamera", note: "ini kamu", path: "M60,150 C40,110 50,60 100,50 C150,40 170,100 140,140 M80,95 L82,100 M120,92 L122,97 M85,125 C95,135 110,135 120,122" },
];

const STEPS = [
  { n: "1.", title: "Dengerin", desc: "Pahami masalah dan kebutuhan bisnis Kakak." },
  { n: "2.", title: "Konsep", desc: "Susun strategi dan arah desain yang pas." },
  { n: "3.", title: "Bikin", desc: "Proses desain dan development, update tiap minggu." },
  { n: "4.", title: "Rilis", desc: "Hasil akhir siap pakai, lengkap dengan pendampingan." },
];

/* ---------- pieces ---------- */

// Hand-drawn stroke. `hover` strokes start hidden and are drawn by their [data-draw] host;
// the rest start drawn (final state) and are animated by the hero intro.
function Doodle({
  d = LOOP,
  viewBox = "0 0 130 64",
  className = "",
  width = 2.5,
  stretch = true,
  hover = true,
}: { d?: string; viewBox?: string; className?: string; width?: number; stretch?: boolean; hover?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox={viewBox}
      preserveAspectRatio={stretch ? "none" : undefined}
      className={`pointer-events-none overflow-visible ${className}`}
    >
      <path
        className={hover ? "doodle-h" : "doodle-intro"}
        data-anim={hover ? undefined : ""}
        pathLength={100}
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="100 200"
        strokeDashoffset={hover ? 100 : 0}
      />
    </svg>
  );
}

const h2 = "m-0 font-extrabold text-[clamp(40px,6vw,84px)] leading-[0.95] tracking-[-0.04em]";
const pad = "px-[clamp(20px,4vw,56px)] py-[clamp(56px,8vw,112px)]";

/* ---------- page ---------- */

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bulb = useRef<HTMLButtonElement>(null);
  const [lit, setLit] = useState(false);

  const { contextSafe } = useGSAP(
    (_ctx, contextSafe) => {
      const el = root.current!;
      const $ = (s: string) => gsap.utils.toArray<HTMLElement>(s, el);
      const listen = (safe: Safe) => {
        const offs: (() => void)[] = [];
        const on = (t: EventTarget, types: string[], fn: Handler) => {
          const f = safe(fn);
          types.forEach((ty) => t.addEventListener(ty, f));
          offs.push(() => types.forEach((ty) => t.removeEventListener(ty, f)));
        };
        return { on, off: () => offs.forEach((o) => o()) };
      };
      const base = listen(contextSafe as Safe);
      const { on } = base;

      /* path length is 100 (not 1): GSAP rounds px, so 1→0 would jump in one frame */
      /* hover doodles: draw strokes + pop notes (kept with reduced motion, it's feedback) */
      $("[data-draw]").forEach((host) => {
        // empty lists skipped so GSAP doesn't warn "target not found"
        const paths = [...host.querySelectorAll(".doodle-h")];
        const pops = [...host.querySelectorAll(".hover-pop")];
        const to = (t: Element[], v: gsap.TweenVars) => t.length && gsap.to(t, { overwrite: true, ...v });
        if (pops.length) gsap.set(pops, { autoAlpha: 0, scale: 0.6 });
        on(host, ["mouseenter", "focusin"], () => {
          to(paths, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" });
          to(pops, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(3)", delay: 0.15 });
        });
        on(host, ["mouseleave", "focusout"], () => {
          to(paths, { strokeDashoffset: 100, duration: 0.3, ease: "power2.in" });
          to(pops, { autoAlpha: 0, scale: 0.6, duration: 0.2 });
        });
      });

      /* doodle canvas: click & drag anywhere, strokes fade after 3.2s */
      const c = canvas.current!;
      const g = c.getContext("2d")!;
      type Stroke = { pts: [number, number][]; t: number; color: string };
      let strokes: Stroke[] = [];
      let cur: Stroke | null = null;
      const resize = () => {
        const d = devicePixelRatio || 1;
        c.width = innerWidth * d;
        c.height = innerHeight * d;
        g.setTransform(d, 0, 0, d, 0, 0);
      };
      resize();
      on(window, ["resize"], resize);
      on(window, ["pointerdown"], (ev) => {
        const e = ev as PointerEvent;
        const t = e.target as Element;
        // ponytail: mouse/pen only, touch would draw while scrolling
        if (e.button !== 0 || e.pointerType === "touch" || t.closest("a,button")) return;
        cur = { pts: [[e.clientX, e.clientY]], t: performance.now(), color: t.closest("[data-ink]")?.getAttribute("data-ink") ?? "#141312" };
        strokes.push(cur);
      });
      on(window, ["pointermove"], (ev) => {
        const e = ev as PointerEvent;
        if (cur) {
          cur.pts.push([e.clientX, e.clientY]);
          cur.t = performance.now();
        }
      });
      on(window, ["pointerup", "pointercancel"], () => (cur = null));
      let dirty = false;
      const paint = () => {
        if (!strokes.length && !dirty) return;
        const now = performance.now();
        g.clearRect(0, 0, innerWidth, innerHeight);
        strokes = strokes.filter((s) => now - s.t < 3200);
        dirty = strokes.length > 0;
        g.lineWidth = 3.5;
        g.lineCap = g.lineJoin = "round";
        for (const s of strokes) {
          g.globalAlpha = Math.max(0, Math.min(1, (3200 - (now - s.t)) / 800));
          g.strokeStyle = s.color;
          const p = s.pts;
          g.beginPath();
          g.moveTo(p[0][0], p[0][1]);
          for (let i = 1; i < p.length - 1; i++) g.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + p[i + 1][0]) / 2, (p[i][1] + p[i + 1][1]) / 2);
          if (p.length > 1) g.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
          g.stroke();
        }
        g.globalAlpha = 1;
      };
      gsap.ticker.add(paint);

      /* wiggle: [data-wiggle] host shakes its .wiggle children around their base rotation */
      $("[data-wiggle]").forEach((host) => {
        const ws = host.querySelectorAll<HTMLElement>(".wiggle");
        on(host, ["mouseenter"], () =>
          ws.forEach((w) => {
            const r = Number(w.dataset.rot ?? 0);
            gsap.to(w, { keyframes: { rotation: [r, r - 10, r + 8, r - 4, r] }, duration: 0.6, ease: "power1.inOut", overwrite: true });
          }),
        );
      });

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // CSS hides [data-anim] until now; each from() below re-hides its targets in the same tick
        gsap.set("[data-anim]", { visibility: "visible" });

        /* hero intro */
        gsap
          .timeline({ defaults: { ease: "power3.out" }, delay: 0.1 })
          .from(".hero-note", { opacity: 0, x: -24, rotation: -14, duration: 0.6 })
          .from(".hero-line", { opacity: 0, yPercent: 60, rotation: 2, stagger: 0.12, duration: 0.8 }, "<0.1")
          .from(".hero-hl", { scaleX: 0, duration: 0.7, ease: "power2.inOut" }, "-=0.3")
          .from("header .doodle-intro", { strokeDashoffset: 100, duration: 0.9, stagger: 0.25, ease: "power2.inOut" }, "<0.2")
          .fromTo(".hero-photo", { clipPath: "inset(100% 0% 0% 0% round 20px)" }, { clipPath: "inset(0% 0% 0% 0% round 20px)", duration: 1, ease: "expo.out", clearProps: "clipPath" }, 0.3)
          .from(".hero-sub", { opacity: 0, y: 24, stagger: 0.1, duration: 0.6 }, 0.6)
          .from(bulb.current, { scale: 0, rotation: -40, duration: 0.8, ease: "back.out(2)" }, 1.1)
          .from(".hero-label", { opacity: 0, scale: 0.6, stagger: 0.25, duration: 0.4, ease: "back.out(3)" }, 1.4);

        // bulb card bobs gently over the photo
        gsap.to(".bulb-float", { y: -10, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });

        // photo stripes drift with scroll
        gsap.to(".hero-photo", { backgroundPositionY: 160, ease: "none", scrollTrigger: { trigger: "header", start: "top top", end: "bottom top", scrub: true } });

        /* scroll progress bar */
        gsap.to(".progress", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

        /* section headings: words rise in */
        $("[data-split]").forEach((h) =>
          SplitText.create(h, {
            type: "words",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.words, {
                opacity: 0,
                yPercent: 70,
                rotation: 6,
                stagger: 0.07,
                duration: 0.8,
                ease: "power4.out",
                scrollTrigger: { trigger: h, start: "top 85%" },
              }),
          }),
        );

        /* cards & blocks: batch reveal */
        gsap.set("[data-reveal]", { autoAlpha: 0, y: 48 });
        ScrollTrigger.batch("[data-reveal]", {
          start: "top 90%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.8, ease: "power3.out", overwrite: true }),
        });

        /* process steps: line draws, number stamps in */
        $(".step").forEach((s, i) =>
          gsap
            .timeline({ scrollTrigger: { trigger: s, start: "top 88%" } })
            .from(s.querySelector(".step-line"), { scaleX: 0, duration: 0.7, ease: "power2.inOut" }, i * 0.12)
            .from(s.querySelector(".step-n"), { scale: 0, rotation: -60, duration: 0.6, ease: "back.out(3)" }, "-=0.35")
            .from(s.querySelectorAll(".step-txt"), { opacity: 0, y: 20, stagger: 0.08, duration: 0.5 }, "-=0.35"),
        );

        /* "redup?" flickers like a dim bulb */
        gsap.to(".flicker", { keyframes: { opacity: [1, 0.35, 1, 0.6, 1, 0.2, 1] }, duration: 0.9, repeat: -1, repeatDelay: 2.4, ease: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", (_c, safe) => {
        const local = listen(safe as unknown as Safe);

        /* magnetic buttons */
        $("[data-magnet]").forEach((m) => {
          const xTo = gsap.quickTo(m, "x", { duration: 0.5, ease: "power3" });
          const yTo = gsap.quickTo(m, "y", { duration: 0.5, ease: "power3" });
          local.on(m, ["pointermove"], (ev) => {
            const e = ev as PointerEvent;
            const r = m.getBoundingClientRect();
            const cx = r.left - Number(gsap.getProperty(m, "x")) + r.width / 2;
            const cy = r.top - Number(gsap.getProperty(m, "y")) + r.height / 2;
            xTo((e.clientX - cx) * 0.3);
            yTo((e.clientY - cy) * 0.35);
          });
          local.on(m, ["pointerleave"], () => (xTo(0), yTo(0)));
        });

        /* 3D tilt toward the pointer */
        $("[data-tilt]").forEach((card) => {
          gsap.set(card, { transformPerspective: 900 });
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });
          local.on(card, ["pointermove"], (ev) => {
            const e = ev as PointerEvent;
            const r = card.getBoundingClientRect();
            ry(((e.clientX - r.left) / r.width - 0.5) * 12);
            rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
          });
          local.on(card, ["pointerleave"], () => (rx(0), ry(0)));
        });

        /* cursor follower that swells over interactive things */
        const dot = el.querySelector<HTMLElement>(".cursor")!;
        gsap.set(dot, { xPercent: -50, yPercent: -50 });
        const dx = gsap.quickTo(dot, "x", { duration: 0.35, ease: "power3" });
        const dy = gsap.quickTo(dot, "y", { duration: 0.35, ease: "power3" });
        local.on(window, ["pointermove"], (ev) => {
          const e = ev as PointerEvent;
          gsap.to(dot, { autoAlpha: 1, duration: 0.2, overwrite: "auto" });
          dx(e.clientX);
          dy(e.clientY);
        });
        local.on(window, ["pointerover"], (ev) => {
          const hot = (ev.target as Element).closest("a,button,[data-draw]");
          gsap.to(dot, { scale: hot ? 2.6 : 1, duration: 0.3, ease: "power3.out" });
        });
        local.on(document.documentElement, ["pointerleave"], () => gsap.to(dot, { autoAlpha: 0, duration: 0.2 }));

        return local.off;
      });

      return () => {
        base.off();
        gsap.ticker.remove(paint);
      };
    },
    { scope: root },
  );

  // contextSafe runs at click time (not render) so the click tweens join the useGSAP context
  const toggleBulb = () =>
    contextSafe(() => {
      const next = !lit;
      setLit(next);
      const b = bulb.current!;
      gsap
        .timeline()
        .to(b, { scale: 0.88, duration: 0.08, ease: "power2.in" })
        .to(b, { scale: 1, duration: 0.7, ease: "elastic.out(1.2,0.35)" });
      gsap.to(b.querySelector(".rays"), { strokeDashoffset: next ? 0 : 100, duration: next ? 0.45 : 0.25, ease: "power2.out" });
      gsap.fromTo(b.querySelector(".glass"), { scale: 1 }, { scale: next ? 1.12 : 0.94, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: "50% 60%" });
    })();

  return (
    <div ref={root} data-ink="#141312" className="relative min-h-screen overflow-x-clip bg-paper text-ink">
      <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-50 h-screen w-screen" />
      <div aria-hidden className="cursor pointer-events-none fixed left-0 top-0 z-[60] size-3.5 rounded-full border-2 border-ink bg-sun opacity-0" />
      <div aria-hidden className="progress fixed left-0 top-0 z-[55] h-1 w-full origin-left scale-x-0 bg-sun" />

      {/* nav */}
      <nav className="flex flex-wrap items-center justify-between gap-6 px-[clamp(20px,4vw,56px)] py-6">
        <a href="#" className="flex items-center gap-2.5 text-[28px] font-extrabold tracking-[-0.03em]" data-wiggle>
          <span className="wiggle size-[22px] rounded-full border-[2.5px] border-ink bg-sun" />
          DEEPA
        </a>
        <div className="flex flex-wrap items-center gap-7 font-mono text-sm">
          <a href="#layanan">layanan</a>
          <a href="#nilai">tentang</a>
          <a href="#klien">klien</a>
          <a href="#konsul" data-draw data-magnet className="relative inline-block px-[18px] py-2.5">
            konsul gratis
            <Doodle className="absolute -inset-x-2.5 -inset-y-1.5 h-[calc(100%+12px)] w-[calc(100%+20px)] text-ink" />
          </a>
        </div>
      </nav>

      {/* hero */}
      <header className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(32px,5vw,72px)] px-[clamp(20px,4vw,56px)] pb-20 pt-[clamp(32px,6vw,72px)]">
        <div className="flex flex-col gap-[30px]">
          <div data-anim className="hero-note origin-left self-start font-hand text-[26px]" style={{ transform: "rotate(-3deg)" }}>
            deepa = cahaya, pelita ✎
          </div>
          <h1 className="m-0 text-balance text-[clamp(52px,7.4vw,112px)] font-extrabold leading-[0.92] tracking-[-0.045em]">
            <span data-anim className="hero-line block">
              <span className="relative z-0 inline-block">
                Illuminate
                <span data-anim className="hero-hl absolute -left-[2%] -right-[2%] top-[52%] -z-10 h-[42%] origin-left bg-sun" />
              </span>{" "}
              ideas.
            </span>
            <span data-anim className="hero-line block">
              Empower{" "}
              <span className="relative inline-block">
                businesses.
                <Doodle hover={false} viewBox="0 0 200 16" width={5} d="M4,10 C40,3 80,14 120,6 C142,2 172,11 196,5" className="absolute -bottom-3 left-0 h-[18px] w-full" />
              </span>
            </span>
          </h1>
          <p data-anim className="hero-sub m-0 max-w-[44ch] text-pretty text-xl leading-normal">
            Partner digital yang nyatuin teknologi dan kreativitas. Website, aplikasi, dan branding yang bikin bisnis Kakak gampang diingat.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a data-anim data-magnet href="#konsul" className="hero-sub rounded-full bg-ink px-[30px] py-[18px] text-lg font-extrabold text-paper">
              Konsultasi gratis
            </a>
            <a data-anim data-magnet href="#layanan" className="hero-sub rounded-full border-2 border-ink px-7 py-4 text-lg font-medium">
              Lihat layanan
            </a>
          </div>
        </div>

        <div className="relative aspect-[4/5] max-h-[680px] w-full">
          <div data-anim className="hero-photo stripes absolute inset-0 flex items-end rounded-[20px] p-5">
            <span className="font-mono text-[13px] text-faint">[ photo: Faris &amp; Herlina di meja kerja, b&amp;w ]</span>
          </div>
          <Doodle hover={false} width={3} className="absolute left-[12%] top-[18%] h-[16%] w-[34%] text-white" />
          <div data-anim className="hero-label absolute left-[10%] top-[6%] font-hand text-[22px] text-white" style={{ transform: "rotate(-5deg)" }}>
            Faris — ngoding
          </div>
          <Doodle hover={false} width={3} className="absolute right-[10%] top-[30%] h-[16%] w-[34%] text-white" />
          <div data-anim className="hero-label absolute right-[8%] top-[47%] font-hand text-[22px] text-white" style={{ transform: "rotate(4deg)" }}>
            Herlina — ngedesain
          </div>

          <div className="bulb-float absolute -bottom-[6%] -left-[6%]">
            <button
              ref={bulb}
              data-anim
              data-wiggle
              onClick={toggleBulb}
              title="nyalain idenya"
              aria-pressed={lit}
              className={`flex h-[170px] w-[150px] cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl border-[2.5px] border-ink p-0 shadow-[6px_6px_0_#141312] transition-colors duration-300 ${lit ? "bg-sky" : "bg-paper"}`}
              style={{ transform: "rotate(-6deg)" }}
            >
              <svg aria-hidden viewBox="0 0 80 100" className="wiggle h-24 w-[76px] origin-top overflow-visible">
                <path
                  className={`glass transition-[fill] duration-300 ${lit ? "fill-sun" : "fill-paper"}`}
                  d="M40,10 C20,10 12,26 14,40 C16,52 26,58 28,70 L52,70 C54,58 64,52 66,40 C68,26 60,10 40,10 Z"
                  stroke="#141312"
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
                <path d="M30,78 L50,78 M32,86 L48,86 M36,94 L44,94" fill="none" stroke="#141312" strokeWidth={3} strokeLinecap="round" />
                <path className="rays" pathLength={100} d="M40,-6 L40,-16 M8,8 L0,0 M72,8 L80,0 M-2,40 L-12,40 M82,40 L92,40" fill="none" stroke="#141312" strokeWidth={3} strokeLinecap="round" strokeDasharray="100 200" strokeDashoffset={100} />
              </svg>
              <span className="font-hand text-lg text-ink">{lit ? "ide: ON" : "klik aku"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* values */}
      <section id="nilai" data-ink="#141312" className={`flex flex-col gap-12 bg-sun ${pad}`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 data-anim data-split className={`${h2} max-w-[13ch]`}>Tiga hal yang kami pegang.</h2>
          <div className="font-hand text-2xl" style={{ transform: "rotate(-3deg)" }}>nama kami, artinya juga ini ↓</div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
          {VALUES.map((v) => (
            <div key={v.n} data-reveal data-draw data-tilt className="flex flex-col gap-[18px] rounded-[20px] border-[2.5px] border-ink bg-paper p-7 shadow-[6px_6px_0_#141312] transition-shadow duration-300 hover:shadow-[12px_12px_0_#141312]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm">{v.n}</span>
                <Doodle d={v.path} viewBox="0 0 60 60" width={3} stretch={false} className="size-14 text-ink" />
              </div>
              <div className="text-4xl font-extrabold tracking-[-0.03em]">{v.title}</div>
              <div className="text-[17px] leading-normal">{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* services */}
      <section id="layanan" data-ink="#f6f3ec" className={`flex flex-col gap-12 bg-ink text-paper ${pad}`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 data-anim data-split className={h2}>Layanan</h2>
          <div className="font-hand text-[22px] text-sun" style={{ transform: "rotate(-2deg)" }}>(hover salah satu)</div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-6">
          {SERVICES.map((s) => (
            <div key={s.title} data-reveal data-wiggle className="flex flex-col gap-6">
              <div className="stripes-alt relative flex aspect-video items-end rounded-[20px] p-5">
                <span className="font-mono text-xs text-faint">[ photo: {s.photo} ]</span>
                <div className="wiggle absolute right-5 top-[18px] font-hand text-2xl text-white" data-rot="5" style={{ transform: "rotate(5deg)" }}>
                  {s.note}
                </div>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="text-[32px] font-extrabold tracking-[-0.02em]">{s.title}</div>
                <div className="font-mono text-[13px] text-muted">PIC {s.pic}</div>
              </div>
              <div className="flex flex-wrap gap-x-[18px] gap-y-3">
                {s.items.map((it) => (
                  <span key={it} data-draw className="relative cursor-default px-3.5 py-2 text-lg">
                    {it}
                    <Doodle className="absolute -inset-x-1.5 -inset-y-1 h-[calc(100%+8px)] w-[calc(100%+12px)] text-sun" />
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* clients */}
      <section id="klien" data-ink="#141312" className={`flex flex-col gap-12 ${pad}`}>
        <h2 data-anim data-split className={`${h2} max-w-[14ch]`}>Buat siapa aja?</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,250px),1fr))] gap-5">
          {CLIENTS.map((c) => (
            <div key={c.title} data-reveal data-draw className="flex cursor-default flex-col gap-4">
              <div data-tilt className="stripes relative flex aspect-square items-end rounded-2xl p-4">
                <span className="font-mono text-xs text-faint">[ photo: {c.photo} ]</span>
                <Doodle d={c.path} viewBox="0 0 200 200" width={4} stretch={false} className="absolute inset-[10%] h-4/5 w-4/5 text-white" />
                <div className="hover-pop absolute left-4 top-4 font-hand text-[22px] text-white" style={{ transform: "rotate(-4deg)" }}>
                  {c.note}
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-[-0.02em]">{c.title}</div>
              <div className="-mt-2 text-base leading-normal">{c.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* process */}
      <section data-ink="#141312" className={`flex flex-col gap-12 bg-sky ${pad}`}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 data-anim data-split className={h2}>Cara kami kerja</h2>
          <div className="font-hand text-2xl" style={{ transform: "rotate(-3deg)" }}>simpel, transparan, tepat waktu</div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-7">
          {STEPS.map((s) => (
            <div key={s.n} className="step relative flex flex-col gap-3 pt-5">
              <div data-anim className="step-line absolute inset-x-0 top-0 h-[2.5px] origin-left bg-ink" />
              <span data-anim className="step-n inline-block self-start font-hand text-[40px] leading-none">{s.n}</span>
              <div data-anim className="step-txt text-[26px] font-extrabold tracking-[-0.02em]">{s.title}</div>
              <div data-anim className="step-txt text-[17px] leading-normal">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* cta */}
      <section id="konsul" data-ink="#141312" className="flex flex-col items-center gap-8 bg-sun px-[clamp(20px,4vw,56px)] py-[clamp(72px,10vw,140px)] text-center">
        <div className="font-hand text-[28px]" style={{ transform: "rotate(-3deg)" }}>
          punya ide yang masih <span className="flicker inline-block">redup?</span>
        </div>
        <h2 data-anim data-split className="m-0 max-w-[12ch] text-[clamp(48px,8vw,120px)] font-extrabold leading-[0.9] tracking-[-0.045em]">
          Yuk, kita nyalain bareng.
        </h2>
        <p className="m-0 max-w-[42ch] text-xl leading-normal">
          Konsultasi pertama gratis. Butuh strategi lebih matang? Ada sesi konsultasi berbayar juga.
        </p>
        <a href="mailto:halo@deepa.id" data-draw data-magnet className="relative inline-block px-10 py-5 text-2xl font-extrabold">
          halo@deepa.id
          <Doodle width={3} className="absolute -inset-x-3.5 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+28px)] text-ink" />
        </a>
        <div className="font-mono text-[13px]">[ klik &amp; drag buat corat-coret di mana aja ]</div>
      </section>

      <footer data-ink="#f6f3ec" className="flex flex-wrap justify-between gap-4 bg-ink px-[clamp(20px,4vw,56px)] py-7 font-mono text-[13px] text-muted">
        <span>© 2026 DEEPA Digital Solutions</span>
        <span>Instagram · TikTok · LinkedIn · Behance</span>
      </footer>
    </div>
  );
}
