import type { ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

const FALLBACK_MESSAGE = "An unexpected error occurred. Try reloading the page.";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return FALLBACK_MESSAGE;
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-3 bg-bg px-6 text-center text-fg">
      <span className="text-paper" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={1.6} />
      </span>
      <h1 className="font-display text-2xl font-semibold">The room hit a snag</h1>
      <p className="max-w-md text-sm break-words text-secondary">{errorMessage(error)}</p>
    </main>
  );
}
