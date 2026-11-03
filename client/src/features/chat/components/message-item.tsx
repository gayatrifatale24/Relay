"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Check, Copy, RotateCcw, X } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
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

const entrance = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: [0.2, 0, 0, 1] as const },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be unavailable on insecure origins; the button simply does nothing.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy response"}
      className="inline-flex size-7 items-center justify-center rounded-md text-faint transition-colors hover:bg-hover hover:text-ink"
    >
      {copied ? <Check className="size-3.5 text-accent" /> : <Copy className="size-3.5" />}
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
  const motionProps = animate ? entrance : { initial: false as const };

  if (role === "assistant") {
    return (
      <motion.article {...motionProps} className="group flex gap-3" aria-label="Relay">
        <LogoMark className="mt-0.5 size-7" />
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
            <div className="mt-1 -ml-1.5 flex opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
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
          failed ? "border border-danger/30 bg-danger-soft text-ink" : "bg-subtle text-ink",
          status === "sending" && "opacity-80",
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
