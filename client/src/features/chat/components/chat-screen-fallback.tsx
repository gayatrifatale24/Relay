import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/ui/logo";
import { TranscriptSkeleton } from "./transcript-skeleton";

/** Static shell shown while the chat route resolves its URL params on first load. */
export function ChatScreenFallback() {
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <aside className="hidden w-[272px] shrink-0 flex-col border-r border-line lg:flex">
        <div className="flex h-14 items-center px-4">
          <Logo />
        </div>
        <div className="space-y-2 px-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Skeleton className="h-3.5 w-40" />
        </div>
        <TranscriptSkeleton />
      </main>
    </div>
  );
}
