import Link from "next/link";
import { Container } from "./container";
import { PAGE_LINKS, PROJECT_NAME, PROJECT_TAGLINE, SIH_LINE } from "./nav";

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-canvas py-16">
      <Container className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <p className="text-[15px] font-medium text-ink">{PROJECT_NAME}</p>
          <p className="mt-2 text-[14px] text-muted-ink">{PROJECT_TAGLINE}</p>
        </div>
        <nav className="flex flex-col gap-3">
          {PAGE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-[14px] text-muted-ink outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
      <Container className="mt-10 flex flex-col gap-2 border-t border-hairline pt-8">
        <p className="text-[13px] text-muted-ink">{SIH_LINE}</p>
        <p className="text-[13px] text-muted-ink">
          An academic project for Smart India Hackathon 2026. Not affiliated with
          Oil India Limited.
        </p>
      </Container>
    </footer>
  );
}
