import type { LoginInput, SignupInput } from "../types/auth.types";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Mirrors the server rules so users see the same feedback before submitting.
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required";
  if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address";
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Use at least 8 characters";
  if (password.length > 72) return "Use at most 72 characters";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "Include at least one letter and one number";
}

export function validateLogin(input: LoginInput): FieldErrors<LoginInput> {
  return {
    email: validateEmail(input.email),
    password: input.password ? undefined : "Password is required",
  };
}

export function validateSignup(input: SignupInput): FieldErrors<SignupInput> {
  const name = input.name.trim();
  return {
    name: !name ? "Name is required" : name.length < 2 ? "Name must be at least 2 characters" : undefined,
    email: validateEmail(input.email),
    password: validateNewPassword(input.password),
  };
}

export function hasErrors<T>(errors: FieldErrors<T>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Lightweight strength score (0–4) used for the signup meter. */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Za-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || /(?=.*[a-z])(?=.*[A-Z])/.test(password)) score++;
  return score;
}
