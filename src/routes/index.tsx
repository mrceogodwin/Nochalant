import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Wordmark } from "@/components/club/brand";
import { AgeSheet } from "@/components/club/sheets";
import { useClub } from "@/lib/club/store";

export const Route = createFileRoute("/")({ component: Welcome });

const press =
  "touch-manipulation relative inline-flex h-14 w-full select-none items-center justify-center rounded-full text-[17px] font-semibold tracking-tight transition-[transform,background-color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function Welcome() {
  const ageOk = useClub((state) => state.ageOk);
  const [open, setOpen] = useState(false);

  const enter = (
    <>
      Enter the Club
      <ArrowRight className="absolute right-5 size-5" strokeWidth={2.25} />
    </>
  );

  return (
    <main className="mx-auto flex h-full w-full max-w-md flex-col overflow-hidden bg-black text-white">
      <header className="pt-safe flex shrink-0 flex-col items-center px-5">
        <img src="/welcome-mark-n.jpg" alt="" className="h-[4.75rem] w-auto" />
        <Wordmark className="text-[2.15rem]" />
        <p className="mt-2 text-center text-[15px] font-light tracking-wide text-[#c8c8ce]">
          Your people. Your scene. Your rules.
        </p>
        <img src="/welcome-pills.jpg" alt="" className="mt-3 h-12 w-auto" />
      </header>
      <div className="relative min-h-0 flex-1">
        <img src="/welcome-cast.jpg" alt="" className="absolute inset-x-0 top-0 w-full" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black to-transparent" />
      </div>
      <footer className="pb-safe relative z-10 shrink-0 px-5">
        {ageOk ? (
          <Link to="/join" className={`${press} bg-white text-black shadow-[0_12px_28px_rgba(0,0,0,0.45)] active:bg-neutral-200`}>
            {enter}
          </Link>
        ) : (
          <button
            type="button"
            className={`${press} bg-white text-black shadow-[0_12px_28px_rgba(0,0,0,0.45)] active:bg-neutral-200`}
            onClick={() => setOpen(true)}
          >
            {enter}
          </button>
        )}
        <Link
          to="/sign-in"
          className={`${press} mt-3 border-[1.5px] border-white/80 bg-black text-white active:bg-white/10`}
        >
          Sign In
        </Link>
        <p className="mt-3 mb-2 flex items-center justify-center gap-3 text-[13px] text-[#bdbdc4]">
          <span className="rounded-full border border-white/70 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white">
            18+
          </span>
          <span className="text-white/35">|</span>
          <span>Strictly for adults only.</span>
        </p>
      </footer>
      <AgeSheet open={open} onOpenChange={setOpen} />
    </main>
  );
}
