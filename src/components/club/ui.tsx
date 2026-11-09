import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const buttonClass =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-semibold transition active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper";

export function Button({
  variant = "solid",
  full,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "quiet";
  full?: boolean;
}) {
  return (
    <button
      className={cn(
        buttonClass,
        variant === "solid" && "bg-paper text-ink",
        variant === "ghost" && "border border-line bg-transparent text-fg",
        variant === "quiet" && "bg-elevated text-fg",
        full && "w-full",
        className,
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  to,
  variant = "solid",
  full,
  className,
  children,
}: {
  to: string;
  variant?: "solid" | "ghost" | "quiet";
  full?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        buttonClass,
        variant === "solid" && "bg-paper text-ink",
        variant === "ghost" && "border border-line bg-transparent text-fg",
        variant === "quiet" && "bg-elevated text-fg",
        full && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-secondary">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-2xl border border-line bg-card px-4 text-base text-fg outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-paper"
      />
    </label>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-secondary">{label}</span>
      <textarea
        {...props}
        className="min-h-24 w-full rounded-2xl border border-line bg-card px-4 py-3 text-base text-fg outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-paper"
      />
    </label>
  );
}
