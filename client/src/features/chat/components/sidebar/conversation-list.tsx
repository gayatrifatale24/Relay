"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { useConversations, useDeleteConversation } from "../../hooks/use-conversations";
import type { ConversationSummary } from "../../types/chat.types";
import { groupByRecency } from "../../utils/date";

interface ConversationListProps {
  query: string;
  onNavigate?: () => void;
}

function ListSkeleton() {
  return (
    <div className="space-y-1 px-1 pt-2" aria-busy="true" aria-label="Loading conversations">
      <Skeleton className="mb-3 h-3 w-14" />
      {["w-4/5", "w-3/5", "w-11/12", "w-2/3", "w-3/4"].map((width) => (
        <div key={width} className="flex h-8 items-center px-2">
          <Skeleton className={cn("h-3", width)} />
        </div>
      ))}
    </div>
  );
}

function ListMessage({ title, body }: { title: string; body?: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 py-8 text-center">
      <MessageSquare className="mx-auto size-5 text-faint" />
      <p className="mt-2 text-[13px] font-medium text-muted">{title}</p>
      {body && <p className="mt-1 text-xs text-faint">{body}</p>}
    </motion.div>
  );
}

export function ConversationList({ query, onNavigate }: ConversationListProps) {
  const { data, isPending, isError, error, refetch } = useConversations();
  const activeId = useParams<{ conversationId?: string }>().conversationId;
  const router = useRouter();
  const remove = useDeleteConversation();
  const [toDelete, setToDelete] = useState<ConversationSummary | null>(null);

  const groups = useMemo(() => {
    // Grouping reads the current time, so only run it once data exists (never during prerender).
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? data.filter((item) => item.title.toLowerCase().includes(needle) || item.preview.toLowerCase().includes(needle))
      : data;
    return groupByRecency(filtered);
  }, [data, query]);

  if (isPending) return <ListSkeleton />;

  if (isError) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="text-[13px] text-muted">{getErrorMessage(error)}</p>
        <Button size="sm" className="mt-3" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return <ListMessage title="No conversations yet" body="Your conversations will appear here." />;
  }

  if (groups.length === 0) {
    return <ListMessage title="No matches" body={`Nothing found for “${query.trim()}”.`} />;
  }

  const confirmDelete = () => {
    if (!toDelete) return;
    const deletingActive = toDelete.id === activeId;
    remove.mutate(toDelete.id, {
      onSuccess: () => {
        setToDelete(null);
        if (deletingActive) router.replace("/chat");
      },
    });
  };

  return (
    <>
      <LayoutGroup>
        {groups.map((group) => (
          <motion.section key={group.label} layout="position" className="mb-3">
            <h3 className="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">
              {group.label}
            </h3>
            <ul className="space-y-px">
              <AnimatePresence initial={false}>
                {group.items.map((conversation) => {
                  const active = conversation.id === activeId;
                  return (
                    <motion.li
                      key={conversation.id}
                      layout="position"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
                      className="group relative"
                    >
                      {active && (
                        <motion.span
                          layoutId="active-conversation"
                          className="absolute inset-0 rounded-md bg-hover"
                          transition={{ type: "spring", stiffness: 500, damping: 40 }}
                        />
                      )}
                      <Link
                        href={`/chat/${conversation.id}`}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={conversation.title}
                        className={cn(
                          "relative flex h-8 items-center rounded-md pl-2.5 pr-8 text-[13px] transition-colors duration-150",
                          active ? "font-medium text-ink" : "text-muted hover:bg-hover/70 hover:text-ink",
                        )}
                      >
                        <span className="truncate">{conversation.title}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(conversation)}
                        aria-label={`Delete “${conversation.title}”`}
                        className="absolute right-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-faint opacity-0 transition-opacity duration-150 hover:bg-line hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </motion.section>
        ))}
      </LayoutGroup>

      <Dialog
        open={toDelete !== null}
        onClose={() => !remove.isPending && setToDelete(null)}
        title="Delete conversation?"
        description={toDelete ? `“${toDelete.title}” and all of its messages will be permanently deleted.` : undefined}
      >
        {remove.isError && <p className="mb-3 text-[13px] text-danger">{getErrorMessage(remove.error)}</p>}
        <div className="flex justify-end gap-2">
          <Button onClick={() => setToDelete(null)} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete} loading={remove.isPending}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}
