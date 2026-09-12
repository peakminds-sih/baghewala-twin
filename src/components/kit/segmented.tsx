"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { SPRING_UI } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Segmented control (DESIGN.md §5.5): one choice from a few. It behaves as a
// radio group: arrow keys move the choice. The active fill slides to the new
// segment so the eye follows the change (spatial consistency).
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const id = useId();

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex max-w-full rounded-[4px] border border-hairline-strong bg-cream p-0.5", className)}
    >
      {options.map((option, index) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="relative h-8 flex-auto whitespace-nowrap rounded-[3px] px-3 text-ui font-medium"
          >
            {active ? (
              <motion.span
                layoutId={`${id}-active`}
                transition={SPRING_UI}
                className="absolute inset-0 rounded-[3px] bg-green"
                aria-hidden="true"
              />
            ) : null}
            <span className={cn("relative transition-colors duration-150 ease-out", active ? "text-on-green" : "text-ink")}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
