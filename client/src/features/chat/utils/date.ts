import type { ConversationSummary } from "../types/chat.types";

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

const DAY = 86_400_000;

/** "3:42 PM" for today, "Mar 4, 3:42 PM" otherwise. */
export function formatMessageTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  return startOfDay(date) === startOfDay(now) ? timeFormat.format(date) : dateTimeFormat.format(date);
}

const shortDate = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

/** Compact age for lists: "now", "5m", "3h", "2d", then "Mar 4". */
export function formatRelative(iso: string, now = new Date()): string {
  const seconds = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86_400) return `${Math.floor(seconds / 86_400)}d`;
  return shortDate.format(new Date(iso));
}

export interface ConversationGroup {
  label: string;
  items: ConversationSummary[];
}

/** Groups conversations (already sorted newest first) into recency buckets. */
export function groupByRecency(conversations: ConversationSummary[], now = new Date()): ConversationGroup[] {
  const today = startOfDay(now);
  const buckets: ConversationGroup[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Previous 30 days", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conversation of conversations) {
    const day = startOfDay(new Date(conversation.updatedAt));
    const index = day >= today ? 0 : day >= today - DAY ? 1 : day >= today - 7 * DAY ? 2 : day >= today - 30 * DAY ? 3 : 4;
    buckets[index]!.items.push(conversation);
  }

  return buckets.filter((bucket) => bucket.items.length > 0);
}
