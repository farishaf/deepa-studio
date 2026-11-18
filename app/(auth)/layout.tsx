import type { Metadata } from "next";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="m-0 font-mono text-xs text-faint">DEEPA · INTERNAL</p>
        <h1 className="m-0 mb-6 text-5xl font-extrabold tracking-[-0.04em]">Studio</h1>
        <div className="rounded-3xl border border-ink/15 bg-white p-6 shadow-[0_20px_50px_-25px_rgb(20_19_18/0.35)]">{children}</div>
      </div>
    </main>
  );
}
