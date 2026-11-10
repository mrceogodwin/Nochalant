"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Bell, ChevronLeft, Compass, Home, MessageCircle, Plus, UserRound } from "lucide-react";
import type { ReactNode } from "react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-[42px]" : size === "sm" ? "text-[22px]" : "text-[28px]";
  return (
    <div className="relative inline-flex flex-col items-center leading-none">
      <svg viewBox="0 0 24 18" className="absolute -right-2 -top-2 h-3.5 w-4 text-[#e10600]" aria-hidden>
        <path d="M2 16 6 4l4 6 2-8 2 8 4-6 4 12H2z" fill="currentColor" />
      </svg>
      <span className={`${text} font-black italic tracking-tight text-white`}>Nochalant</span>
      <span className="mt-1 h-[3px] w-[58%] rounded-full bg-[#ff7a00]" />
    </div>
  );
}

export function PrimaryButton({
  children,
  pending = false,
  type = "submit",
}: {
  children: ReactNode;
  pending?: boolean;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      disabled={pending}
      className="orange-fill relative flex h-14 w-full items-center justify-center rounded-full text-[17px] font-extrabold shadow-[0_12px_30px_rgba(255,90,0,0.28)] disabled:opacity-70"
    >
      {pending ? "Please wait…" : children}
      <span className="absolute right-1.5 grid h-11 w-11 place-items-center rounded-full bg-black text-white">
        <ArrowRight size={18} />
      </span>
    </button>
  );
}

export function GhostButton({ children, href }: { children: ReactNode; href?: string }) {
  const className =
    "flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/[0.03] text-[17px] font-bold text-white";
  if (href) return <Link href={href} className={className}>{children}</Link>;
  return <button className={className}>{children}</button>;
}

export function BackHeader({ back = "/home", right }: { back?: string; right?: ReactNode }) {
  return (
    <header className="grid grid-cols-[40px_1fr_40px] items-center px-3 pt-4">
      <Link href={back} className="grid h-10 w-10 place-items-center text-white" aria-label="Back">
        <ChevronLeft />
      </Link>
      <div className="flex justify-center">
        <Logo size="sm" />
      </div>
      <div className="flex justify-end">{right}</div>
    </header>
  );
}

export function AppNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return <BottomNav pathname={pathname} unread={unread} />;
}

export function BottomNav({ pathname, unread }: { pathname: string; unread: number }) {
  const items = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/discover", label: "Discover", icon: Compass },
    { href: "/create", label: "Create", icon: Plus, center: true },
    { href: "/chats", label: "Chats", icon: MessageCircle, badge: unread },
    { href: "/profile", label: "Profile", icon: UserRound },
  ];
  return (
    <nav className="fixed bottom-0 left-1/2 z-30 w-[min(430px,100%)] -translate-x-1/2 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
      <div className="grid grid-cols-5 items-end rounded-3xl bg-black/80 px-1 py-2 backdrop-blur">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          if (item.center) {
            return (
              <Link key={item.href} href={item.href} className="flex -mt-6 flex-col items-center gap-1 text-[11px] font-semibold text-zinc-300">
                <span className="orange-fill grid h-14 w-14 place-items-center rounded-full text-black shadow-[0_8px_24px_rgba(255,100,0,0.45)]">
                  <Plus strokeWidth={2.6} />
                </span>
                {item.label}
              </Link>
            );
          }
          return (
            <Link key={item.href} href={item.href} className={`relative flex flex-col items-center gap-1 text-[11px] font-semibold ${active ? "text-[#ff7a00]" : "text-zinc-400"}`}>
              <Icon size={22} />
              {item.label}
              {item.badge ? (
                <span className="absolute right-3 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-[#ff3b30] px-1 text-[10px] font-bold text-white">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function NotifyButton({ href = "/notifications", dot = false }: { href?: string; dot?: boolean }) {
  return (
    <Link href={href} className="relative grid h-10 w-10 place-items-center text-white" aria-label="Notifications">
      <Bell size={22} />
      {dot ? <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#ff3b30]" /> : null}
    </Link>
  );
}

export function SectionTitle({ title, href, hot = false }: { title: string; href?: string; hot?: boolean }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-xl font-extrabold">
        {title} {hot ? <span aria-hidden>🔥</span> : null}
      </h2>
      {href ? (
        <Link href={href} className="text-sm font-semibold text-[#ff7a00]">
          See All ›
        </Link>
      ) : null}
    </div>
  );
}
