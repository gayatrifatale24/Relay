"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CreditCard, KeyRound, Package, Wrench } from "lucide-react";

const SUGGESTIONS = [
  { icon: Package, title: "Track an order", prompt: "My order hasn't arrived yet. How can I check where it is?" },
  { icon: CreditCard, title: "Billing question", prompt: "I was charged twice this month. What should I do?" },
  { icon: KeyRound, title: "Account access", prompt: "I can't log in to my account. How do I reset my password?" },
  { icon: Wrench, title: "Troubleshooting", prompt: "The app keeps crashing when I upload a file. Can you help me fix it?" },
];

interface EmptyStateProps {
  name?: string;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function EmptyState({ name, onSelect, disabled }: EmptyStateProps) {
  const firstName = name?.split(" ")[0];
  return (
    <div className="scroll-thin flex min-h-0 flex-1 overflow-y-auto">
      <div className="m-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
        >
          <h1 className="text-xl font-semibold tracking-[-0.015em] text-ink sm:text-2xl">
            {firstName ? `Hi ${firstName}, how can we help?` : "How can we help?"}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            Relay answers questions about orders, billing, account access and troubleshooting. Describe your issue and
            it will walk you through the next steps.
          </p>
        </motion.div>

        <ul className="mt-8 grid gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map(({ icon: Icon, title, prompt }, index) => (
            <motion.li
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: 0.06 + index * 0.04, ease: [0.2, 0, 0, 1] }}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(prompt)}
                className="group flex h-full w-full items-start gap-3 rounded-lg border border-line bg-surface p-3.5 text-left transition-colors duration-150 hover:border-line-strong hover:bg-subtle disabled:opacity-60"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-subtle text-muted transition-colors group-hover:bg-surface group-hover:text-accent">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 text-[13px] font-medium text-ink">
                    {title}
                    <ArrowUpRight className="size-3.5 text-faint opacity-0 transition-all duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{prompt}</span>
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  );
}
