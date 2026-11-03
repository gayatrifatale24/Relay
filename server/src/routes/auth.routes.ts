import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { User } from "../models/user.model.js";
import { parseBody } from "../middleware/validate.js";
import { getUserId, requireAuth } from "../middleware/require-auth.js";
import { clearAuthCookie, setAuthCookie, signToken } from "../services/token.service.js";
import { HttpError } from "../utils/http-error.js";

const BCRYPT_ROUNDS = 12;

const emailSchema = z.email("Enter a valid email address").trim().toLowerCase();

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

function toPublicUser(user: { _id: unknown; name: string; email: string; createdAt?: Date }) {
  return { id: String(user._id), name: user.name, email: user.email, createdAt: user.createdAt };
}

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const { name, email, password } = parseBody(signupSchema, req.body);

  if (await User.exists({ email })) {
    throw new HttpError(409, "An account with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash });
  const token = signToken(String(user._id));

  setAuthCookie(res, token);
  res.status(201).json({ user: toPublicUser(user) });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = parseBody(loginSchema, req.body);

  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !valid) {
    throw new HttpError(401, "Incorrect email or password", "INVALID_CREDENTIALS");
  }

  const token = signToken(String(user._id));
  setAuthCookie(res, token);
  res.json({ user: toPublicUser(user) });
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(getUserId(req));
  if (!user) throw new HttpError(401, "Account no longer exists", "UNAUTHENTICATED");
  res.json({ user: toPublicUser(user) });
});
