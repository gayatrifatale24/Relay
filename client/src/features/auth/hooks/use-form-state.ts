"use client";

import { useState } from "react";
import { hasErrors, type FieldErrors } from "../validations/auth.validation";

/**
 * Controlled form values with validation that starts after the first submit attempt,
 * so users are not shown errors before they have finished typing.
 */
export function useFormState<T extends object>(initial: T, validate: (values: T) => FieldErrors<T>) {
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const errors: FieldErrors<T> = submitted ? validate(values) : {};

  const field = (name: keyof T & string) => ({
    name,
    value: String(values[name] ?? ""),
    error: errors[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
  });

  /** Returns true when the values are valid and the submit should proceed. */
  const trySubmit = () => {
    setSubmitted(true);
    return !hasErrors(validate(values));
  };

  return { values, field, trySubmit };
}
