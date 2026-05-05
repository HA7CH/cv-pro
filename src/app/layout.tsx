import type { Metadata } from "next";
import { Playfair_Display, Montserrat, Geist, Noto_Serif_SC } from "next/font/google";
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

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["400", "700"],
  preload: false,
});

export const metadata: Metadata = {
  title: "Stop sending different PDFs. Send cv.pro",
  description:
    "One live URL, many tailored views. Send cv.pro/<you>?for=openai or ?role=ml or ?at=2025 — your resume, contextualized per audience, no PDF attachment needed.",
  metadataBase: new URL("https://cv.ha7ch.com"),
  openGraph: {
    title: "Stop sending different PDFs. Send cv.pro",
    description:
      "One live URL, many tailored views. Send cv.pro/<you>?for=openai or ?role=ml or ?at=2025.",
    url: "https://cv.ha7ch.com",
    siteName: "cv-pro",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Stop sending different PDFs. Send cv.pro",
    description:
      "One live URL, many tailored views.",
  },
  keywords: [
    "cv-pro", "AI resume", "living resume", "tailored resume",
    "resume URL", "resume per company", "resume CLI", "resume MCP",
    "AI-native resume", "npx cv-pro",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", playfair.variable, montserrat.variable, notoSerifSC.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full bg-white text-zinc-900 font-sans">
        {children}
      </body>
    </html>
  );
}
