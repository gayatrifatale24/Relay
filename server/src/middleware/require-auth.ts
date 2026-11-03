import type { NextFunction, Request, Response } from "express";
import { AUTH_COOKIE, verifyToken } from "../services/token.service.js";
import { HttpError } from "../utils/http-error.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

/** Accepts the HttpOnly cookie (browser) or a Bearer token (API clients). */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token: string | undefined = req.cookies?.[AUTH_COOKIE] ?? bearer;

  if (!token) {
    throw new HttpError(401, "Authentication required", "UNAUTHENTICATED");
  }

  try {
    req.userId = verifyToken(token).sub;
  } catch {
    throw new HttpError(401, "Session expired, please sign in again", "UNAUTHENTICATED");
  }
  next();
}

export function getUserId(req: Request): string {
  if (!req.userId) throw new HttpError(401, "Authentication required", "UNAUTHENTICATED");
  return req.userId;
}
