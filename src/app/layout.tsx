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
  title: "ai-cv — AI-native living resume",
  description:
    "Claim a handle, run one command, and your resume is live at ai-cv.ha7ch.com/{handle}. Drop a PDF or describe changes — any AI agent updates it instantly via CLI or MCP.",
  metadataBase: new URL("https://ai-cv.ha7ch.com"),
  openGraph: {
    title: "ai-cv — AI-native living resume",
    description:
      "Claim a handle, run one command, and your resume is live at ai-cv.ha7ch.com/{handle}. Drop a PDF or describe changes — any AI agent updates it instantly via CLI or MCP.",
    url: "https://ai-cv.ha7ch.com",
    siteName: "ai-cv",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ai-cv — AI-native living resume",
    description:
      "Claim a handle, run one command, and your resume is live at ai-cv.ha7ch.com/{handle}.",
  },
  keywords: [
    "ai-cv", "AI resume", "living resume", "Claude Code resume",
    "resume CLI", "resume MCP", "AI-native resume", "npx ai-cv",
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
