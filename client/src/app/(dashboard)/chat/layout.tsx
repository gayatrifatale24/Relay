import type { Metadata } from "next";
import { Suspense } from "react";
import { ChatScreen } from "@/features/chat/components/chat-screen";
import { ChatScreenFallback } from "@/features/chat/components/chat-screen-fallback";

export const metadata: Metadata = { title: "Support" };

// The chat UI is rendered by the layout so it persists between conversations;
// the route pages only define the URLs.
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<ChatScreenFallback />}>
        <ChatScreen />
      </Suspense>
      {children}
    </>
  );
}
