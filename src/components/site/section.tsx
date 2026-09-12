import { cn } from "@/lib/utils";
import { Container } from "./container";

type Surface = "canvas" | "soft" | "cream" | "dark";

// Roles stay fixed; the token values switch with the theme (DESIGN.md §8).
// "dark" uses the green fill with its matching on-green text, never white,
// so it stays readable when green turns light in dark mode.
const SURFACE: Record<Surface, string> = {
  canvas: "bg-cream text-ink",
  soft: "bg-panel text-ink",
  cream: "bg-gold-tint text-ink",
  dark: "bg-green text-on-green",
};

// A major editorial band: 96px vertical rhythm, one surface colour, one container.
export function Section({
  id,
  surface = "canvas",
  className,
  containerClassName,
  children,
}: {
  id?: string;
  surface?: Surface;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-16 py-16 md:py-24", SURFACE[surface], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

// Standard section header: heading plus one optional line of text. The
// title is a section title (DESIGN.md §3.2: h1 scale, serif, green).
export function SectionHeading({
  title,
  lead,
  className,
}: {
  title: string;
  lead?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h2 className="font-serif text-h1 font-medium text-green">{title}</h2>
      {lead ? <p className="mt-4 text-body-lg text-ink-muted">{lead}</p> : null}
    </div>
  );
}
