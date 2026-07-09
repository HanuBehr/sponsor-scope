"use client";

import { useFormStatus } from "react-dom";

export function DetectSignalsButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="w-full rounded px-3 py-2 text-sm text-primary ring-1 ring-primary/40 hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
      {pending ? "Detecting" : "Detect sponsor signals"}
    </button>
  );
}
