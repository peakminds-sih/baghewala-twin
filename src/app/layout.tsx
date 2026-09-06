import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

// DESIGN.md runs on Haas Grotesk / Inter Display; Inter is the documented
// open-source substitute for the editorial system.
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Baghewala Digital Twin — SIH26120",
    template: "%s — Baghewala Digital Twin",
  },
  description:
    "A well-to-surface digital twin for heavy-oil production at Baghewala. It predicts reservoir temperature and gives both the pump speed and the next steam cycle from one prediction.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full antialiased font-sans", inter.variable, geistMono.variable)}
    >
      <body className="flex min-h-full flex-col bg-canvas">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
