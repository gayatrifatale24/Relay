"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api/client";
import { useLogin } from "../hooks/use-auth";
import { useFormState } from "../hooks/use-form-state";
import { validateLogin } from "../validations/auth.validation";
import { FormAlert } from "./form-alert";

export function LoginForm() {
  const next = useSearchParams().get("next");
  const login = useLogin(next);
  const { values, field, trySubmit } = useFormState({ email: "", password: "" }, validateLogin);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (login.isPending || !trySubmit()) return;
    login.mutate({ email: values.email.trim(), password: values.password });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={login.isError ? getErrorMessage(login.error) : null} />
      <TextField label="Email" type="email" autoComplete="email" placeholder="you@company.com" autoFocus {...field("email")} />
      <TextField label="Password" type="password" autoComplete="current-password" {...field("password")} />
      <Button type="submit" variant="primary" size="lg" loading={login.isPending} className="w-full justify-center">
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-[13px] text-muted">
        New to Relay?{" "}
        <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
