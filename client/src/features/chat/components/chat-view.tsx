"use client";

import { useRef } from "react";
import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiError, getErrorMessage } from "@/lib/api/client";
import { useSession } from "@/features/auth/hooks/use-auth";
import { useChat } from "../hooks/use-chat";
import { ChatHeader } from "./chat-header";
import { Composer, type ComposerHandle } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageList } from "./message-list";
import { TranscriptSkeleton } from "./transcript-skeleton";

interface ChatViewProps {
  conversationId?: string;
  onCreated: (id: string) => void;
}

function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const notFound = error instanceof ApiError && error.status === 404;
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <CircleAlert className="mx-auto size-6 text-faint" />
        <h2 className="mt-3 text-[15px] font-medium text-ink">
          {notFound ? "Conversation not found" : "Couldn't load this conversation"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {notFound ? "It may have been deleted, or it belongs to another account." : getErrorMessage(error)}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {!notFound && <Button onClick={onRetry}>Try again</Button>}
          <Link
            href="/chat"
            className="inline-flex h-9 items-center rounded-md bg-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
          >
            New conversation
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ChatView({ conversationId, onCreated }: ChatViewProps) {
  const { data: user } = useSession();
  const composerRef = useRef<ComposerHandle>(null);
  const chat = useChat(conversationId, {
    onCreated,
    onRestore: (content) => composerRef.current?.setValue(content),
  });
  const { conversation } = chat;

  const loading = Boolean(conversationId) && conversation.isPending;
  const failed = Boolean(conversationId) && conversation.isError;
  const empty = !conversationId && chat.messages.length === 0 && !chat.pending;
  const title = conversationId ? (conversation.data?.title ?? (failed ? "Conversation" : null)) : "New conversation";

  const editFailed = () => composerRef.current?.setValue(chat.discard());

  return (
    <>
      <ChatHeader title={title} />
      {loading ? (
        <TranscriptSkeleton />
      ) : failed ? (
        <LoadError error={conversation.error} onRetry={() => conversation.refetch()} />
      ) : empty ? (
        <EmptyState name={user?.name} onSelect={chat.send} disabled={chat.isBusy} />
      ) : (
        <MessageList
          messages={chat.messages}
          pending={chat.pending}
          settledIds={chat.settledIds}
          onRetry={chat.retry}
          onDiscard={editFailed}
        />
      )}
      {!failed && (
        <Composer
          ref={composerRef}
          onSend={chat.send}
          onStop={chat.isBusy ? chat.stop : undefined}
          disabled={chat.isBusy || loading}
        />
      )}
    </>
  );
}
