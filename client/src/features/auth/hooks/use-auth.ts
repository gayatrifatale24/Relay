"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/auth.service";
import type { LoginInput, SignupInput, User } from "../types/auth.types";

export const sessionKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: authService.me,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Only follow same-origin, in-app redirect targets. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/chat") ? next : "/chat";
}

function useAuthSuccess() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return (user: User, next: string | null) => {
    queryClient.setQueryData(sessionKey, user);
    router.replace(safeNext(next));
  };
}

export function useLogin(next: string | null) {
  const onSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (user) => onSuccess(user, next),
  });
}

export function useSignup() {
  const onSuccess = useAuthSuccess();
  return useMutation({
    mutationFn: (input: SignupInput) => authService.signup(input),
    onSuccess: (user) => onSuccess(user, null),
  });
}

/** Cached data is cleared by the auth pages once they mount (see ResetClientState). */
export function useLogout() {
  const router = useRouter();
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => router.replace("/login"),
  });
}
