import { apiClient, ApiError } from "@/lib/api/client";
import type {
  Conversation,
  ConversationSummary,
  SendMessageInput,
  SendMessageResponse,
  StreamHandlers,
  StreamStart,
} from "../types/chat.types";
import { readServerSentEvents } from "../utils/sse";

export const MAX_MESSAGE_LENGTH = 4000;

interface ErrorBody {
  error?: { message?: string; code?: string };
  message?: string;
  code?: string;
}

export const chatService = {
  async listConversations(): Promise<ConversationSummary[]> {
    const { data } = await apiClient.get<{ conversations: ConversationSummary[] }>("/chat/history");
    return data.conversations;
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data } = await apiClient.get<{ conversation: Conversation }>(`/chat/conversations/${id}`);
    return data.conversation;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${id}`);
  },

  /**
   * Sends a message and streams the reply over Server-Sent Events. Uses fetch because
   * Axios cannot expose a streaming response body in the browser. Resolves with the saved
   * exchange; rejects with an ApiError, or an AbortError when `signal` is aborted.
   */
  async streamMessage(input: SendMessageInput, { signal, onStart, onDelta }: StreamHandlers): Promise<SendMessageResponse> {
    let response: Response;
    try {
      response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        credentials: "same-origin",
        body: JSON.stringify(input),
        signal,
      });
    } catch (error) {
      if (signal.aborted) throw error;
      throw new ApiError("Can't reach the server. Check your connection.", 0, "NETWORK");
    }

    if (!response.ok || !response.body) {
      const body = (await response.json().catch(() => ({}))) as ErrorBody;
      throw new ApiError(
        body.error?.message ?? "Something went wrong. Please try again.",
        response.status,
        body.error?.code,
      );
    }

    for await (const { event, data } of readServerSentEvents(response.body)) {
      const payload: unknown = JSON.parse(data);
      switch (event) {
        case "start":
          onStart(payload as StreamStart);
          break;
        case "delta":
          onDelta((payload as { text: string }).text);
          break;
        case "done":
          return payload as SendMessageResponse;
        case "error": {
          const body = payload as ErrorBody;
          throw new ApiError(body.message ?? "The assistant ran into a problem.", 502, body.code);
        }
      }
    }
    throw new ApiError("The connection closed before the reply finished. Please try again.", 0, "STREAM_INTERRUPTED");
  },
};
