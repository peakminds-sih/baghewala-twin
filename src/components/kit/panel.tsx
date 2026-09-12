import { cn } from "@/lib/utils";

// A panel (DESIGN.md §5.8). Do not nest panels; group inside with space and
// small headings.
export function Panel({
  title,
  actions,
  id,
  className,
  children,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("rounded-lg border border-hairline bg-panel p-4 sm:p-6", className)}>
      {title || actions ? (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          {title ? <h2 className="font-serif text-h4 font-medium text-green sm:text-h3">{title}</h2> : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Callout({
  tone = "note",
  title,
  className,
  children,
}: {
  tone?: "note" | "warning";
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-r-[4px] border-l-2 px-4 py-3 text-ui text-ink",
        tone === "note" ? "border-green bg-green-tint" : "border-gold bg-gold-tint",
        className,
      )}
    >
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}
