"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, RotateCcw, X } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import type { MessageRole } from "../types/chat.types";
import { formatMessageTime } from "../utils/date";
import { Markdown } from "./markdown";
import { TypingDots } from "./typing-indicator";

interface MessageItemProps {
  role: MessageRole;
  content: string;
  createdAt: string;
  animate: boolean;
  /** Assistant reply still being generated: shows a cursor and hides actions. */
  streaming?: boolean;
  status?: "sending" | "failed";
  error?: string;
  onRetry?: () => void;
  onDiscard?: () => void;
}

// Each side enters from its own edge: replies from the left, your messages from the right.
const entrance = (fromX: number) => ({
  initial: { opacity: 0, x: fromX, y: 6, scale: 0.98 },
  animate: { opacity: 1, x: 0, y: 0, scale: 1 },
  transition: { type: "spring" as const, stiffness: 420, damping: 32 },
});

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast("Copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast("Copying isn't available here", "info");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy response"}
      title="Copy"
      className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-faint transition-colors hover:bg-hover hover:text-ink"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "done" : "copy"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="inline-flex"
        >
          {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
        </motion.span>
      </AnimatePresence>
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function MessageItem({
  role,
  content,
  createdAt,
  animate,
  streaming = false,
  status,
  error,
  onRetry,
  onDiscard,
}: MessageItemProps) {
  const time = formatMessageTime(createdAt);
  const motionProps = animate ? entrance(role === "assistant" ? -12 : 12) : { initial: false as const };

  if (role === "assistant") {
    return (
      <motion.article {...motionProps} className="group flex gap-3" aria-label="Relay">
        <span className="relative mt-0.5 h-fit">
          <LogoMark className="size-7 rounded-lg" />
          {streaming && (
            <span className="absolute -inset-1 animate-pulse rounded-[10px] ring-2 ring-accent/30 motion-reduce:hidden" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-[13px] font-medium text-ink">Relay</span>
            <time dateTime={createdAt} className="text-xs text-faint">
              {time}
            </time>
          </div>
          {streaming && !content ? (
            <div role="status">
              <TypingDots />
              <span className="sr-only">Relay is typing</span>
            </div>
          ) : (
            <Markdown content={content} streaming={streaming} />
          )}
          {!streaming && (
            <div className="mt-1.5 -ml-2 flex translate-y-0 opacity-100 transition-all duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100">
              <CopyButton text={content} />
            </div>
          )}
        </div>
      </motion.article>
    );
  }

  const failed = status === "failed";
  return (
    <motion.article {...motionProps} className="group flex flex-col items-end" aria-label="You">
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md px-4 py-2.5 text-[15px] leading-relaxed sm:max-w-[75%]",
          failed
            ? "border border-danger/30 bg-danger-soft text-ink"
            : "bg-accent text-accent-fg shadow-[0_6px_16px_-8px_var(--accent)] selection:bg-accent-fg/25 selection:text-accent-fg",
          status === "sending" && "opacity-85",
        )}
      >
        {content}
      </div>
      {failed ? (
        <div className="mt-1.5 flex items-center gap-2 text-xs" role="alert">
          <span className="flex items-center gap-1 text-danger">
            <AlertCircle className="size-3.5" />
            {error ?? "Not sent"}
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium text-ink hover:bg-hover"
          >
            <RotateCcw className="size-3" /> Retry
          </button>
          <button
            type="button"
            onClick={onDiscard}
            aria-label="Discard message and edit"
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted hover:bg-hover hover:text-ink"
          >
            <X className="size-3" /> Edit
          </button>
        </div>
      ) : (
        <time
          dateTime={createdAt}
          className="mt-1 text-xs text-faint opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          {status === "sending" ? "Sending…" : time}
        </time>
      )}
    </motion.article>
  );
}
