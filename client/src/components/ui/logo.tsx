import { cn } from "@/lib/utils/cn";

/** Relay mark: two offset speech arcs forming a hand-off. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex size-7 items-center justify-center rounded-md bg-accent text-accent-fg", className)}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none">
        <path d="M5 13.5V9a4 4 0 0 1 4-4h6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M19 10.5V15a4 4 0 0 1-4 4H9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Relay</span>
    </span>
  );
}
