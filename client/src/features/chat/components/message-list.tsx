"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import type { Message, PendingMessage } from "../types/chat.types";
import { MessageItem } from "./message-item";

interface MessageListProps {
  messages: Message[];
  pending: PendingMessage | null;
  settledIds: string[];
  onRetry: () => void;
  onDiscard: () => void;
}

const STICK_THRESHOLD = 120;

export function MessageList({ messages, pending, settledIds, onRetry, onDiscard }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  // Messages present on first render are history: they appear without an entrance animation.
  const [historyIds] = useState(() => new Set(messages.map((message) => message.id)));

  const scrollToEnd = (behavior: ScrollBehavior) => endRef.current?.scrollIntoView({ behavior, block: "end" });

  useLayoutEffect(() => {
    scrollToEnd("auto");
  }, []);

  // Follow new content while the reader is at the bottom; always follow their own sends.
  // Streaming text grows every frame, so it scrolls instantly rather than smoothly.
  const streaming = pending?.status === "streaming";
  const lastKey = `${messages.length}:${pending?.status ?? "none"}:${pending?.reply.length ?? 0}`;
  useEffect(() => {
    if (pending?.status === "sending") scrollToEnd("smooth");
    else if (atBottom) scrollToEnd(streaming ? "auto" : "smooth");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when the transcript changes
  }, [lastKey]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD);
  };

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} onScroll={onScroll} className="scroll-thin h-full overflow-y-auto">
        <div
          className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 pb-6 pt-6 sm:px-6"
          aria-live="polite"
          aria-busy={streaming}
        >
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              role={message.role}
              content={message.content}
              createdAt={message.createdAt}
              animate={!historyIds.has(message.id) && !settledIds.includes(message.id)}
            />
          ))}
          {pending && (
            <MessageItem
              key={`pending-${pending.createdAt}`}
              role="user"
              content={pending.content}
              createdAt={pending.createdAt}
              status={pending.status === "streaming" ? undefined : pending.status}
              error={pending.error}
              animate
              onRetry={onRetry}
              onDiscard={onDiscard}
            />
          )}
          {/* One slot for the reply: typing dots until the first token, then the streamed text. */}
          {(pending?.status === "sending" || pending?.status === "streaming") && (
            <MessageItem
              key={`reply-${pending.createdAt}`}
              role="assistant"
              content={pending.reply}
              createdAt={pending.createdAt}
              streaming
              animate
            />
          )}
          <div ref={endRef} />
        </div>
      </div>

      <AnimatePresence>
        {!atBottom && (
          <motion.button
            type="button"
            onClick={() => scrollToEnd("smooth")}
            initial={{ opacity: 0, y: 8, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 8, x: "-50%" }}
            transition={{ duration: 0.16 }}
            aria-label="Scroll to latest message"
            className="absolute bottom-3 left-1/2 inline-flex size-8 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-pop hover:text-ink"
          >
            <ArrowDown className="size-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
