import type { Metadata } from "next";
import { Playfair_Display, Montserrat, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "cv — turn your PDF resume into a living personal site",
  description:
    "Install the cv plugin in Claude Code or Codex, drop in your PDF, and your resume page updates instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", playfair.variable, montserrat.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full bg-white text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}
