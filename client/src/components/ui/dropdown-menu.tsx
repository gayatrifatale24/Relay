"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
}

interface DropdownMenuProps {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => React.ReactNode;
  items: MenuItem[];
  header?: React.ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
}

/** Small accessible menu: Escape and outside click close it, arrow keys move focus. */
export function DropdownMenu({ trigger, items, header, align = "start", side = "bottom", className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      rootRef.current?.querySelector<HTMLElement>("[aria-haspopup]")?.focus();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? index + 1 : index - 1;
    nodes[(next + nodes.length) % nodes.length]?.focus();
  };

  return (
    <div ref={rootRef} className={cn("relative", className)} onKeyDown={onKeyDown}>
      {trigger({ open, toggle: () => setOpen((value) => !value), id })}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={id}
            role="menu"
            initial={{ opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: side === "top" ? 4 : -4 }}
            transition={{ duration: 0.14, ease: [0.2, 0, 0, 1] }}
            className={cn(
              "absolute z-50 min-w-52 rounded-lg border border-line bg-surface p-1 shadow-pop",
              side === "top" ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5 origin-top",
              align === "end" ? "right-0" : "left-0",
            )}
          >
            {header && <div className="border-b border-line px-2.5 pb-2 pt-1.5 mb-1">{header}</div>}
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors",
                  "focus-visible:bg-hover hover:bg-hover",
                  item.tone === "danger" ? "text-danger" : "text-ink",
                )}
              >
                {item.icon && <span className="text-faint [&>svg]:size-4">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
