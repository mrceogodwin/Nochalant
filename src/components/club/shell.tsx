import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { ChevronLeft, Compass, House, Menu, MessageCircle, Plus, UserRound } from "lucide-react";
import { Collectible } from "@/components/club/objects";
import { useClub } from "@/lib/club/store";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/home", label: "Home", icon: House },
  { to: "/discover", label: "Discover", icon: Compass },
  { to: "/create", label: "Create", icon: Plus, create: true },
  { to: "/chats", label: "Chats", icon: MessageCircle },
  { to: "/my-club", label: "My Club", icon: UserRound },
] as const;

const more = [
  { to: "/table", label: "The Table" },
  { to: "/gifts", label: "Gifts" },
  { to: "/club-tokens", label: "Tokens" },
  { to: "/leaders", label: "Leaders" },
  { to: "/settings", label: "Settings" },
] as const;

const menuLinks = [
  { to: "/notifications", label: "Notifications" },
  { to: "/gifts", label: "Gifts" },
  { to: "/club-tokens", label: "Club Tokens" },
  { to: "/emoji", label: "Emoji" },
  { to: "/table", label: "The Table" },
  { to: "/challenges", label: "Challenges" },
  { to: "/settings", label: "Settings" },
] as const;

function screenTitle(path: string) {
  const named: Record<string, string> = {
    "/home": "Home",
    "/discover": "Discover",
    "/create": "Create",
    "/chats": "Chats",
    "/my-club": "My Club",
    "/rooms": "Rooms",
    "/groups": "Groups",
    "/squads": "Squads",
    "/experiments": "Experiments",
    "/gifts": "Gifts",
    "/emoji": "Emoji",
    "/settings": "Settings",
    "/notifications": "Notifications",
    "/club-tokens": "Tokens",
    "/table": "The Table",
    "/leaders": "Leaders",
    "/challenges": "Challenges",
    "/followers": "Followers",
    "/following": "Following",
    "/saved": "Saved",
    "/drafts": "Drafts",
    "/reposts": "Reposts",
    "/polls": "Polls",
    "/voice": "Voice",
    "/admin": "Desk",
  };
  if (named[path]) return named[path];
  if (path.startsWith("/people/")) return "Member";
  if (path.startsWith("/chats/")) return "Chat";
  if (path.startsWith("/rooms/")) return "Room";
  if (path.startsWith("/groups/")) return "Group";
  if (path.startsWith("/squads/")) return "Squad";
  if (path.startsWith("/experiments/")) return "Experiment";
  return "Nochalant";
}

function NavLink({
  to,
  label,
  icon: Icon,
  create,
  stacked,
}: {
  to: string;
  label: string;
  icon: typeof House;
  create?: boolean;
  stacked?: boolean;
}) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const active = path === to || (to !== "/home" && path.startsWith(to));
  if (create && !stacked) {
    return (
      <Link to={to} aria-label={label} className="flex flex-1 flex-col items-center justify-end">
        <span className="inline-flex size-14 -translate-y-5 items-center justify-center rounded-full bg-white text-black shadow-[0_12px_20px_rgba(0,0,0,0.55),inset_0_1px_0_#fff,inset_0_-3px_6px_rgba(0,0,0,0.16)] ring-4 ring-black active:scale-95">
          <Icon className="size-6" strokeWidth={2.2} />
        </span>
      </Link>
    );
  }
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition active:scale-[0.97]",
        stacked ? "w-full" : "h-12 flex-1 flex-col justify-center gap-0.5 text-[10px] font-medium tracking-wide",
        active ? "text-white" : "text-white/40",
        !stacked && active && "dock-tab",
        stacked && active && "bg-elevated text-fg",
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.25 : 1.7} />
      <span className={cn(stacked && "font-medium")}>{label}</span>
    </Link>
  );
}

