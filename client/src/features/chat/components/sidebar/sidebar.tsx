"use client";

import { useState } from "react";
import Link from "next/link";
import { PanelLeftClose, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ConversationList } from "./conversation-list";
import { UserMenu } from "./user-menu";

interface SidebarProps {
  onClose: () => void;
  /** Called after the user picks a destination (used to close the mobile drawer). */
  onNavigate?: () => void;
}

export function Sidebar({ onClose, onNavigate }: SidebarProps) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between px-3">
        <Link href="/chat" onClick={onNavigate} className="rounded-md px-1" aria-label="Relay, new conversation">
          <Logo />
        </Link>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close sidebar">
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="space-y-2 px-3">
        <Link
          href="/chat"
          onClick={onNavigate}
          className="group flex h-9 items-center gap-2 rounded-lg bg-accent px-3 text-sm font-medium text-accent-fg shadow-[0_4px_14px_-6px_var(--accent)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-accent-hover hover:shadow-[0_6px_18px_-6px_var(--accent)] active:scale-[0.98]"
        >
          <Plus className="size-4 transition-transform duration-300 group-hover:rotate-90" />
          New conversation
        </Link>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <label htmlFor="conversation-search" className="sr-only">
            Search conversations
          </label>
          <input
            id="conversation-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === "Escape" && setQuery("")}
            placeholder="Search"
            autoComplete="off"
            className="h-8 w-full rounded-md border border-transparent bg-hover/60 pl-8 pr-8 text-[13px] text-ink outline-none transition-colors placeholder:text-faint focus:border-line-strong focus:bg-surface [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 inline-flex size-5 -translate-y-1/2 items-center justify-center rounded text-faint hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      <nav className="scroll-thin mt-3 min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label="Conversation history">
        <ConversationList query={query} onNavigate={onNavigate} />
      </nav>

      <div className="shrink-0 border-t border-line p-2">
        <UserMenu />
      </div>
    </div>
  );
}
