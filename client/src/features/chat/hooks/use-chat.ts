"use client";

import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getErrorMessage } from "@/lib/api/client";
import { chatService } from "../services/chat.service";
import type {
  Conversation,
  ConversationSummary,
  PendingMessage,
  SendMessageInput,
  SendMessageResponse,
  StreamStart,
} from "../types/chat.types";
import { conversationKey, conversationsKey, useConversation } from "./use-conversations";

interface UseChatOptions {
  /** A new conversation was created with this id. */
  onCreated: (id: string) => void;
  /** A message was stopped before any reply arrived; its text should go back to the composer. */
  onRestore: (content: string) => void;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

/** Builds the saved exchange locally when the user stops a reply (the server saves the same ids). */
function partialExchange(start: StreamStart, message: string, reply: string): SendMessageResponse {
  return {
    conversation: {
      id: start.conversation.id,
      title: start.conversation.title,
      createdAt: start.conversation.createdAt,
      updatedAt: start.userMessage.createdAt,
      preview: reply.slice(0, 140),
    },
    messages: [
      { id: start.userMessage.id, role: "user", content: message, createdAt: start.userMessage.createdAt },
      { id: start.assistantMessage.id, role: "assistant", content: reply, createdAt: start.assistantMessage.createdAt },
    ],
  };
}

/**
 * Conversation state for the chat view: persisted messages from the server plus the single
 * in-flight message whose reply streams in token by token. Only one message can be in
 * flight, which prevents duplicate submissions.
 */
export function useChat(conversationId: string | undefined, { onCreated, onRestore }: UseChatOptions) {
  const queryClient = useQueryClient();
  const conversation = useConversation(conversationId);
  const [pending, setPending] = useState<PendingMessage | null>(null);
  // Ids that replaced the pending/streamed items, so they do not animate in a second time.
  const [settledIds, setSettledIds] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);
  const startRef = useRef<StreamStart | null>(null);
  const replyRef = useRef("");
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Batch tokens into a render roughly every 30ms. A timer (unlike requestAnimationFrame)
  // keeps firing in background tabs, so the reply is never stuck when the tab regains focus.
  const flushReply = () => {
    flushTimerRef.current = null;
    const reply = replyRef.current;
    setPending((current) => current && { ...current, status: "streaming", reply });
  };

  const cancelFlush = () => {
    if (flushTimerRef.current !== null) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = null;
  };

  const commit = (response: SendMessageResponse, isNew: boolean) => {
    const id = response.conversation.id;
    queryClient.setQueryData<Conversation>(conversationKey(id), (current) => ({
      ...response.conversation,
      messages: [...(current?.messages ?? []), ...response.messages],
    }));
    queryClient.setQueryData<ConversationSummary[]>(conversationsKey, (list = []) => [
      response.conversation,
      ...list.filter((item) => item.id !== id),
    ]);
    setSettledIds(response.messages.map((message) => message.id));
    setPending(null);
    if (isNew) onCreated(id);
  };

  const mutation = useMutation({
    mutationFn: (input: SendMessageInput) => {
      const controller = new AbortController();
      abortRef.current = controller;
      startRef.current = null;
      replyRef.current = "";
      return chatService.streamMessage(input, {
        signal: controller.signal,
        onStart: (start) => {
          startRef.current = start;
        },
        onDelta: (text) => {
          replyRef.current += text;
          flushTimerRef.current ??= setTimeout(flushReply, 30);
        },
      });
    },
    onSuccess: (response, input) => {
      cancelFlush();
      commit(response, !input.conversationId);
    },
    onError: (error, input) => {
      cancelFlush();
      if (isAbortError(error)) {
        const start = startRef.current;
        const reply = replyRef.current.trim();
        if (start && reply) {
          commit(partialExchange(start, input.message, reply), !input.conversationId);
        } else {
          setPending(null);
          onRestore(input.message);
        }
        return;
      }
      setPending((current) => current && { ...current, status: "failed", reply: "", error: getErrorMessage(error) });
    },
    onSettled: () => {
      abortRef.current = null;
    },
  });

  const submit = (content: string) => {
    setPending({ content, createdAt: new Date().toISOString(), status: "sending", reply: "" });
    mutation.mutate({ message: content, conversationId });
  };

  /** Returns false when the message was rejected (empty or another one is in flight). */
  const send = (content: string): boolean => {
    const text = content.trim();
    if (!text || mutation.isPending) return false;
    submit(text);
    return true;
  };

  const retry = () => {
    if (pending && !mutation.isPending) submit(pending.content);
  };

  const discard = () => {
    const content = pending?.content ?? "";
    setPending(null);
    return content;
  };

  /** Stops the reply in progress. Text generated so far is kept and saved. */
  const stop = () => abortRef.current?.abort();

  return {
    conversation,
    messages: conversation.data?.messages ?? [],
    pending,
    settledIds,
    isBusy: mutation.isPending,
    send,
    retry,
    discard,
    stop,
  };
}
