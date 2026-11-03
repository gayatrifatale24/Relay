"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { ApiError, apiClient, isUnauthorized } from "@/lib/api/client";

// Installed by AppProviders once the router is available.
let handleError: (error: unknown) => void = () => undefined;

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({ onError: (error) => handleError(error) }),
    mutationCache: new MutationCache({ onError: (error) => handleError(error) }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Retry transient failures only; client errors will not fix themselves.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(createQueryClient);

  // A 401 from a protected endpoint means the session is gone: clear the cookie and go to login.
  useEffect(() => {
    let redirecting = false;
    handleError = (error) => {
      const path = window.location.pathname;
      if (!isUnauthorized(error) || redirecting || !path.startsWith("/chat")) return;
      redirecting = true;
      void apiClient
        .post("/auth/logout")
        .catch(() => undefined)
        // Cached data is cleared by the auth pages once they mount (see ResetClientState).
        .finally(() => {
          router.replace(`/login?next=${encodeURIComponent(path)}`);
          redirecting = false;
        });
    };
    return () => {
      handleError = () => undefined;
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </QueryClientProvider>
  );
}
