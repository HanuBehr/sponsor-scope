"use client";

import { useFormStatus } from "react-dom";

export function DetectSignalsButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className="rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
      {pending ? "Detecting..." : "Detect sponsor signals"}
    </button>
  );
}
