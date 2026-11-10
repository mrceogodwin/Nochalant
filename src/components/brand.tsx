import { SUPPORT_EMAIL } from "@/lib/catalog";

const LOOKS: Record<
  string,
  { bg: string; bg2: string; skin: string; hair: string; style: "afro" | "short" | "long" | "puff"; shades?: string; phones?: boolean; beard?: boolean }
> = {
  godwin: { bg: "#3a2418", bg2: "#120c09", skin: "#8d5a3b", hair: "#1a120e", style: "short", shades: "#111", phones: true, beard: true },
  tiana: { bg: "#4a1d55", bg2: "#140810", skin: "#6b3a2a", hair: "#140e0c", style: "afro" },
  deekay: { bg: "#3a2a14", bg2: "#120e08", skin: "#7a4a30", hair: "#120e0c", style: "short", shades: "#111", phones: true },
  amara: { bg: "#4a1820", bg2: "#14080c", skin: "#6d4030", hair: "#1a1010", style: "long" },
  khalz: { bg: "#1d2438", bg2: "#0c1018", skin: "#a56b45", hair: "#111", style: "short" },
  movieplug: { bg: "#2a1848", bg2: "#100818", skin: "#7a5138", hair: "#161016", style: "short", shades: "#5b2dff" },
  vibequeen: { bg: "#4a1840", bg2: "#180814", skin: "#8a5340", hair: "#1a1014", style: "puff" },
  naijagist: { bg: "#143024", bg2: "#08140e", skin: "#6e4632", hair: "#101410", style: "short" },
  kingflex: { bg: "#3a220e", bg2: "#140c06", skin: "#9a6240", hair: "#16100c", style: "short", phones: true },
  sade: { bg: "#3a1428", bg2: "#140810", skin: "#7d4e38", hair: "#180e12", style: "long" },
};

function hashLook(username: string) {
  const skins = ["#8d5a3b", "#6b3a2a", "#a56b45", "#7a4a30"];
  const styles = ["short", "afro", "long", "puff"] as const;
  let hash = 0;
  for (const char of username) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return {
    bg: "#2a1810",
    bg2: "#100804",
    skin: skins[hash % skins.length],
    hair: "#16100c",
    style: styles[hash % styles.length],
  };
}

export function Face({ username, size = 64 }: { username: string; size?: number }) {
  const look = LOOKS[username] ?? hashLook(username);
  const id = `f-${username}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" aria-hidden>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={look.bg} />
          <stop offset="100%" stopColor={look.bg2} />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill={`url(#${id})`} />
      {look.style === "afro" && <circle cx="40" cy="36" r="26" fill={look.hair} />}
      {look.style === "puff" && (
        <>
          <circle cx="22" cy="28" r="12" fill={look.hair} />
          <circle cx="58" cy="28" r="12" fill={look.hair} />
        </>
      )}
      {look.style === "long" && <path d="M18 34c2 28 8 38 22 38s20-10 22-38c-6 6-38 6-44 0z" fill={look.hair} />}
      {look.style === "short" && <path d="M18 36c2-16 42-16 44 0-4-8-40-8-44 0z" fill={look.hair} />}
      <ellipse cx="40" cy="46" rx="16" ry="18" fill={look.skin} />
      {look.beard && <path d="M28 52c4 10 20 10 24 0-6 4-18 4-24 0z" fill="#3a2418" opacity="0.85" />}
      {look.shades ? (
        <g>
          <rect x="26" y="40" width="12" height="8" rx="3" fill={look.shades} />
          <rect x="42" y="40" width="12" height="8" rx="3" fill={look.shades} />
          <path d="M38 43h4" stroke={look.shades} strokeWidth="2" />
        </g>
      ) : (
        <g fill="#1a120e">
          <circle cx="33" cy="44" r="1.6" />
          <circle cx="47" cy="44" r="1.6" />
        </g>
      )}
      <path d="M34 54c3 3 9 3 12 0" stroke="#a15a55" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {look.phones && (
        <g>
          <path d="M18 42c0-14 44-14 44 0" fill="none" stroke="#111" strokeWidth="4" />
          <circle cx="18" cy="46" r="6" fill="#ff7a00" />
          <circle cx="62" cy="46" r="6" fill="#ff7a00" />
          <circle cx="18" cy="46" r="3" fill="#111" />
          <circle cx="62" cy="46" r="3" fill="#111" />
        </g>
      )}
    </svg>
  );
}

