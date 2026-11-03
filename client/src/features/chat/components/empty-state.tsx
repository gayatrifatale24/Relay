"use client";

import { useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CreditCard, KeyRound, Package, Wrench } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";

const SUGGESTIONS = [
  {
    icon: Package,
    tint: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    title: "Track an order",
    prompt: "My order hasn't arrived yet. How can I check where it is?",
  },
  {
    icon: CreditCard,
    tint: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    title: "Billing question",
    prompt: "I was charged twice this month. What should I do?",
  },
  {
    icon: KeyRound,
    tint: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    title: "Account access",
    prompt: "I can't log in to my account. How do I reset my password?",
  },
  {
    icon: Wrench,
    tint: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    title: "Troubleshooting",
    prompt: "The app keeps crashing when I upload a file. Can you help me fix it?",
  },
];

const ease = [0.2, 0, 0, 1] as const;

// The greeting depends on the visitor's clock, so it is read on the client only.
const subscribe = () => () => undefined;
function greetingForNow(): string {
  const hour = new Date().getHours();
  return hour < 5 ? "Hi" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function useGreeting() {
  return useSyncExternalStore(subscribe, greetingForNow, () => "Hi");
}

/** Logo with soft rings pulsing outward. */
function PulsingMark() {
  return (
    <div className="relative mb-6 flex size-14 items-center justify-center">
      {[0, 1].map((ring) => (
        <motion.span
          key={ring}
          className="absolute inset-0 rounded-2xl border border-accent/40"
          initial={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 2.4, repeat: Infinity, delay: ring * 1.2, ease: "easeOut" }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <LogoMark className="size-14 rounded-2xl shadow-[0_8px_24px_-8px_var(--accent)]" />
      </motion.div>
    </div>
  );
}

/** Headline whose words rise into place one after another. */
function RevealText({ text }: { text: string }) {
  return (
    <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">
      {text.split(" ").map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="mr-[0.25em] inline-block"
          initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, delay: 0.15 + index * 0.06, ease }}
        >
          {word}
        </motion.span>
      ))}
    </h1>
  );
}

interface SuggestionCardProps {
  suggestion: (typeof SUGGESTIONS)[number];
  index: number;
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}

/** Card with a soft highlight that follows the pointer. */
function SuggestionCard({ suggestion, index, disabled, onSelect }: SuggestionCardProps) {
  const { icon: Icon, tint, title, prompt } = suggestion;

  const onPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--y", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.35 + index * 0.06, ease }}
    >
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => onSelect(prompt)}
        onPointerMove={onPointerMove}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="group relative flex h-full w-full items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface p-4 text-left shadow-[0_1px_2px_rgb(16_16_20/0.03)] transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-float disabled:opacity-60"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), var(--glow), transparent 70%)" }}
        />
        <span
          className={`relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${tint}`}
        >
          <Icon className="size-[18px]" />
        </span>
        <span className="relative min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
            {title}
            <ArrowUpRight className="size-4 -translate-x-1 translate-y-1 text-faint opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-accent group-hover:opacity-100" />
          </span>
          <span className="mt-1 block text-[13px] leading-snug text-muted">{prompt}</span>
        </span>
      </motion.button>
    </motion.li>
  );
}

interface EmptyStateProps {
  name?: string;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function EmptyState({ name, onSelect, disabled }: EmptyStateProps) {
  const greeting = useGreeting();
  const firstName = name?.split(" ")[0];

  return (
    <div className="scroll-thin relative flex min-h-0 flex-1 overflow-y-auto">
      <div aria-hidden="true" className="dot-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[min(640px,90%)] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--glow), transparent)" }}
      />

      <div className="relative m-auto w-full max-w-2xl px-4 py-10 sm:px-6">
        <PulsingMark />
        <RevealText text={firstName ? `${greeting}, ${firstName}.` : `${greeting}.`} />
        <motion.p
          className="mt-2 max-w-lg text-[15px] leading-relaxed text-muted"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3, ease }}
        >
          I&apos;m Relay, your support assistant. Ask about orders, billing, account access or troubleshooting, and
          I&apos;ll walk you through the next steps.
        </motion.p>

        <ul className="mt-8 grid gap-2.5 sm:grid-cols-2">
          {SUGGESTIONS.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.title}
              suggestion={suggestion}
              index={index}
              disabled={disabled}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
