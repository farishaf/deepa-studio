import type { Metadata } from "next";

// Internal tool: not linked from the landing page and kept out of search engines.
export const metadata: Metadata = {
  title: "DEEPA Studio — Internal",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
