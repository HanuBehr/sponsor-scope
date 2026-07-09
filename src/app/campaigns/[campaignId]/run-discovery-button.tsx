"use client";

import { useFormStatus } from "react-dom";

export function RunDiscoveryButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="w-full rounded bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
      {pending ? "Running discovery" : "Run discovery"}
    </button>
  );
}
