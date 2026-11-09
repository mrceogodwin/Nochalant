import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <img
      src="/brand-n.jpg"
      alt=""
      className={cn("size-16 rounded-[22%] object-cover shadow-[0_10px_24px_rgba(0,0,0,0.45)]", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <p className={cn("text-center font-display text-4xl leading-none tracking-tight", className)}>
      <span className="font-extrabold italic text-fg">Nochalant</span>{" "}
      <span className="relative inline-block font-medium text-secondary">
        Club
        <svg viewBox="0 0 86 12" className="absolute -bottom-1 left-0 h-2 w-full" aria-hidden>
          <path
            d="M2 8C22 2 52 2 84 7"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </p>
  );
}

export function Steps({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <div className="flex flex-1 gap-1" aria-label={`Step ${step} of ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn("h-1 flex-1 rounded-full", index < step ? "bg-paper" : "bg-line")}
        />
      ))}
    </div>
  );
}

export function BackLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      aria-label="Back"
      className="inline-flex size-11 items-center justify-center rounded-full border border-line text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M15 6 9 12l6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
