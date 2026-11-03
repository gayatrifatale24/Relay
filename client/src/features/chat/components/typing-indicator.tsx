"use client";

import { motion } from "framer-motion";

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1.5" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="size-1.5 rounded-full bg-faint"
          animate={{ opacity: [0.35, 1, 0.35], y: [0, -2.5, 0] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: index * 0.15 }}
        />
      ))}
    </span>
  );
}
