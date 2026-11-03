"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock3, MessageSquareText } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { TypingDots } from "@/features/chat/components/typing-indicator";

// Illustrative product preview for the marketing panel. Not user data.
const SCRIPT = [
  { from: "customer", text: "My order arrived damaged. Can I get a replacement?" },
  { from: "assistant", text: "I'm sorry about that. I can help you start a replacement. Could you share your order number?" },
  { from: "customer", text: "It's #48213." },
  {
    from: "assistant",
    text: "Thanks. I can't verify orders directly, so I've outlined the next steps and flagged this for a human agent to confirm.",
  },
] as const;

const FEATURES = [
  { icon: MessageSquareText, label: "Context-aware answers across the whole conversation" },
  { icon: Clock3, label: "Every conversation saved and searchable" },
  { icon: Check, label: "Honest about what it can and can't verify" },
];

export function AuthShowcase() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(reduceMotion ? SCRIPT.length : 1);
  const typing = visible < SCRIPT.length && SCRIPT[visible]?.from === "assistant";

  useEffect(() => {
    if (reduceMotion) return;
    const delay = visible >= SCRIPT.length ? 4200 : typing ? 1500 : 1100;
    const timer = setTimeout(() => setVisible((count) => (count >= SCRIPT.length ? 1 : count + 1)), delay);
    return () => clearTimeout(timer);
  }, [visible, typing, reduceMotion]);

  return (
    <div className="flex w-full flex-col justify-center px-12 py-16 xl:px-20" aria-hidden="true">
      <div className="max-w-md">
        <p className="text-[13px] font-medium text-accent-ink">Customer support, answered</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-ink">
          Resolve questions in seconds, keep every conversation.
        </h2>
        <ul className="mt-6 space-y-2.5">
          {FEATURES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-muted">
              <Icon className="size-4 text-faint" />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 max-w-md overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgb(16_16_20/0.04)]">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-2">
            <LogoMark className="size-5 rounded" />
            <span className="text-[13px] font-medium text-ink">Relay</span>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-faint">
            <span className="size-1.5 rounded-full bg-accent" />
            Online
          </span>
        </div>
        <div className="flex h-[264px] flex-col justify-end gap-2.5 overflow-hidden p-4">
          <AnimatePresence initial={false} mode="popLayout">
            {SCRIPT.slice(0, visible).map((line) => (
              <motion.div
                key={line.text}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                className={
                  line.from === "customer"
                    ? "ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-subtle px-3.5 py-2 text-[13px] text-ink"
                    : "mr-auto max-w-[85%] text-[13px] leading-relaxed text-muted"
                }
              >
                {line.text}
              </motion.div>
            ))}
            {typing && (
              <motion.div
                key="typing"
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mr-auto"
              >
                <TypingDots />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
