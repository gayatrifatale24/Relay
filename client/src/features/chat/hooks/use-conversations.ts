"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatService } from "../services/chat.service";
import type { ConversationSummary } from "../types/chat.types";

export const conversationsKey = ["conversations"] as const;
export const conversationKey = (id: string) => ["conversation", id] as const;

export function useConversations() {
  return useQuery({
    queryKey: conversationsKey,
    queryFn: chatService.listConversations,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: conversationKey(id ?? ""),
    queryFn: () => chatService.getConversation(id!),
    enabled: Boolean(id),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatService.deleteConversation,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<ConversationSummary[]>(conversationsKey, (list) =>
        list?.filter((conversation) => conversation.id !== id),
      );
      queryClient.removeQueries({ queryKey: conversationKey(id) });
    },
  });
}
