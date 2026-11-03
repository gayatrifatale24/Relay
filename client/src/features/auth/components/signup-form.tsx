"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { getErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";
import { useSignup } from "../hooks/use-auth";
import { useFormState } from "../hooks/use-form-state";
import { passwordStrength, validateSignup } from "../validations/auth.validation";
import { FormAlert } from "./form-alert";

const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

function PasswordMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-subtle">
            <motion.div
              className={cn("h-full rounded-full", score >= 3 ? "bg-accent" : "bg-faint")}
              initial={false}
              animate={{ width: index < score ? "100%" : "0%" }}
              transition={{ duration: 0.2 }}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-faint">
        {password ? STRENGTH_LABELS[score] : "8+ characters with a letter and a number"}
      </p>
    </div>
  );
}

export function SignupForm() {
  const signup = useSignup();
  const { values, field, trySubmit } = useFormState({ name: "", email: "", password: "" }, validateSignup);

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (signup.isPending || !trySubmit()) return;
    signup.mutate({ name: values.name.trim(), email: values.email.trim(), password: values.password });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <FormAlert message={signup.isError ? getErrorMessage(signup.error) : null} />
      <TextField label="Full name" autoComplete="name" placeholder="Ada Lovelace" autoFocus {...field("name")} />
      <TextField label="Work email" type="email" autoComplete="email" placeholder="you@company.com" {...field("email")} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={<PasswordMeter password={values.password} />}
        {...field("password")}
      />
      <Button type="submit" variant="primary" size="lg" loading={signup.isPending} className="w-full justify-center">
        {signup.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