export function Mascot({
  size = 220,
  pose = "smile",
  look = "classic",
}: {
  size?: number;
  pose?: "smile" | "thumbs" | "peek";
  look?: "classic" | "hearts" | "purple" | "gold";
}) {
  const lens = look === "hearts" ? "#ff2d55" : look === "purple" ? "#6d28d9" : "#111";
  const id = `m-${pose}-${look}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 320 300" role="img" aria-label="Nochalant mascot">
      <defs>
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff7a00" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ff7a00" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-face`} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="58%" stopColor="#f3f3f3" />
          <stop offset="100%" stopColor="#d5d5d5" />
        </radialGradient>
        <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe7a3" />
          <stop offset="45%" stopColor="#f0b429" />
          <stop offset="100%" stopColor="#b86e09" />
        </linearGradient>
        <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffb14a" />
          <stop offset="55%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="176" rx="118" ry="78" fill={`url(#${id}-glow)`} />
      <g stroke="#ff8a00" strokeWidth="8" strokeLinecap="round">
        <path d="M62 92 38 82" />
        <path d="M70 70 50 48" />
        <path d="M88 54 80 28" />
      </g>
      <path d="M86 156c0-62 148-62 148 0" fill="none" stroke="#141414" strokeWidth="18" />
      <circle cx="84" cy="164" r="34" fill={`url(#${id}-cup)`} />
      <circle cx="84" cy="164" r="20" fill="#161616" />
      <circle cx="236" cy="164" r="34" fill={`url(#${id}-cup)`} />
      <circle cx="236" cy="164" r="20" fill="#161616" />
      <path d="M226 156l4-8 6 6 6-10 6 6 4-8v16z" fill={`url(#${id}-gold)`} />
      <circle cx="160" cy="162" r="74" fill={`url(#${id}-face)`} />
      <path d="M112 108 122 58l22 30 16-40 16 40 22-30 10 50z" fill={`url(#${id}-gold)`} stroke="#a16207" strokeWidth="2" />
      <circle cx="124" cy="62" r="5" fill="#e11d2e" />
      <circle cx="160" cy="50" r="6" fill="#e11d2e" />
      <circle cx="196" cy="62" r="5" fill="#e11d2e" />
      <ellipse cx="128" cy="168" rx="10" ry="6" fill="#ffb4a2" opacity="0.45" />
      <ellipse cx="192" cy="168" rx="10" ry="6" fill="#ffb4a2" opacity="0.45" />
      {look === "hearts" ? (
        <g fill={lens}>
          <path d="M118 150c0-8 12-8 12 2 0-10 12-10 12-2 0 8-12 14-12 14s-12-6-12-14z" />
          <path d="M166 150c0-8 12-8 12 2 0-10 12-10 12-2 0 8-12 14-12 14s-12-6-12-14z" />
        </g>
      ) : (
        <g>
          <rect x="108" y="138" width="46" height="32" rx="12" fill={lens} />
          <rect x="166" y="138" width="46" height="32" rx="12" fill={lens} />
          <path d="M154 152h12" stroke={lens} strokeWidth="6" />
          <path d="M116 146h24" stroke="#fff" strokeOpacity="0.35" strokeWidth="4" strokeLinecap="round" />
          <path d="M174 146h24" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      <path d="M128 196q32 28 64 0" fill="#1a1a1a" />
      <ellipse cx="160" cy="206" rx="16" ry="11" fill="#ff3048" />
      {pose === "thumbs" && (
        <g>
          <path d="M78 210c-28 8-36 36-16 48 18 10 40-6 36-24l8-28c2-10-8-16-16-8z" fill="#f7f7f7" />
          <path d="M70 198c-4-16 10-24 18-12 4 6 2 16-2 22" fill="#fff" />
        </g>
      )}
    </svg>
  );
}

export function Avatar({
  username,
  name,
  src,
  size = 40,
  mascot = false,
}: {
  username: string;
  name?: string;
  src?: string | null;
  size?: number;
  mascot?: boolean;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || username}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const mascotLook =
    username === "tiana" ? "hearts" : username === "amara" ? "purple" : username === "movieplug" ? "purple" : "classic";
  if (mascot || username === "blaqsoul") return <Mascot size={size} look={mascotLook} />;
  return <Face username={username} size={size} />;
}

