import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// The Airtable button pair from DESIGN.md. Default and pressed states only.
const buttonLink = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-medium leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white active:bg-[#0d1218]",
        secondary:
          "border border-hairline bg-canvas text-ink active:bg-surface-soft",
      },
    },
    defaultVariants: { variant: "primary" },
  }
);

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  download?: boolean | string;
  newTab?: boolean;
  onClick?: () => void;
} & VariantProps<typeof buttonLink>;

export function ButtonLink({
  href,
  variant,
  className,
  children,
  download,
  newTab,
  onClick,
}: Props) {
  const classes = cn(buttonLink({ variant }), className);
  const external = newTab || download != null;

  // Hash links and downloads use a plain anchor; routes use next/link.
  if (href.startsWith("#") || external) {
    return (
      <a
        href={href}
        className={classes}
        download={download}
        onClick={onClick}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
    </Link>
  );
}
