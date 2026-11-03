export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
}

export interface Conversation extends ConversationSummary {
  messages: Message[];
}

export interface SendMessageInput {
  message: string;
  conversationId?: string;
}

export interface SendMessageResponse {
  conversation: ConversationSummary;
  /** The persisted user message followed by the assistant reply. */
  messages: [Message, Message];
}

/** First SSE event of a streamed reply: the ids the server will save the exchange under. */
export interface StreamStart {
  conversation: { id: string; title: string; createdAt: string };
  userMessage: { id: string; createdAt: string };
  assistantMessage: { id: string; createdAt: string };
}

export interface StreamHandlers {
  signal: AbortSignal;
  onStart: (start: StreamStart) => void;
  onDelta: (text: string) => void;
}

/**
 * A message that has been submitted but not yet confirmed by the server.
 * `sending`: waiting for the first token. `streaming`: `reply` is filling in.
 */
export interface PendingMessage {
  content: string;
  createdAt: string;
  status: "sending" | "streaming" | "failed";
  reply: string;
  error?: string;
}
