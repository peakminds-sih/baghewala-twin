import { cn } from "@/lib/utils";
import { Container } from "./container";

type Surface = "canvas" | "soft" | "cream" | "dark";

const SURFACE: Record<Surface, string> = {
  canvas: "bg-canvas text-body-text",
  soft: "bg-surface-soft text-body-text",
  cream: "bg-signature-cream text-ink",
  dark: "bg-surface-dark text-white",
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

// Standard section header: heading plus one optional line of text.
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
      <h2 className="text-[28px] leading-tight font-normal text-ink md:text-[32px]">
        {title}
      </h2>
      {lead ? <p className="mt-4 text-[15px] text-body-text">{lead}</p> : null}
    </div>
  );
}
