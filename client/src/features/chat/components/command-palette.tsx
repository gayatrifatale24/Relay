"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, LogOut, MessageSquare, Monitor, Moon, PanelLeft, Plus, Search, Sun } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { useTheme } from "@/lib/theme/theme";
import { cn } from "@/lib/utils/cn";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useConversations } from "../hooks/use-conversations";
import { formatRelative } from "../utils/date";

interface Command {
  id: string;
  group: "Actions" | "Conversations";
  label: string;
  icon: React.ReactNode;
  hint?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onToggleSidebar: () => void;
}

/** Ctrl/⌘ + K palette: jump to a conversation or run an action without leaving the keyboard. */
export function CommandPalette({ open, onClose, onToggleSidebar }: CommandPaletteProps) {
  return (
    <AnimatePresence>
      {open && <PaletteDialog onClose={onClose} onToggleSidebar={onToggleSidebar} />}
    </AnimatePresence>
  );
}

function PaletteDialog({ onClose, onToggleSidebar }: Omit<CommandPaletteProps, "open">) {
  const router = useRouter();
  const logout = useLogout();
  const { data: conversations = [] } = useConversations();
  const { resolved, setPreference } = useTheme();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const close = (action: () => void) => () => {
      onClose();
      action();
    };
    const actions: Command[] = [
      { id: "new", group: "Actions", label: "New conversation", icon: <Plus />, run: close(() => router.push("/chat")) },
      {
        id: "theme",
        group: "Actions",
        label: resolved === "dark" ? "Switch to light theme" : "Switch to dark theme",
        icon: resolved === "dark" ? <Sun /> : <Moon />,
        run: close(() =>
          setPreference(resolved === "dark" ? "light" : "dark", { x: window.innerWidth / 2, y: window.innerHeight / 3 }),
        ),
      },
      { id: "system", group: "Actions", label: "Use system theme", icon: <Monitor />, run: close(() => setPreference("system")) },
      { id: "sidebar", group: "Actions", label: "Toggle sidebar", icon: <PanelLeft />, run: close(onToggleSidebar) },
      { id: "logout", group: "Actions", label: "Sign out", icon: <LogOut />, run: close(() => logout.mutate()) },
    ];
    const chats: Command[] = conversations.map((conversation) => ({
      id: conversation.id,
      group: "Conversations",
      label: conversation.title,
      icon: <MessageSquare />,
      hint: formatRelative(conversation.updatedAt),
      run: close(() => router.push(`/chat/${conversation.id}`)),
    }));
    return [...actions, ...chats];
  }, [conversations, resolved, setPreference, router, logout, onClose, onToggleSidebar]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? commands.filter((command) => command.label.toLowerCase().includes(needle)) : commands;
  }, [commands, query]);

  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      results[activeIndex]?.run();
    }
  };

  let lastGroup: string | null = null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <motion.div
        className="absolute inset-0 bg-black/25 backdrop-blur-[2px] dark:bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.12 } }}
        transition={{ type: "spring", stiffness: 480, damping: 36 }}
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface shadow-pop"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-4 shrink-0 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Search conversations or type a command…"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={results[activeIndex] ? `command-${results[activeIndex].id}` : undefined}
            className="h-12 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div id="command-list" ref={listRef} role="listbox" className="scroll-thin max-h-[min(380px,55vh)] overflow-y-auto p-1.5">
          {results.length === 0 && (
            <p className="px-3 py-10 text-center text-sm text-muted">No results for “{query.trim()}”.</p>
          )}
          {results.map((command, index) => {
            const heading = command.group !== lastGroup ? command.group : null;
            lastGroup = command.group;
            const selected = index === activeIndex;
            return (
              <div key={command.id}>
                {heading && (
                  <p className="px-3 pb-1 pt-2.5 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">{heading}</p>
                )}
                <button
                  type="button"
                  id={`command-${command.id}`}
                  role="option"
                  aria-selected={selected}
                  data-index={index}
                  onMouseMove={() => !selected && setActive(index)}
                  onClick={command.run}
                  className={cn(
                    "relative flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm outline-none",
                    selected ? "text-ink" : "text-muted",
                  )}
                >
                  {selected && (
                    <motion.span
                      layoutId="command-highlight"
                      className="absolute inset-0 rounded-lg bg-hover"
                      transition={{ type: "spring", stiffness: 600, damping: 42 }}
                    />
                  )}
                  <span
                    className={cn(
                      "relative text-faint [&>svg]:size-4",
                      selected && "text-accent",
                    )}
                  >
                    {command.icon}
                  </span>
                  <span className="relative min-w-0 flex-1 truncate">{command.label}</span>
                  {command.hint && <span className="relative text-xs text-faint">{command.hint}</span>}
                  {selected && <CornerDownLeft className="relative size-3.5 text-faint" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 border-t border-line bg-subtle/60 px-4 py-2 text-xs text-faint">
          <span className="flex items-center gap-1.5">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> to navigate
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>↵</Kbd> to select
          </span>
        </div>
      </motion.div>
    </div>
  );
}
