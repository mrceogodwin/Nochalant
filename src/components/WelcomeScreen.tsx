"use client";

import Link from "next/link";

export function WelcomeScreen() {
  return (
    <main className="relative min-h-svh w-full bg-black text-white flex flex-col items-center overflow-hidden">
      {/* Red ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-[140%] bg-red-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6 pt-12 pb-8 flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-2 flex flex-col items-center">
          <svg className="h-10 w-10 text-red-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9 8H5l3.5 3-1.5 5L12 14l5 2-1.5-5L19 8h-4L12 2z" />
          </svg>
          <h1 className="mt-1 text-5xl font-black tracking-tight leading-none">Nochalant</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs font-bold tracking-[0.3em] uppercase">CLUB</span>
          </div>
          <div className="mt-1 h-0.5 w-16 bg-red-600 rounded-full" />
        </div>

        <p className="mt-6 text-xs font-bold tracking-widest text-red-500 uppercase">
          AN INDEPENDENT SOCIAL CLUB · 18+
        </p>

        <h2 className="mt-6 text-5xl font-black leading-tight">
          welcome to<br />
          <span className="text-white">the </span>
          <span className="relative inline-block text-red-600">
            club
            <span className="absolute -bottom-1 left-0 right-0 h-1 bg-red-600 rounded-full" />
          </span>
        </h2>

        <p className="mt-4 text-sm text-white/70">
          Your people. Your scene. Your rules.
        </p>

        {/* Playing cards fan */}
        <div className="relative mt-10 h-56 w-full max-w-xs">
          <div className="absolute inset-0 flex items-end justify-center">
            {/* Card 1 - left diamond */}
            <div className="absolute -rotate-12 origin-bottom translate-x-[-80px] translate-y-2 w-20 h-28 bg-white rounded-xl shadow-lg shadow-red-500/30 border border-white/20 flex items-center justify-center">
              <div className="w-6 h-6 bg-red-600 rotate-45" />
            </div>
            {/* Card 2 - triangle */}
            <div className="absolute -rotate-6 origin-bottom translate-x-[-40px] translate-y-1 w-20 h-28 bg-white rounded-xl shadow-lg shadow-red-500/30 border border-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[20px] border-l-transparent border-r-transparent border-b-red-600" />
            </div>
            {/* Card 3 - center King of Spades */}
            <div className="absolute z-10 w-24 h-36 bg-white rounded-xl shadow-2xl shadow-red-600/40 border-2 border-red-500/50 flex flex-col items-center justify-between p-2">
              <div className="self-start text-red-600 font-black text-lg">K</div>
              <div className="flex flex-col items-center">
                <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8 6 4 10 4 14c0 3 2 6 8 8 6-2 8-5 8-8 0-4-4-8-8-12z" />
                </svg>
                <svg className="w-4 h-4 text-red-600 -mt-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9 8H5l3.5 3-1.5 5L12 14l5 2-1.5-5L19 8h-4L12 2z" />
                </svg>
              </div>
              <div className="self-end text-red-600 font-black text-lg rotate-180">K</div>
            </div>
            {/* Card 4 - plus */}
            <div className="absolute rotate-6 origin-bottom translate-x-[40px] translate-y-1 w-20 h-28 bg-white rounded-xl shadow-lg shadow-red-500/30 border border-white/20 flex items-center justify-center">
              <div className="relative w-6 h-6">
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-1.5 h-6 bg-red-600" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 h-1.5 w-6 bg-red-600" />
              </div>
            </div>
            {/* Card 5 - right squares */}
            <div className="absolute rotate-12 origin-bottom translate-x-[80px] translate-y-2 w-20 h-28 bg-white rounded-xl shadow-lg shadow-red-500/30 border border-white/20 flex flex-col items-center justify-center gap-1">
              <div className="w-4 h-3 bg-red-600 rounded-sm" />
              <div className="w-4 h-3 bg-red-600 rounded-sm" />
            </div>
          </div>
          {/* Bottom red glow under cards */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-red-600/40 blur-xl rounded-full" />
        </div>

        {/* Buttons */}
        <div className="mt-8 w-full space-y-3">
          <Link
            href="/join"
            className="flex items-center justify-center w-full h-14 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-600/30 transition-colors"
          >
            Enter the Club →
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center justify-center w-full h-14 bg-zinc-900/80 border border-zinc-700 text-white font-semibold rounded-2xl hover:bg-zinc-800 transition-colors"
          >
            Already a member? <span className="ml-1 underline underline-offset-2">Sign in</span>
          </Link>
        </div>

        <p className="mt-8 text-xs text-white/50">
          18+ only · Respect the people. Respect the scene.
        </p>
        <p className="mt-1 text-[10px] tracking-widest text-white/30 uppercase">
          NOCHALANT CLUB
        </p>
      </div>
    </main>
  );
}
