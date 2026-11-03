"use client";

import { useState } from "react";

/**
 * Stable key for the chat view. Switching conversations remounts the view (fresh scroll
 * position and transition), but a brand-new chat that just received its id keeps the same
 * view so the transcript does not flash or replay its entrance animation.
 */
export function useViewKey(conversationId: string | undefined) {
  const [state, setState] = useState({ id: conversationId, generation: 0, adopted: null as string | null });

  if (state.id !== conversationId) {
    const adopting = state.id === undefined && conversationId !== undefined && conversationId === state.adopted;
    setState({ id: conversationId, generation: adopting ? state.generation : state.generation + 1, adopted: null });
  }

  const adopt = (id: string) => setState((current) => ({ ...current, adopted: id }));

  return { key: `view-${state.generation}`, adopt };
}
