import { env } from "../config/env.js";
import { HttpError } from "../utils/http-error.js";

export interface ChatTurn {
  role: "system" | "user" | "assistant";
  content: string;
}

const SYSTEM_PROMPT = `You are Relay, the customer support assistant for a software company.
- Be warm, concise and practical. Prefer short paragraphs and numbered steps for procedures.
- Help with accounts, billing, orders, shipping, refunds, troubleshooting and product questions.
- Ask one clarifying question when a request is ambiguous instead of guessing.
- Never invent order numbers, policies, prices or account details. If you cannot verify something, say so and suggest contacting a human agent.
- Use Markdown for lists, emphasis and code when it improves readability. Never use HTML tags such as <br>; use separate list items or lines instead.`;

// Keep context bounded so long conversations stay within model limits.
const MAX_CONTEXT_MESSAGES = 20;
const REQUEST_TIMEOUT_MS = 45_000;

interface OpenRouterResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string };
}

interface OpenRouterChunk {
  choices?: { delta?: { content?: string } }[];
  error?: { message?: string };
}

/** Sends the completion request and resolves once response headers arrive. */
async function requestCompletion(history: ChatTurn[], stream: boolean, signal: AbortSignal): Promise<Response> {
  if (!env.OPENROUTER_API_KEY) {
    throw new HttpError(503, "The AI assistant is not configured on the server.", "AI_NOT_CONFIGURED");
  }

  const messages: ChatTurn[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-MAX_CONTEXT_MESSAGES),
  ];

  let response: Response;
  try {
    response = await fetch(`${env.OPENROUTER_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.CLIENT_ORIGIN,
        "X-Title": "Relay Support",
      },
      body: JSON.stringify({ model: env.OPENROUTER_MODEL, messages, temperature: 0.4, stream }),
      signal,
    });
  } catch (err) {
    // Let caller-initiated aborts (client disconnects) propagate untouched.
    if (signal.aborted && !(signal.reason instanceof DOMException && signal.reason.name === "TimeoutError")) throw err;
    const timedOut = signal.aborted;
    throw new HttpError(
      timedOut ? 504 : 502,
      timedOut ? "The assistant took too long to respond. Please try again." : "Could not reach the AI provider.",
      "AI_UNAVAILABLE",
    );
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as OpenRouterResponse;
    console.error(`OpenRouter error ${response.status}:`, data.error?.message);
    const message =
      response.status === 429
        ? "The assistant is receiving too many requests. Please wait a moment and try again."
        : "The assistant is temporarily unavailable. Please try again.";
    throw new HttpError(response.status === 429 ? 429 : 502, message, "AI_UNAVAILABLE");
  }

  return response;
}

export async function generateReply(history: ChatTurn[]): Promise<string> {
  const response = await requestCompletion(history, false, AbortSignal.timeout(REQUEST_TIMEOUT_MS));
  const data = (await response.json().catch(() => ({}))) as OpenRouterResponse;

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new HttpError(502, "The assistant returned an empty response. Please try again.", "AI_EMPTY");
  }
  return reply;
}

/** Parses OpenRouter's server-sent events into text deltas. */
async function* readDeltas(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true });
    let newline: number;
    while ((newline = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      // Skips blank lines and keep-alive comments such as ": OPENROUTER PROCESSING".
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") return;

      let parsed: OpenRouterChunk;
      try {
        parsed = JSON.parse(data) as OpenRouterChunk;
      } catch {
        continue;
      }
      if (parsed.error) {
        console.error("OpenRouter stream error:", parsed.error.message);
        throw new HttpError(502, "The assistant ran into a problem while replying. Please try again.", "AI_STREAM_ERROR");
      }
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  }
}

/**
 * Starts a streamed completion. Provider errors (rate limits, bad keys) are thrown before
 * this resolves, so callers can still answer with a normal JSON error response.
 */
export async function streamReply(history: ChatTurn[], signal: AbortSignal): Promise<AsyncGenerator<string>> {
  const response = await requestCompletion(history, true, signal);
  if (!response.body) {
    throw new HttpError(502, "The assistant returned an empty response. Please try again.", "AI_EMPTY");
  }
  return readDeltas(response.body);
}
