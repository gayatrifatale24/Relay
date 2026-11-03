"use client";

import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useViewKey } from "../hooks/use-view-key";
import { ChatShell } from "./chat-shell";
import { ChatView } from "./chat-view";

/**
 * Lives in the /chat layout so the shell and view persist across /chat and /chat/[id].
 * The view only remounts (with a short cross-fade) when the user switches conversations.
 */
export function ChatScreen() {
  const conversationId = useParams<{ conversationId?: string }>().conversationId;
  const router = useRouter();
  const { key, adopt } = useViewKey(conversationId);

  const onCreated = (id: string) => {
    adopt(id);
    router.replace(`/chat/${id}`, { scroll: false });
  };

  return (
    <ChatShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
          transition={{ duration: 0.18, ease: [0.2, 0, 0, 1] }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <ChatView conversationId={conversationId} onCreated={onCreated} />
        </motion.div>
      </AnimatePresence>
    </ChatShell>
  );
}
