import { Skeleton } from "@/components/ui/skeleton";

export function TranscriptSkeleton() {
  return (
    <div className="flex-1 overflow-hidden" aria-busy="true" aria-label="Loading conversation">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pt-6 sm:px-6">
        <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
        <div className="flex gap-3">
          <Skeleton className="size-7 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-3/5" />
          </div>
        </div>
        <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
      </div>
    </div>
  );
}
