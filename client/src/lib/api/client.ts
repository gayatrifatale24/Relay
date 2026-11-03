import axios, { AxiosError } from "axios";

/**
 * Browser requests go to `/api/*` on the Next.js origin, which rewrites them to the
 * Express server. The auth cookie therefore stays first-party, HttpOnly and SameSite.
 */
export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorBody {
  error?: { message?: string; code?: string };
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError) {
      if (!error.response) {
        const timedOut = error.code === AxiosError.ECONNABORTED;
        return Promise.reject(
          new ApiError(
            timedOut ? "The request timed out. Please try again." : "Can't reach the server. Check your connection.",
            0,
            timedOut ? "TIMEOUT" : "NETWORK",
          ),
        );
      }
      const body = error.response.data as ErrorBody | undefined;
      return Promise.reject(
        new ApiError(
          body?.error?.message ?? "Something went wrong. Please try again.",
          error.response.status,
          body?.error?.code,
        ),
      );
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
