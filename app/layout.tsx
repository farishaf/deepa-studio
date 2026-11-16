import type { Metadata } from "next";
import { Bricolage_Grotesque, Gochi_Hand, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
const gochi = Gochi_Hand({ variable: "--font-gochi", weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DEEPA Digital Solutions",
  description:
    "Illuminate ideas. Empower businesses. Partner digital untuk website, aplikasi, desain, dan branding.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${bricolage.variable} ${jetbrains.variable} ${gochi.variable} antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-anim')",
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
