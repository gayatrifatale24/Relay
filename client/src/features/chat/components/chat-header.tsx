"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, PanelLeftOpen, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import { useSidebar } from "./chat-shell";

export function ChatHeader({ title }: { title: string | null }) {
  const { desktopOpen, toggleDesktop, openMobile } = useSidebar();

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
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.16 }}
              className="truncate text-sm font-medium text-ink"
            >
              {title}
            </motion.h2>
          </AnimatePresence>
        )}
      </div>

      <span className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted sm:inline-flex">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-40 motion-reduce:hidden" />
          <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
        </span>
        AI assistant
      </span>
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
