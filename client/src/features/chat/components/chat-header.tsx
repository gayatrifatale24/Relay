"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, PanelLeftOpen, Search, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils/cn";
import { useModifierKey } from "@/lib/utils/platform";
import { useSidebar } from "./chat-shell";

export function ChatHeader({ title }: { title: string | null }) {
  const { desktopOpen, toggleDesktop, openMobile, openPalette } = useSidebar();
  const modifier = useModifierKey();

  return (
    <header className="flex h-14 shrink-0 items-center gap-1.5 border-b border-line px-2 sm:px-3">
      <Button variant="ghost" size="icon" onClick={openMobile} aria-label="Open conversations" className="lg:hidden">
        <Menu className="size-4" />
      </Button>
      {!desktopOpen && (
        <Button variant="ghost" size="icon" onClick={toggleDesktop} aria-label="Open sidebar" className="max-lg:hidden">
          <PanelLeftOpen className="size-4" />
        </Button>
      )}

      <div className="min-w-0 flex-1 px-1.5">
        {title === null ? (
          <Skeleton className="h-3.5 w-48" />
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.h2
              key={title}
              initial={{ opacity: 0, y: 4, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
              transition={{ duration: 0.2 }}
              className="truncate text-sm font-medium text-ink"
            >
              {title}
            </motion.h2>
          </AnimatePresence>
        )}
      </div>

      <button
        type="button"
        onClick={openPalette}
        className="group hidden h-8 items-center gap-2 rounded-lg border border-line bg-canvas pl-2.5 pr-1.5 text-[13px] text-faint transition-colors hover:border-line-strong hover:text-muted md:inline-flex"
      >
        <Search className="size-3.5" />
        <span className="pr-6">Search…</span>
        <span className="flex gap-0.5">
          <Kbd>{modifier}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <Button variant="ghost" size="icon" onClick={openPalette} aria-label="Search" className="md:hidden">
        <Search className="size-4" />
      </Button>

      <span className="hidden items-center gap-1.5 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-ink lg:inline-flex">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-50 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
        Online
      </span>
      <ThemeToggle />
      <Link
        href="/chat"
        aria-label="New conversation"
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-hover hover:text-ink",
          desktopOpen && "lg:hidden",
        )}
      >
        <SquarePen className="size-4" />
      </Link>
    </header>
  );
}
