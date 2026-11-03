import { cn } from "@/lib/utils/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-line bg-surface px-1 font-sans text-[11px] font-medium text-faint shadow-[0_1px_0_var(--line)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
