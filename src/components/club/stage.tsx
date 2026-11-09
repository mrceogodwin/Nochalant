import type { ReactNode } from "react";
import { BackLink, Steps } from "@/components/club/brand";

export function Stage({
  step,
  back,
  kicker,
  title,
  subtitle,
  children,
  footer,
}: {
  step?: number;
  back?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-bg text-fg">
      <header className="pt-safe flex items-center gap-3 px-5">
        {back ? <BackLink to={back} /> : <span className="size-11" />}
        {step ? <Steps step={step} /> : <span className="flex-1" />}
      </header>
      <div className="px-5 pt-6">
        {kicker ? <p className="font-serif text-xl italic text-secondary">{kicker}</p> : null}
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-3 text-base text-secondary">{subtitle}</p> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-6">{children}</div>
      {footer ? <div className="pb-safe shrink-0 border-t border-line/70 px-5 pt-3">{footer}</div> : null}
    </main>
  );
}
