import type { Metadata } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { MotionProvider } from "@/components/site/motion-provider";
import { THEME_SCRIPT } from "@/components/site/theme-script";

// DESIGN.md §3.1: Source Serif 4 for headings and equations, Inter for the
// interface and numbers, Geist Mono for code.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-source-serif",
});
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

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
      suppressHydrationWarning
      className={cn("h-full antialiased", inter.variable, sourceSerif.variable, geistMono.variable)}
    >
      <head>
        {/* Sets the theme before first paint. The class it adds is why
            <html> needs suppressHydrationWarning. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col bg-cream text-ink">
        <MotionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </MotionProvider>
      </body>
    </html>
  );
}
