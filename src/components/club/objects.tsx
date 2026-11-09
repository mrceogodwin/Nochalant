import type { ReactNode } from "react";
import { useId } from "react";
import { collectibleNames } from "@/lib/club/data";
import type { CollectibleId } from "@/lib/club/types";
import { cn } from "@/lib/utils";

function gid() {
  return useId().replace(/:/g, "");
}

function Shadow({ id, children }: { id: string; children: ReactNode }) {
  return (
    <g filter={`url(#${id})`}>
      {children}
    </g>
  );
}

function Sphere({
  from,
  mid,
  to,
  children,
}: {
  from: string;
  mid: string;
  to: string;
  children?: ReactNode;
}) {
  const id = gid();
  return (
    <svg viewBox="0 0 160 170" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}b`} cx="35%" cy="32%" r="72%">
          <stop offset="0%" stopColor={from} />
          <stop offset="46%" stopColor={mid} />
          <stop offset="100%" stopColor={to} />
        </radialGradient>
        <radialGradient id={`${id}s`} cx="30%" cy="24%" r="32%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}f`} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.5" />
        </filter>
      </defs>
      <Shadow id={`${id}f`}>
        <circle cx="80" cy="78" r="54" fill={`url(#${id}b)`} />
        <ellipse cx="60" cy="52" rx="22" ry="13" fill={`url(#${id}s)`} />
        {children}
      </Shadow>
    </svg>
  );
}

function Token({
  from,
  to,
  children,
}: {
  from: string;
  to: string;
  children?: ReactNode;
}) {
  const id = gid();
  return (
    <svg viewBox="0 0 160 170" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}b`} cx="34%" cy="30%" r="75%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </radialGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff4cc" />
          <stop offset="50%" stopColor="#e2b14a" />
          <stop offset="100%" stopColor="#8c6424" />
        </linearGradient>
        <filter id={`${id}f`} x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodColor="#000" floodOpacity="0.48" />
        </filter>
      </defs>
      <Shadow id={`${id}f`}>
        <circle cx="80" cy="80" r="56" fill={`url(#${id}b)`} stroke={`url(#${id}g)`} strokeWidth="3" />
        <ellipse cx="60" cy="52" rx="22" ry="12" fill="#fff" opacity="0.28" />
        {children}
      </Shadow>
    </svg>
  );
}

function SpadePath({ fill = "#f4f4f6" }: { fill?: string }) {
  return (
    <path
      fill={fill}
      d="M42 22c0 0-18 18-18 32 0 10 7 17 18 17-6 0-8 7-9 14h18c-1-7-3-14-9-14 11 0 18-7 18-17 0-14-18-32-18-32z"
    />
  );
}

function Bubble() {
  const id = gid();
  return (
    <svg viewBox="0 0 170 160" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}b`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f3f3f6" />
          <stop offset="100%" stopColor="#d7d7df" />
        </radialGradient>
        <filter id={`${id}f`} x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>
      <Shadow id={`${id}f`}>
        <path
          fill={`url(#${id}b)`}
          d="M28 28h104c10 0 18 8 18 18v52c0 10-8 18-18 18H72l-22 24 4-24H28c-10 0-18-8-18-18V46c0-10 8-18 18-18z"
        />
        <ellipse cx="58" cy="62" rx="16" ry="10" fill="#fff" opacity="0.8" />
        <ellipse cx="52" cy="78" rx="10" ry="7" fill="#ff7eb3" opacity="0.85" />
        <circle cx="58" cy="74" r="5" fill="#1a1a1e" />
        <circle cx="86" cy="74" r="5" fill="#1a1a1e" />
        <circle cx="56.5" cy="72.5" r="1.6" fill="#fff" />
        <circle cx="84.5" cy="72.5" r="1.6" fill="#fff" />
        <path d="M62 96c8 8 22 8 32 0" fill="none" stroke="#2a2a30" strokeWidth="3" strokeLinecap="round" />
      </Shadow>
    </svg>
  );
}

