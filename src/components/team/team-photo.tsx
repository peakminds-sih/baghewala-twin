import type { TeamMember } from "@/lib/data/team";
import { cn } from "@/lib/utils";

// Initials-fallback colours, all drawn from the DESIGN.md signature palette.
const FALLBACK: Record<number, string> = {
  1: "bg-signature-forest text-white",
  2: "bg-signature-coral text-white",
  3: "bg-link text-white",
  4: "bg-signature-mustard text-ink",
  5: "bg-signature-mint text-ink",
  6: "bg-signature-peach text-ink",
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// `available` is resolved on the server from the file in /public/team.
// When the photo is missing we show initials, never a broken image icon.
export function TeamPhoto({
  member,
  available,
  className,
  shape = "square",
}: {
  member: TeamMember;
  available: boolean;
  className?: string;
  shape?: "square" | "round";
}) {
  const radius = shape === "round" ? "rounded-full" : "rounded-md";

  if (available) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={member.photo}
        alt={`${member.name}, ${member.role}`}
        className={cn("object-cover", radius, className)}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`${member.name}, ${member.role}`}
      className={cn(
        "flex items-center justify-center font-medium",
        radius,
        FALLBACK[member.id] ?? "bg-surface-strong text-ink",
        className
      )}
    >
      {initials(member.name)}
    </div>
  );
}
