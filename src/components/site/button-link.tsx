import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// The two link-buttons from DESIGN.md §5.1. Default and pressed states only.
const buttonLink = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-4 text-base font-medium leading-none transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-green text-on-green hover:bg-green-hover active:bg-green-hover",
        secondary:
          "border border-hairline-strong bg-cream text-ink active:bg-panel",
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