export function Cover({ kind, className = "" }: { kind: string; className?: string }) {
  const art =
    kind === "clapper" ? (
      <g>
        <rect x="18" y="28" width="84" height="58" rx="8" fill="#111" stroke="#eee" strokeWidth="4" />
        <path d="M18 28h84l-10-16H28z" fill="#e11d2e" />
        <path d="M30 18l10 16M50 14l10 16M70 16l8 16" stroke="#111" strokeWidth="4" />
        <path d="M48 48l16 10-16 10z" fill="#ff7a00" />
      </g>
    ) : kind === "game" || kind === "cards" ? (
      <g>
        <rect x="22" y="30" width="36" height="50" rx="4" fill="#7f1d1d" transform="rotate(-12 40 55)" />
        <rect x="48" y="26" width="36" height="50" rx="4" fill="#111" stroke="#f5d90a" />
        <text x="58" y="58" fill="#f5d90a" fontSize="20" fontWeight="700">
          K
        </text>
      </g>
    ) : kind === "chess" ? (
      <g fill="#f5d90a">
        <rect x="34" y="70" width="52" height="8" rx="2" />
        <rect x="48" y="40" width="24" height="30" />
        <circle cx="60" cy="34" r="12" />
        <path d="M78 58h22l-8 18H70z" fill="#c4a15a" />
      </g>
    ) : kind === "ludo" ? (
      <g>
        <rect x="24" y="24" width="72" height="72" rx="8" fill="#14532d" />
        <circle cx="42" cy="42" r="8" fill="#ef4444" />
        <circle cx="78" cy="42" r="8" fill="#3b82f6" />
        <circle cx="42" cy="78" r="8" fill="#eab308" />
        <circle cx="78" cy="78" r="8" fill="#22c55e" />
      </g>
    ) : kind === "popcorn" ? (
      <g>
        <path d="M34 48h52l-6 40H40z" fill="#e11d2e" />
        <path d="M40 48c6-16 8-16 14 0 6-16 10-16 16 0 4-14 10-14 14 0" fill="#f8fafc" />
      </g>
    ) : kind === "headphones" ? (
      <g stroke="#ff7a00" fill="none" strokeWidth="8">
        <path d="M30 70c0-30 60-30 60 0" />
        <rect x="22" y="64" width="16" height="24" rx="6" fill="#ff7a00" />
        <rect x="82" y="64" width="16" height="24" rx="6" fill="#ff7a00" />
      </g>
    ) : kind === "chat" ? (
      <g>
        <rect x="22" y="28" width="76" height="52" rx="16" fill="#ff7a00" />
        <circle cx="46" cy="54" r="5" fill="#1a0c00" />
        <circle cx="60" cy="54" r="5" fill="#1a0c00" />
        <circle cx="74" cy="54" r="5" fill="#1a0c00" />
      </g>
    ) : (
      <g>
        <rect x="48" y="28" width="24" height="46" rx="12" fill="#f5d90a" />
        <rect x="42" y="70" width="36" height="10" rx="3" fill="#a16207" />
        <circle cx="60" cy="24" r="10" fill="#fde68a" />
        <path d="M30 78c20-20 40-20 60 0" stroke="#ff7a00" strokeWidth="4" fill="none" />
      </g>
    );
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {art}
    </svg>
  );
}

export function GladiatorArt() {
  return (
    <div className="relative h-40 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3a1208] via-[#7a1d0c] to-[#140804]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(255,180,80,0.35),transparent_45%)]" />
      <div className="absolute bottom-0 left-6 right-6 top-8 rounded-t-full bg-gradient-to-b from-[#c2410c] to-[#1c0a06] opacity-80" />
      <div className="absolute bottom-3 left-4 text-4xl font-black italic tracking-tight text-white">
        GLADIATOR <span className="text-[#ffb000]">II</span>
      </div>
      <div className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white">▶</div>
    </div>
  );
}

export function Wave() {
  return (
    <div className="pointer-events-none fixed bottom-0 left-1/2 z-20 w-[min(430px,100%)] -translate-x-1/2" aria-hidden>
      <svg viewBox="0 0 430 88" className="block h-[78px] w-full" preserveAspectRatio="none">
        <path d="M0 58c70 0 110 18 180 8 70-10 110-28 170-16 28 6 52 4 80-2v40H0Z" fill="#2a0008" />
        <path d="M20 66c80 10 130-20 200-8 54 10 90-16 190-4" fill="none" stroke="#ff6a00" strokeWidth="3" />
        <path d="M210 60c50 18 110-16 220-2v30H230Z" fill="#d10c18" />
        <path d="M280 68c40 8 80-16 150-6v26H300Z" fill="#ff2d2d" />
      </svg>
    </div>
  );
}

export const supportEmail = SUPPORT_EMAIL;
