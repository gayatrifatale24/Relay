"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils/cn";
import { MAX_MESSAGE_LENGTH } from "../services/chat.service";

export interface ComposerHandle {
  setValue: (value: string) => void;
  focus: () => void;
}

interface ComposerProps {
  onSend: (message: string) => boolean;
  /** When set, a reply is being generated and the send button becomes a stop button. */
  onStop?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_HEIGHT = 200;

const swap = {
  initial: { opacity: 0, scale: 0.7 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.7 },
  transition: { duration: 0.14 },
};

export const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onSend, onStop, disabled = false, placeholder = "Ask about orders, billing, your account…" },
  ref,
) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = value.trim();
  const tooLong = value.length > MAX_MESSAGE_LENGTH;
  const canSend = trimmed.length > 0 && !tooLong && !disabled;

  useImperativeHandle(ref, () => ({
    setValue: (next) => {
      setValue(next);
      textareaRef.current?.focus();
    },
    focus: () => textareaRef.current?.focus(),
  }));

  // Grow with content up to a limit, then scroll.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const submit = () => {
    if (!canSend) return;
    if (onSend(trimmed)) setValue("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-4 pb-4 sm:px-6 sm:pb-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={cn(
          "mx-auto w-full max-w-3xl rounded-2xl border bg-surface shadow-float transition-[border-color,box-shadow] duration-200",
          "focus-within:border-accent/50 focus-within:shadow-[0_0_0_4px_var(--glow),var(--shadow-float)]",
          tooLong ? "border-danger" : "border-line",
        )}
      >
        <label htmlFor="composer" className="sr-only">
          Message Relay
        </label>
        <textarea
          id="composer"
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          autoFocus
          className="scroll-thin block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-2.5 pl-4">
          <p className="hidden items-center gap-1.5 text-xs text-faint sm:flex">
            <Kbd>Enter</Kbd> send
            <span className="mx-1 text-line-strong">·</span>
            <Kbd>Shift</Kbd>
            <Kbd>Enter</Kbd> new line
          </p>
          <div className="ml-auto flex items-center gap-3">
            {value.length > MAX_MESSAGE_LENGTH * 0.8 && (
              <span className={cn("text-xs tabular-nums", tooLong ? "text-danger" : "text-faint")}>
                {value.length}/{MAX_MESSAGE_LENGTH}
              </span>
            )}
            <AnimatePresence mode="wait" initial={false}>
              {onStop ? (
                <motion.button
                  key="stop"
                  type="button"
                  onClick={onStop}
                  aria-label="Stop generating"
                  title="Stop generating"
                  whileTap={{ scale: 0.92 }}
                  {...swap}
                  className="relative inline-flex size-9 items-center justify-center rounded-xl bg-ink text-surface transition-opacity hover:opacity-85"
                >
                  <span className="absolute inset-0 animate-ping rounded-xl bg-ink/20 [animation-duration:1.6s] motion-reduce:hidden" />
                  <Square className="relative size-3" fill="currentColor" strokeWidth={0} />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  whileTap={canSend ? { scale: 0.92 } : undefined}
                  {...swap}
                  animate={{ opacity: canSend ? 1 : 0.4, scale: 1 }}
                  className={cn(
                    "group/send inline-flex size-9 items-center justify-center rounded-xl transition-[background-color,box-shadow] duration-200",
                    canSend
                      ? "bg-accent text-accent-fg shadow-[0_4px_14px_-4px_var(--accent)] hover:bg-accent-hover"
                      : "cursor-not-allowed bg-subtle text-faint",
                  )}
                >
                  <ArrowUp
                    className="size-4 transition-transform duration-200 group-hover/send:-translate-y-0.5"
                    strokeWidth={2.25}
                  />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-faint">
        Relay is an AI assistant and can make mistakes. Verify important account details with a human agent.
      </p>
    </div>
  );
});
