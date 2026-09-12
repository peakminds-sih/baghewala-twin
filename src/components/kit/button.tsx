import { cn } from "@/lib/utils";

// Buttons (DESIGN.md §5.1). One primary per view. Hover styles apply only on
// devices that can hover (Tailwind's hover variant checks this).

type Variant = "primary" | "secondary" | "quiet";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "h-9 bg-green px-4 text-on-green hover:bg-green-hover",
  secondary: "h-9 border border-hairline-strong bg-cream px-4 text-ink hover:border-ink-muted",
  quiet: "px-0 text-green underline-offset-4 hover:underline",
};

export function Button({
  variant = "secondary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[4px] text-ui font-medium",
        "transition-[background-color,border-color,color,scale] duration-100 ease-out active:scale-[0.98]",
        "disabled:pointer-events-none disabled:bg-transparent disabled:text-ink-faint",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
