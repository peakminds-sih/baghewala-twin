"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "./container";
import { ButtonLink } from "./button-link";
import { NAV_LINKS, PROJECT_NAME } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Hairline border appears only after 8px of scroll.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the page behind the mobile panel.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 bg-cream",
        scrolled && "border-b border-hairline"
      )}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="rounded-sm text-ui font-medium text-ink">
          {PROJECT_NAME}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-sm text-ui text-ink">
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <ButtonLink href="/documents" className="px-4 py-2.5 text-ui">
            Read the documents
          </ButtonLink>
        </nav>

        <ThemeToggle className="ml-auto mr-2 md:hidden" />
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="rounded-sm p-1 text-ink md:hidden"
        >
          <Menu className="size-6" />
        </button>
      </Container>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-cream md:hidden">
          <Container className="flex h-16 items-center justify-between">
            <span className="text-ui font-medium text-ink">{PROJECT_NAME}</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="rounded-sm p-1 text-ink"
            >
              <X className="size-6" />
            </button>
          </Container>
          <Container className="flex flex-1 flex-col gap-6 pt-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-sm text-lg text-ink"
              >
                {link.label}
              </Link>
            ))}
            <ButtonLink
              href="/documents"
              className="mt-2 w-full"
              onClick={() => setMenuOpen(false)}
            >
              Read the documents
            </ButtonLink>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
