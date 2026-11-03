"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const isApple = () => /Mac|iPhone|iPad/i.test(navigator.userAgent);

/** Modifier key label for shortcuts: "⌘" on Apple devices, "Ctrl" elsewhere. */
export function useModifierKey(): string {
  return useSyncExternalStore(subscribe, () => (isApple() ? "⌘" : "Ctrl"), () => "Ctrl");
}
