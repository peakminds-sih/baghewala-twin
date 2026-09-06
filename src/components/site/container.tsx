import { cn } from "@/lib/utils";

// One container width for every page. 1200px, 48px desktop gutters.
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-6 md:px-12", className)}>
      {children}
    </div>
  );
}