function HeaderDock({
  title,
  kicker,
  back,
}: {
  title?: string;
  kicker?: string;
  back?: LinkProps["to"];
}) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const emoji = useClub((state) => state.emoji);
  const notifRead = useClub((state) => state.notifRead);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  return (
    <div className="pt-safe relative z-30 shrink-0 px-3 pb-1">
      <header className="dock-face relative rounded-[1.35rem]">
        <div className="flex min-h-14 items-center gap-2 px-2.5 py-1.5">
          {back ? (
            <Link
              to={back}
              aria-label="Back"
              className="inline-flex size-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 active:scale-95"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1 pl-1">
            {kicker ? <p className="truncate text-[11px] text-white/50">{kicker}</p> : null}
            <p className="truncate font-display text-[1.15rem] font-semibold leading-tight tracking-tight">
              {title || screenTitle(path)}
            </p>
          </div>
          <Link
            to="/my-club"
            aria-label="Your profile"
            className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-black shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_6px_12px_rgba(0,0,0,0.5)] ring-2 ring-white/80 active:scale-95"
          >
            <span className="w-14">
              <Collectible id={emoji} />
            </span>
          </Link>
          <Link to="/home" aria-label="Nochalant Club" className="shrink-0 active:scale-95">
            <img
              src="/brand-n.jpg"
              alt=""
              className="size-10 rounded-[22%] object-cover shadow-[0_8px_14px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/20"
            />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="relative inline-flex size-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 active:scale-95"
          >
            <Menu className="size-5" />
            {!notifRead ? <span className="absolute top-2 right-2 size-1.5 rounded-full bg-white" /> : null}
          </button>
        </div>
        {open ? (
          <nav className="dock-menu absolute top-[calc(100%+0.45rem)] right-0 z-40 w-56 overflow-hidden rounded-2xl py-1">
            {menuLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between px-4 py-3 text-sm active:bg-white/10"
              >
                {item.label}
                {item.to === "/notifications" && !notifRead ? <span className="size-1.5 rounded-full bg-white" /> : null}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
    </div>
  );
}

export function ClubFrame({
  children,
  rail,
  tabs: showTabs = true,
  title,
  kicker,
  back,
  scroll = true,
}: {
  children: ReactNode;
  rail?: ReactNode;
  tabs?: boolean;
  title?: string;
  kicker?: string;
  back?: LinkProps["to"];
  scroll?: boolean;
}) {
  return (
    <div className="h-full overflow-hidden bg-bg text-fg">
      <div className="mx-auto grid h-full w-full max-w-6xl grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)] lg:grid-cols-[15rem_minmax(0,32rem)_minmax(0,18rem)]">
        <aside className="hidden overflow-y-auto border-r border-line px-4 py-6 md:block">
          <Link to="/home" className="mb-8 flex items-center gap-3" aria-label="Nochalant Club home">
            <img src="/brand-n.jpg" alt="" className="size-11 rounded-[22%] object-cover shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
            <span className="font-display text-lg font-semibold tracking-tight">Nochalant</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {tabs.map((tab) => (
              <NavLink key={tab.to} {...tab} stacked />
            ))}
          </nav>
          <div className="mt-6 border-t border-line pt-4">
            {more.map((item) => (
              <Link key={item.to} to={item.to} className="block rounded-2xl px-3 py-2 text-sm text-secondary hover:bg-elevated hover:text-fg">
                {item.label}
              </Link>
            ))}
          </div>
        </aside>
        <div className="relative mx-auto flex h-full min-h-0 w-full min-w-0 max-w-lg flex-col overflow-hidden border-line md:border-x">
          <HeaderDock title={title} kicker={kicker} back={back} />
          <div className={cn("min-h-0 w-full min-w-0 flex-1", scroll ? "app-scroll" : "overflow-hidden")}>{children}</div>
          {showTabs ? (
            <div className="pb-safe shrink-0 md:hidden">
              <nav className="dock-bar relative mx-3 mb-1 flex h-[4.5rem] items-end rounded-[1.85rem] px-1.5 pb-1.5">
                {tabs.map((tab) => (
                  <NavLink key={tab.to} {...tab} />
                ))}
              </nav>
            </div>
          ) : null}
        </div>
        <aside className="hidden overflow-y-auto px-5 py-6 lg:block">{rail}</aside>
      </div>
    </div>
  );
}
