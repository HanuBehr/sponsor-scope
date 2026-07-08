"use client";

import { useFormStatus } from "react-dom";

export function RunDiscoveryButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? "Running discovery..." : "Run discovery"}
    </button>
  );
}
