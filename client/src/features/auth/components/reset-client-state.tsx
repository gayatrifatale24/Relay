"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Drops cached data from any previous session once an auth page mounts. Clearing here,
 * after the chat screen has unmounted, avoids refetching protected data during logout.
 */
export function ResetClientState() {
  const queryClient = useQueryClient();
  useEffect(() => {
    queryClient.clear();
  }, [queryClient]);
  return null;
}