function Cards() {
  const id = gid();
  return (
    <svg viewBox="0 0 210 160" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b089ff" />
          <stop offset="100%" stopColor="#5b2fd6" />
        </linearGradient>
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffc27a" />
          <stop offset="100%" stopColor="#ef5a2a" />
        </linearGradient>
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2c2c33" />
          <stop offset="100%" stopColor="#0c0c0e" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff1c4" />
          <stop offset="100%" stopColor="#a9782c" />
        </linearGradient>
        <filter id={`${id}f`} x="-20%" y="-20%" width="150%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <g transform="translate(18 28) rotate(-18 40 50)">
          <rect width="78" height="108" rx="12" fill={`url(#${id}p)`} />
          <rect x="7" y="7" width="64" height="94" rx="8" fill="none" stroke="#fff" strokeOpacity="0.4" />
        </g>
        <g transform="translate(112 24) rotate(16 40 50)">
          <rect width="78" height="108" rx="12" fill={`url(#${id}o)`} />
          <rect x="7" y="7" width="64" height="94" rx="8" fill="none" stroke="#fff" strokeOpacity="0.45" />
        </g>
        <g transform="translate(64 12)">
          <rect width="84" height="116" rx="14" fill={`url(#${id}k)`} stroke={`url(#${id}g)`} strokeWidth="2.5" />
          <path d="M18 16h48" stroke="#fff" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
          <g transform="translate(12 18) scale(0.72)">
            <SpadePath />
          </g>
        </g>
      </g>
    </svg>
  );
}

function Spade() {
  const id = gid();
  return (
    <svg viewBox="0 0 150 210" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}k`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#32323a" />
          <stop offset="40%" stopColor="#141418" />
          <stop offset="100%" stopColor="#070708" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d4" />
          <stop offset="45%" stopColor="#e7c16a" />
          <stop offset="100%" stopColor="#8d6424" />
        </linearGradient>
        <filter id={`${id}f`} x="-25%" y="-15%" width="160%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="7" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <rect x="8" y="8" width="134" height="190" rx="18" fill={`url(#${id}k)`} stroke={`url(#${id}g)`} strokeWidth="3" />
        <path d="M28 22h70" stroke="#fff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" />
        <text x="24" y="48" fill="#f5f5f5" fontFamily="Instrument Serif, Georgia, serif" fontSize="26">
          A
        </text>
        <g transform="translate(28 58) scale(1.15)">
          <SpadePath />
        </g>
        <text x="108" y="180" fill="#f5f5f5" fontFamily="Instrument Serif, Georgia, serif" fontSize="26">
          A
        </text>
      </g>
    </svg>
  );
}

