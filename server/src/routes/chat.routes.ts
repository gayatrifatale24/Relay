import { Router, type Response } from "express";
import { isValidObjectId, Types } from "mongoose";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { Conversation } from "../models/conversation.model.js";
import { parseBody } from "../middleware/validate.js";
import { getUserId, requireAuth } from "../middleware/require-auth.js";
import { generateReply, streamReply, type ChatTurn } from "../services/ai.service.js";
import { HttpError } from "../utils/http-error.js";

const MAX_MESSAGE_LENGTH = 4000;
const TITLE_LENGTH = 60;
// Abort a stream when the provider goes quiet for this long.
const STREAM_IDLE_TIMEOUT_MS = 45_000;

const sendSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`),
  conversationId: z.string().refine(isValidObjectId, "Invalid conversation id").optional(),
});

interface MessageLike {
  _id: unknown;
  role: string;
  content: string;
  createdAt?: Date;
}

function toMessage(m: MessageLike) {
  return { id: String(m._id), role: m.role, content: m.content, createdAt: m.createdAt };
}

function toSummary(c: { _id: unknown; title: string; createdAt: Date; updatedAt: Date; messages: MessageLike[] }) {
  const last = c.messages.at(-1);
  return {
    id: String(c._id),
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    preview: last ? last.content.slice(0, 140) : "",
  };
}

function deriveTitle(message: string): string {
  const singleLine = message.replace(/\s+/g, " ").trim();
  return singleLine.length > TITLE_LENGTH ? `${singleLine.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : singleLine;
}

/** Loads the model context for an existing conversation, or an empty one for a new chat. */
async function loadConversation(userId: string, conversationId: string | undefined, message: string) {
  if (!conversationId) {
    return { id: new Types.ObjectId(), isNew: true, title: deriveTitle(message), createdAt: new Date(), history: [] };
  }
  const existing = await Conversation.findOne({ _id: conversationId, user: userId })
    .select({ title: 1, createdAt: 1, messages: 1 })
    .lean();
  if (!existing) throw new HttpError(404, "Conversation not found", "NOT_FOUND");
  return {
    id: existing._id,
    isNew: false,
    title: existing.title,
    createdAt: existing.createdAt,
    history: existing.messages.map((m): ChatTurn => ({ role: m.role, content: m.content })),
  };
}

type LoadedConversation = Awaited<ReturnType<typeof loadConversation>>;

interface Exchange {
  userMessage: { _id: Types.ObjectId; content: string; createdAt: Date };
  assistantMessage: { _id: Types.ObjectId; content: string; createdAt: Date };
}

/** Persists a user message and its reply. Called only once a reply exists. */
async function saveExchange(userId: string, conversation: LoadedConversation, exchange: Exchange) {
  const messages = [
    { ...exchange.userMessage, role: "user" as const },
    { ...exchange.assistantMessage, role: "assistant" as const },
  ];
  const saved = conversation.isNew
    ? (
        await Conversation.create({ _id: conversation.id, user: userId, title: conversation.title, messages })
      ).toObject()
    : await Conversation.findOneAndUpdate(
        { _id: conversation.id, user: userId },
        { $push: { messages: { $each: messages } } },
        { new: true },
      ).lean();
  if (!saved) throw new HttpError(404, "Conversation not found", "NOT_FOUND");
  return saved;
}

function newExchange(message: string): Exchange {
  const createdAt = new Date();
  return {
    userMessage: { _id: new Types.ObjectId(), content: message, createdAt },
    assistantMessage: { _id: new Types.ObjectId(), content: "", createdAt },
  };
}

function writeEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

const sendLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.userId ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: { message: "You're sending messages too quickly. Please wait a moment.", code: "RATE_LIMITED" } },
});

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get("/history", async (req, res) => {
  const conversations = await Conversation.find({ user: getUserId(req) })
    .select({ title: 1, createdAt: 1, updatedAt: 1, messages: { $slice: -1 } })
    .sort({ updatedAt: -1 })
    .limit(100)
    .lean();

  res.json({ conversations: conversations.map(toSummary) });
});

chatRouter.get("/conversations/:id", async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, user: getUserId(req) }).lean();
  if (!conversation) throw new HttpError(404, "Conversation not found", "NOT_FOUND");

  res.json({
    conversation: {
      ...toSummary(conversation),
      messages: conversation.messages.map(toMessage),
    },
  });
});

chatRouter.delete("/conversations/:id", async (req, res) => {
  const result = await Conversation.deleteOne({ _id: req.params.id, user: getUserId(req) });
  if (result.deletedCount === 0) throw new HttpError(404, "Conversation not found", "NOT_FOUND");
  res.status(204).end();
});

