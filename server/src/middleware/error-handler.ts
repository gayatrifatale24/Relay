import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/http-error.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code } });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({ error: { message: "Resource not found", code: "NOT_FOUND" } });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { message: "Malformed JSON body", code: "BAD_JSON" } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { message: "Something went wrong", code: "INTERNAL" } });
}
