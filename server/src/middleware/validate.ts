import type { z } from "zod";
import { HttpError } from "../utils/http-error.js";

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request";
    throw new HttpError(400, message, "VALIDATION_ERROR");
  }
  return result.data;
}