/** Non-streaming variant: returns the complete reply as JSON. */
chatRouter.post("/send", sendLimiter, async (req, res) => {
  const userId = getUserId(req);
  const { message, conversationId } = parseBody(sendSchema, req.body);
  const conversation = await loadConversation(userId, conversationId, message);

  // Generate first so a failed AI call never leaves an unanswered message behind.
  const exchange = newExchange(message);
  exchange.assistantMessage.content = await generateReply([
    ...conversation.history,
    { role: "user", content: message },
  ]);
  const saved = await saveExchange(userId, conversation, exchange);

  res.status(conversation.isNew ? 201 : 200).json({
    conversation: toSummary(saved),
    messages: saved.messages.slice(-2).map(toMessage),
  });
});

/**
 * Streaming variant over Server-Sent Events:
 *   event: start  { conversation, userMessage, assistantMessage }  ids the client can use immediately
 *   event: delta  { text }                                          one per generated chunk
 *   event: done   { conversation, messages }                        same shape as /chat/send
 *   event: error  { message, code }                                 failure after streaming began
 * If the client disconnects mid-reply, the partial reply is saved.
 */
chatRouter.post("/stream", sendLimiter, async (req, res) => {
  const userId = getUserId(req);
  const { message, conversationId } = parseBody(sendSchema, req.body);
  const conversation = await loadConversation(userId, conversationId, message);

  const controller = new AbortController();
  let clientGone = false;
  res.on("close", () => {
    if (!res.writableFinished) {
      clientGone = true;
      controller.abort();
    }
  });

  let idleTimer: NodeJS.Timeout | undefined;
  const armIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => controller.abort(new DOMException("AI stream went idle", "TimeoutError")),
      STREAM_IDLE_TIMEOUT_MS,
    );
  };

  armIdleTimer();
  let deltas: AsyncGenerator<string>;
  try {
    // Provider errors surface here, before any SSE bytes, as a normal JSON error response.
    deltas = await streamReply([...conversation.history, { role: "user", content: message }], controller.signal);
  } catch (err) {
    clearTimeout(idleTimer);
    if (clientGone) return;
    throw err;
  }

  res.status(200).set({
    "Content-Type": "text/event-stream; charset=utf-8",
    // no-transform stops proxies and compression middleware from buffering the stream.
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();

  const exchange = newExchange(message);
  writeEvent(res, "start", {
    conversation: { id: String(conversation.id), title: conversation.title, createdAt: conversation.createdAt },
    userMessage: { id: String(exchange.userMessage._id), createdAt: exchange.userMessage.createdAt },
    assistantMessage: { id: String(exchange.assistantMessage._id), createdAt: exchange.assistantMessage.createdAt },
  });

  let reply = "";
  let failure: HttpError | null = null;
  try {
    for await (const text of deltas) {
      armIdleTimer();
      reply += text;
      writeEvent(res, "delta", { text });
    }
  } catch (err) {
    if (!clientGone) {
      const timedOut = controller.signal.aborted;
      failure =
        err instanceof HttpError
          ? err
          : new HttpError(
              timedOut ? 504 : 502,
              timedOut
                ? "The assistant stopped responding. Please try again."
                : "The assistant ran into a problem while replying. Please try again.",
              "AI_STREAM_ERROR",
            );
      if (!(err instanceof HttpError)) console.error("Stream failed:", err);
    }
  } finally {
    clearTimeout(idleTimer);
  }

  exchange.assistantMessage.content = reply.trim();
  const hasReply = exchange.assistantMessage.content.length > 0;

  // The user pressed stop (or closed the tab): keep whatever was generated so far.
  if (clientGone) {
    if (hasReply) await saveExchange(userId, conversation, exchange).catch((err) => console.error(err));
    return;
  }

  if (failure || !hasReply) {
    const error = failure ?? new HttpError(502, "The assistant returned an empty response. Please try again.", "AI_EMPTY");
    writeEvent(res, "error", { message: error.message, code: error.code });
    res.end();
    return;
  }

  try {
    const saved = await saveExchange(userId, conversation, exchange);
    writeEvent(res, "done", {
      conversation: toSummary(saved),
      messages: saved.messages.slice(-2).map(toMessage),
    });
  } catch (err) {
    console.error("Failed to save streamed reply:", err);
    writeEvent(res, "error", { message: "Your reply couldn't be saved. Please try again.", code: "SAVE_FAILED" });
  }
  res.end();
});
