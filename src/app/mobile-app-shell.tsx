"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, MessageCircle, UserRound, Bookmark } from "lucide-react";

const destinations = [
  { href: "/club", label: "Home", Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/club/create", label: "Create", Icon: Plus, primary: true },
  { href: "/chats", label: "Chats", Icon: MessageCircle },
  { href: "/my-club", label: "My Club", Icon: UserRound },
];

const appRoots = ["/club", "/discover", "/chats", "/my-club", "/scenes", "/squads", "/listening-room", "/notifications", "/drafts"];

export function MobileAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavigation = appRoots.some((root) => pathname === root || pathname.startsWith(root + "/"));
  if (!showNavigation) return <>{children}</>;
  const title = pathname.startsWith("/discover") ? "Discover" : pathname.startsWith("/chats") ? "Chats" : pathname.startsWith("/my-club") ? "My Club" : pathname.startsWith("/scenes") ? "Scenes" : pathname.startsWith("/squads") ? "Squads" : pathname.startsWith("/listening-room") ? "Listening Room" : pathname.startsWith("/notifications") ? "Notifications" : pathname.startsWith("/drafts") ? "Offline drafts" : "Nochalant Club";
  return <div className="mobile-app-frame">
    <header className="native-top-dock">
      <Link href="/club" className="native-wordmark" aria-label="Nochalant Club home">NOCHALANT<span>CLUB</span></Link>
      <div className="native-top-title">{title}</div>
      <div className="native-header-actions"><Link href="/drafts" className="native-notification" aria-label="Offline drafts"><Bookmark size={17}/></Link><Link href="/notifications" className="native-notification" aria-label="Notifications">♧</Link></div>
    </header>
    <div className="native-screen-content">{children}</div>
    <nav className="native-bottom-dock" aria-label="Main navigation">
      {destinations.map(({ href, label, Icon, primary }) => {
        const active = href === "/club" ? pathname === "/club" : href === "/discover" ? pathname.startsWith("/discover") || pathname.startsWith("/scenes") || pathname.startsWith("/squads") : href === "/chats" ? pathname.startsWith("/chats") : href === "/my-club" ? pathname.startsWith("/my-club") : false;
        return <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={primary ? "native-tab native-create" : active ? "native-tab active" : "native-tab"}>
          <Icon size={primary ? 23 : 20} strokeWidth={active ? 2.5 : 1.8}/><span>{label}</span>
        </Link>;
      })}
    </nav>
  </div>;
}