function King() {
  const id = gid();
  return (
    <svg viewBox="0 0 150 210" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2a2a30" />
          <stop offset="35%" stopColor="#0e0e11" />
          <stop offset="70%" stopColor="#3a3a42" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c9" />
          <stop offset="40%" stopColor="#f0c45a" />
          <stop offset="100%" stopColor="#a36b1e" />
        </linearGradient>
        <filter id={`${id}f`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="12" stdDeviation="6" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <ellipse cx="75" cy="188" rx="40" ry="8" fill="#000" opacity="0.35" />
        <path d="M38 176h74c4 0 6 3 6 6H32c0-3 2-6 6-6z" fill={`url(#${id}b)`} />
        <path d="M46 160h58l8 16H38z" fill={`url(#${id}b)`} />
        <path d="M50 78h50l10 82H40z" fill={`url(#${id}b)`} />
        <path d="M62 78h10l4 82h-18z" fill="#fff" opacity="0.14" />
        <path d="M36 70h78v14H36z" fill="#16161a" />
        <path
          fill={`url(#${id}g)`}
          d="M28 74l14-28 10 16 16-26 8 20 12-16 16 34H28z"
        />
        <circle cx="42" cy="50" r="4" fill="#fff6d2" />
        <circle cx="75" cy="36" r="4.5" fill="#fff6d2" />
        <circle cx="108" cy="50" r="4" fill="#fff6d2" />
        <path d="M70 48h10v16h-10z" fill={`url(#${id}g)`} />
      </g>
    </svg>
  );
}

function Rose() {
  const id = gid();
  return (
    <svg viewBox="0 0 160 190" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}a`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ff8fa3" />
          <stop offset="45%" stopColor="#e11d48" />
          <stop offset="100%" stopColor="#7f1239" />
        </radialGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3f6212" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        <filter id={`${id}f`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <path d="M78 108c8 20 6 40 2 62" fill="none" stroke={`url(#${id}s)`} strokeWidth="7" strokeLinecap="round" />
        <path d="M80 130c16 6 22 16 18 24" fill="none" stroke="#4d7c0f" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="80" cy="78" rx="34" ry="30" fill={`url(#${id}a)`} />
        <ellipse cx="58" cy="84" rx="20" ry="16" fill="#fb7185" />
        <ellipse cx="102" cy="82" rx="20" ry="16" fill="#be123c" />
        <ellipse cx="80" cy="64" rx="18" ry="14" fill="#fb7185" />
        <ellipse cx="80" cy="78" rx="10" ry="12" fill="#9f1239" />
        <ellipse cx="68" cy="62" rx="12" ry="7" fill="#fff" opacity="0.35" />
      </g>
    </svg>
  );
}

function Crown() {
  const id = gid();
  return (
    <svg viewBox="0 0 180 140" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d0" />
          <stop offset="35%" stopColor="#f0c85a" />
          <stop offset="100%" stopColor="#9a6418" />
        </linearGradient>
        <filter id={`${id}f`} x="-20%" y="-30%" width="150%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <path fill={`url(#${id}g)`} d="M18 96l16-52 22 28 28-46 14 36 24-24 22 58H18z" />
        <path d="M18 96h146v16c0 6-6 10-12 10H30c-6 0-12-4-12-10v-16z" fill={`url(#${id}g)`} />
        <circle cx="34" cy="42" r="7" fill="#fff8dc" />
        <circle cx="90" cy="22" r="8" fill="#fff8dc" />
        <circle cx="148" cy="40" r="7" fill="#fff8dc" />
        <circle cx="62" cy="108" r="4" fill="#7f1d1d" />
        <circle cx="90" cy="108" r="4" fill="#1e3a8a" />
        <circle cx="118" cy="108" r="4" fill="#7f1d1d" />
      </g>
    </svg>
  );
}

function Mic() {
  const id = gid();
  return (
    <svg viewBox="0 0 140 190" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3a3a42" />
          <stop offset="40%" stopColor="#121216" />
          <stop offset="100%" stopColor="#2a2a30" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="100%" stopColor="#c4892e" />
        </linearGradient>
        <filter id={`${id}f`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <rect x="48" y="18" width="44" height="78" rx="22" fill={`url(#${id}g)`} />
        <path d="M56 36h28M56 48h28M56 60h28M56 72h28" stroke="#8a5a16" strokeWidth="2" strokeLinecap="round" />
        <path d="M40 78c0 28 14 42 30 42s30-14 30-42" fill="none" stroke={`url(#${id}b)`} strokeWidth="8" />
        <rect x="64" y="118" width="12" height="28" rx="4" fill={`url(#${id}b)`} />
        <rect x="48" y="142" width="44" height="12" rx="6" fill={`url(#${id}b)`} />
      </g>
    </svg>
  );
}

function Heart() {
  const id = gid();
  return (
    <svg viewBox="0 0 160 160" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}h`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#ff9ec4" />
          <stop offset="45%" stopColor="#f43f7a" />
          <stop offset="100%" stopColor="#9d174d" />
        </radialGradient>
        <filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <path
          fill={`url(#${id}h)`}
          d="M80 132c-28-18-48-36-48-60 0-16 12-28 28-28 10 0 16 5 20 12 4-7 10-12 20-12 16 0 28 12 28 28 0 24-20 42-48 60z"
        />
        <ellipse cx="62" cy="62" rx="14" ry="8" fill="#fff" opacity="0.45" />
      </g>
    </svg>
  );
}

function Tea() {
  const id = gid();
  return (
    <svg viewBox="0 0 180 160" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d9d9e2" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff1c2" />
          <stop offset="100%" stopColor="#c8922e" />
        </linearGradient>
        <filter id={`${id}f`} x="-20%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <ellipse cx="78" cy="128" rx="52" ry="12" fill={`url(#${id}c)`} />
        <path d="M36 70h84l-10 46H48z" fill={`url(#${id}c)`} />
        <path d="M36 70h84" stroke={`url(#${id}g)`} strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="78" cy="74" rx="36" ry="10" fill="#7f1d1d" />
        <path d="M120 82h16c12 0 18 10 14 22-4 14-20 16-30 8" fill="none" stroke={`url(#${id}c)`} strokeWidth="8" strokeLinecap="round" />
        <path d="M62 40c4-12 2-18 8-26" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" />
        <path d="M82 36c4-12 2-16 8-24" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function Diamond() {
  const id = gid();
  return (
    <svg viewBox="0 0 150 170" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fbff" />
          <stop offset="40%" stopColor="#93c5fd" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <polygon points="75,18 118,58 75,148 32,58" fill={`url(#${id}a)`} />
        <polygon points="75,18 118,58 75,70" fill="#fff" opacity="0.55" />
        <polygon points="32,58 75,70 75,148" fill={`url(#${id}b)`} opacity="0.85" />
        <polygon points="75,18 32,58 75,70" fill="#bfdbfe" />
      </g>
    </svg>
  );
}

function Headphones() {
  const id = gid();
  return (
    <svg viewBox="0 0 180 160" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3a3a42" />
          <stop offset="100%" stopColor="#0e0e12" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff1c4" />
          <stop offset="100%" stopColor="#b8862f" />
        </linearGradient>
        <filter id={`${id}f`} x="-20%" y="-25%" width="150%" height="160%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <path d="M36 86c0-40 24-62 54-62s54 22 54 62" fill="none" stroke={`url(#${id}b)`} strokeWidth="12" strokeLinecap="round" />
        <rect x="22" y="74" width="32" height="52" rx="14" fill={`url(#${id}b)`} stroke={`url(#${id}g)`} strokeWidth="3" />
        <rect x="126" y="74" width="32" height="52" rx="14" fill={`url(#${id}b)`} stroke={`url(#${id}g)`} strokeWidth="3" />
        <ellipse cx="38" cy="92" rx="8" ry="5" fill="#fff" opacity="0.25" />
      </g>
    </svg>
  );
}

function Spotlight() {
  const id = gid();
  return (
    <svg viewBox="0 0 160 180" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}l`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="100%" stopColor="#b8862a" />
        </linearGradient>
        <filter id={`${id}f`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <polygon points="80,36 128,160 32,160" fill={`url(#${id}l)`} />
        <rect x="52" y="22" width="56" height="28" rx="8" fill="#141418" stroke={`url(#${id}g)`} strokeWidth="3" />
        <circle cx="80" cy="36" r="8" fill={`url(#${id}g)`} />
      </g>
    </svg>
  );
}

function BlackCard() {
  const id = gid();
  return (
    <svg viewBox="0 0 220 140" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2a2a32" />
          <stop offset="40%" stopColor="#101014" />
          <stop offset="100%" stopColor="#050506" />
        </linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff1c4" />
          <stop offset="100%" stopColor="#a9782c" />
        </linearGradient>
        <filter id={`${id}f`} x="-15%" y="-25%" width="140%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.5" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <rect x="8" y="16" width="204" height="112" rx="16" fill={`url(#${id}c)`} stroke={`url(#${id}g)`} strokeWidth="2" />
        <path d="M24 32h90" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" strokeLinecap="round" />
        <rect x="24" y="48" width="36" height="28" rx="6" fill={`url(#${id}g)`} />
        <g transform="translate(150 58) scale(0.55)">
          <SpadePath fill="#f3d48a" />
        </g>
        <text x="24" y="108" fill="#e7c56a" fontFamily="Outfit, sans-serif" fontSize="13" letterSpacing="3">
          BLACK CARD
        </text>
      </g>
    </svg>
  );
}

function IceCream() {
  const id = gid();
  return (
    <svg viewBox="0 0 140 190" className="h-auto w-full overflow-visible">
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f6d7a2" />
          <stop offset="100%" stopColor="#b7791f" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe4ef" />
          <stop offset="100%" stopColor="#f472b6" />
        </radialGradient>
        <filter id={`${id}f`} x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.4" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <path d="M48 90h44l-22 78z" fill={`url(#${id}c)`} />
        <path d="M52 100h8l-4 50M70 96h8l-6 62M86 100h8l-10 48" stroke="#a16207" strokeWidth="2" />
        <circle cx="58" cy="78" r="26" fill={`url(#${id}s)`} />
        <circle cx="84" cy="74" r="24" fill="#fda4af" />
        <ellipse cx="62" cy="66" rx="10" ry="6" fill="#fff" opacity="0.45" />
      </g>
    </svg>
  );
}

function Moon() {
  const id = gid();
  return (
    <svg viewBox="0 0 160 170" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}m`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="55%" stopColor="#f3d48a" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <filter id={`${id}f`} x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="10" stdDeviation="6" floodOpacity="0.45" />
        </filter>
        <mask id={`${id}k`}>
          <rect width="160" height="170" fill="#000" />
          <circle cx="74" cy="80" r="48" fill="#fff" />
          <circle cx="98" cy="64" r="40" fill="#000" />
        </mask>
      </defs>
      <g filter={`url(#${id}f)`} mask={`url(#${id}k)`}>
        <circle cx="74" cy="80" r="48" fill={`url(#${id}m)`} />
        <ellipse cx="58" cy="60" rx="14" ry="8" fill="#fff" opacity="0.45" />
      </g>
    </svg>
  );
}

function EyeArt() {
  const id = gid();
  return (
    <svg viewBox="0 0 180 120" className="h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`${id}i`} cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="45%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff1c4" />
          <stop offset="100%" stopColor="#b8862f" />
        </linearGradient>
        <filter id={`${id}f`} x="-20%" y="-40%" width="150%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter={`url(#${id}f)`}>
        <path
          d="M16 60c28-36 120-36 148 0-28 36-120 36-148 0z"
          fill="#16161a"
          stroke={`url(#${id}g)`}
          strokeWidth="3"
        />
        <circle cx="90" cy="60" r="24" fill={`url(#${id}i)`} />
        <circle cx="90" cy="60" r="10" fill="#050505" />
        <circle cx="82" cy="52" r="6" fill="#fff" opacity="0.8" />
      </g>
    </svg>
  );
}

function SideEye() {
  return (
    <Sphere from="#ffd7c2" mid="#e7a07c" to="#9a5b3c">
      <path d="M48 62c8-8 18-8 24 0" fill="none" stroke="#3b2418" strokeWidth="3" strokeLinecap="round" />
      <path d="M84 66c6-6 16-4 22 2" fill="none" stroke="#3b2418" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="62" cy="78" rx="8" ry="9" fill="#1c120e" />
      <ellipse cx="98" cy="80" rx="8" ry="9" fill="#1c120e" />
      <circle cx="58" cy="76" r="2.4" fill="#fff" />
      <circle cx="94" cy="78" r="2.4" fill="#fff" />
      <path d="M68 104c8 4 16 4 26-2" fill="none" stroke="#6b3a28" strokeWidth="3" strokeLinecap="round" />
    </Sphere>
  );
}

function Smirk() {
  return (
    <Sphere from="#ffd0c8" mid="#e8897a" to="#a14d4d">
      <path d="M50 66h22" stroke="#4a2a28" strokeWidth="3" strokeLinecap="round" />
      <path d="M88 64h24" stroke="#4a2a28" strokeWidth="3" strokeLinecap="round" />
      <circle cx="62" cy="80" r="5" fill="#241614" />
      <circle cx="100" cy="80" r="5" fill="#241614" />
      <circle cx="60" cy="78" r="1.7" fill="#fff" />
      <circle cx="98" cy="78" r="1.7" fill="#fff" />
      <path d="M66 104c10 8 24 6 36-4" fill="none" stroke="#6b2d32" strokeWidth="3.5" strokeLinecap="round" />
    </Sphere>
  );
}

function Unbothered() {
  return (
    <Sphere from="#3a3a44" mid="#17171c" to="#050506">
      <path d="M50 78h22" stroke="#f0d48a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M90 78h22" stroke="#f0d48a" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M66 104h30" stroke="#e7c56a" strokeWidth="3.5" strokeLinecap="round" />
    </Sphere>
  );
}

function Chaos() {
  return (
    <Token from="#fb7185" to="#7c3aed">
      <path
        d="M80 48c18 8 22 20 10 30-14 12-30-2-22-16 6-10 20-6 16 4"
        fill="none"
        stroke="#fff6d4"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </Token>
  );
}

function Star() {
  return (
    <Token from="#fde68a" to="#d97706">
      <polygon
        fill="#fff7dc"
        points="80,46 88,68 112,68 92,82 100,106 80,92 60,106 68,82 48,68 72,68"
      />
    </Token>
  );
}

function CircleMark() {
  return (
    <Token from="#67e8f9" to="#0e7490">
      <circle cx="80" cy="80" r="22" fill="none" stroke="#ecfeff" strokeWidth="6" />
    </Token>
  );
}

function TriangleMark() {
  return (
    <Token from="#fdba74" to="#c2410c">
      <polygon points="80,52 108,108 52,108" fill="none" stroke="#fff7ed" strokeWidth="6" strokeLinejoin="round" />
    </Token>
  );
}

function CrossMark() {
  return (
    <Token from="#f9a8d4" to="#9d174d">
      <path d="M80 52v56M52 80h56" stroke="#fff1f2" strokeWidth="7" strokeLinecap="round" />
    </Token>
  );
}

function SquareMark() {
  return (
    <Token from="#c4b5fd" to="#5b21b6">
      <rect x="58" y="58" width="44" height="44" rx="6" fill="none" stroke="#f5f3ff" strokeWidth="6" />
    </Token>
  );
}

const arts: Record<CollectibleId, () => ReactNode> = {
  bubble: Bubble,
  cards: Cards,
  spade: Spade,
  king: King,
  rose: Rose,
  crown: Crown,
  mic: Mic,
  heart: Heart,
  tea: Tea,
  sideeye: SideEye,
  smirk: Smirk,
  unbothered: Unbothered,
  diamond: Diamond,
  headphones: Headphones,
  spotlight: Spotlight,
  blackcard: BlackCard,
  star: Star,
  circle: CircleMark,
  triangle: TriangleMark,
  cross: CrossMark,
  square: SquareMark,
  icecream: IceCream,
  eye: EyeArt,
  moon: Moon,
  chaos: Chaos,
};

export function Collectible({
  id,
  className,
}: {
  id: CollectibleId;
  className?: string;
}) {
  const Art = arts[id];
  return (
    <span role="img" aria-label={collectibleNames[id]} className={cn("block", className)}>
      <Art />
    </span>
  );
}

export function giftMotion(id: CollectibleId) {
  if (id === "crown" || id === "king" || id === "spotlight") return "gift-descend";
  if (id === "spade" || id === "cards" || id === "blackcard" || id === "diamond") return "gift-flip";
  return "gift-bloom";
}
