import type {
  ChatMessage,
  CollectibleId,
  Comment,
  GiftEvent,
  Post,
  RoleId,
} from "@/lib/club/types";

export type Member = {
  id: string;
  name: string;
  handle: string;
  personality: string;
  object: CollectibleId;
  line: string;
};

export const members: Member[] = [
  {
    id: "adaeze",
    name: "Adaeze",
    handle: "adaeze",
    personality: "The Charmer",
    object: "heart",
    line: "Says less. Means more.",
  },
  {
    id: "malik",
    name: "Malik",
    handle: "malik",
    personality: "The Night Owl",
    object: "moon",
    line: "Awake when the room gets honest.",
  },
  {
    id: "june",
    name: "June Park",
    handle: "june",
    personality: "The Icon",
    object: "crown",
    line: "Sets the tone, then leaves.",
  },
  {
    id: "idris",
    name: "Idris",
    handle: "idris",
    personality: "The Player",
    object: "cards",
    line: "Here for the game. Stays for the people.",
  },
  {
    id: "noor",
    name: "Noor",
    handle: "noor",
    personality: "The Observer",
    object: "eye",
    line: "Watches the room before speaking.",
  },
  {
    id: "kelechi",
    name: "Kelechi",
    handle: "kelechi",
    personality: "The Wildcard",
    object: "chaos",
    line: "Will start something.",
  },
  {
    id: "sable",
    name: "Sable",
    handle: "sable",
    personality: "The Gossip",
    object: "tea",
    line: "Has the story. Might share it.",
  },
  {
    id: "rio",
    name: "Rio",
    handle: "rio",
    personality: "The Entertainer",
    object: "mic",
    line: "If it's quiet, that's a problem.",
  },
];

/** Designed scene, not a live follower count. */
export const sceneInsiders = ["adaeze", "june", "idris"];

export const followAsks = ["sable", "kelechi"];

export const challenges: {
  id: string;
  title: string;
  blurb: string;
  object: CollectibleId;
  to: "/create" | "/gifts" | "/table";
}[] = [
  { id: "less", title: "Say less", blurb: "One line. No essay.", object: "smirk", to: "/create" },
  { id: "voice", title: "One voice note", blurb: "Under a minute. Then stop.", object: "mic", to: "/create" },
  { id: "rose", title: "Pass a rose", blurb: "A gift that isn't a flex.", object: "rose", to: "/gifts" },
  { id: "whot", title: "Sit at the table", blurb: "Play one hand. No stakes.", object: "cards", to: "/table" },
];

export const roles: {
  id: RoleId;
  name: string;
  line: string;
  object: CollectibleId;
}[] = [
  {
    id: "leader",
    name: "Leader",
    line: "You open the room, start the experiment, and set the tone.",
    object: "crown",
  },
  {
    id: "member",
    name: "Member",
    line: "You show up, talk, gift, and stay in the mix.",
    object: "bubble",
  },
  {
    id: "observer",
    name: "Observer",
    line: "You watch, listen, vote, and step in when it's worth it.",
    object: "eye",
  },
];

export const personalities: {
  id: string;
  name: string;
  line: string;
  object: CollectibleId;
}[] = [
  { id: "player", name: "The Player", line: "Here for the game.", object: "cards" },
  { id: "playboy", name: "Playboy", line: "Knows the room.", object: "king" },
  { id: "playgirl", name: "Playgirl", line: "Runs the room.", object: "rose" },
  { id: "charmer", name: "The Charmer", line: "Makes it look easy.", object: "heart" },
  { id: "mystery", name: "The Mystery", line: "Arrives without explaining.", object: "eye" },
  { id: "wildcard", name: "The Wildcard", line: "The plan is optional.", object: "chaos" },
  { id: "owl", name: "The Night Owl", line: "Best after midnight.", object: "moon" },
  { id: "heartbreaker", name: "The Heartbreaker", line: "Sweet, then gone.", object: "diamond" },
  { id: "entertainer", name: "The Entertainer", line: "Fixes a quiet room.", object: "mic" },
  { id: "gossip", name: "The Gossip", line: "Has the story.", object: "tea" },
  { id: "observer", name: "The Observer", line: "Sees it first.", object: "eye" },
  { id: "rebel", name: "The Rebel", line: "Not taking the hint.", object: "chaos" },
  { id: "butterfly", name: "The Social Butterfly", line: "Knows everyone.", object: "star" },
  { id: "tastemaker", name: "The Tastemaker", line: "Already onto the next thing.", object: "crown" },
  { id: "connector", name: "The Connector", line: "Puts the right people together.", object: "bubble" },
  { id: "flirt", name: "The Flirt", line: "A look is a full sentence.", object: "smirk" },
  { id: "main", name: "The Main Character", line: "The night bends a little.", object: "spotlight" },
  { id: "unbothered", name: "The Unbothered One", line: "Unmoved. On purpose.", object: "unbothered" },
  { id: "intellectual", name: "The Intellectual", line: "Asks the better question.", object: "square" },
  { id: "icon", name: "The Icon", line: "Doesn't chase the room.", object: "blackcard" },
];

export const interestOptions: { id: string; name: string; object: CollectibleId }[] = [
  { id: "music", name: "Music", object: "headphones" },
  { id: "entertainment", name: "Entertainment", object: "spotlight" },
  { id: "relationships", name: "Relationships", object: "heart" },
  { id: "lifestyle", name: "Lifestyle", object: "icecream" },
  { id: "fashion", name: "Fashion", object: "blackcard" },
  { id: "technology", name: "Technology", object: "square" },
  { id: "sports", name: "Sports", object: "star" },
  { id: "gaming", name: "Gaming", object: "cards" },
  { id: "comedy", name: "Comedy", object: "smirk" },
  { id: "business", name: "Business", object: "diamond" },
  { id: "culture", name: "Culture", object: "crown" },
  { id: "nightlife", name: "Nightlife", object: "moon" },
  { id: "voice", name: "Voice conversations", object: "mic" },
  { id: "experiments", name: "Social experiments", object: "chaos" },
];

export const rooms = [
  {
    id: "lounge",
    name: "The Lounge",
    object: "spade" as CollectibleId,
    blurb: "The main room. Low light, open talk.",
    members: ["adaeze", "malik", "june", "rio"],
  },
  {
    id: "confessions",
    name: "Confessions",
    object: "eye" as CollectibleId,
    blurb: "Say it once. Then let it sit.",
    members: ["noor", "sable", "kelechi"],
  },
  {
    id: "after",
    name: "After Hours",
    object: "moon" as CollectibleId,
    blurb: "For whoever is still up.",
    members: ["malik", "rio"],
  },
  {
    id: "tea",
    name: "The Tea Room",
    object: "tea" as CollectibleId,
    blurb: "Stories, with context.",
    members: ["sable", "adaeze", "june"],
  },
  {
    id: "debate",
    name: "The Debate Room",
    object: "square" as CollectibleId,
    blurb: "Pick a side. Defend it.",
    members: ["idris", "noor"],
  },
];

export const squads = [
  {
    id: "midnight",
    name: "After Midnight",
    object: "moon" as CollectibleId,
    blurb: "A private crew for people who talk late.",
    access: "Invite only",
    members: ["malik", "rio", "kelechi"],
  },
  {
    id: "table",
    name: "The Table",
    object: "cards" as CollectibleId,
    blurb: "Cards, talk, no speeches.",
    access: "Private",
    members: ["idris", "june", "adaeze"],
  },
];

export const groups = [
  {
    id: "music",
    name: "After the Set",
    object: "headphones" as CollectibleId,
    blurb: "For people who stay when the song ends.",
    members: ["rio", "june", "malik"],
  },
  {
    id: "culture",
    name: "The Culture Room",
    object: "crown" as CollectibleId,
    blurb: "Taste, argument, and what the night actually meant.",
    members: ["adaeze", "noor", "sable"],
  },
  {
    id: "outside",
    name: "Outside",
    object: "moon" as CollectibleId,
    blurb: "Who is out, who is lying about it, and where to meet.",
    members: ["kelechi", "idris", "malik"],
  },
];

export const experiments = [
  {
    id: "silence",
    title: "The Silence Game",
    object: "eye" as CollectibleId,
    blurb: "The first person to over-explain loses.",
    duration: "Tonight · 2 hours",
    rules: [
      "One sentence, or a voice note under 15 seconds.",
      "No essays. No pile-ons.",
      "The room votes who stayed unbothered.",
    ],
  },
  {
    id: "unbothered",
    title: "The Unbothered Challenge",
    object: "unbothered" as CollectibleId,
    blurb: "React to nothing for one evening. Then tell the room how it felt.",
    duration: "24 hours",
    rules: ["No public clapbacks.", "A voice note at the end is optional.", "Leave if it stops being fun."],
  },
  {
    id: "confession",
    title: "Confession Hour",
    object: "tea" as CollectibleId,
    blurb: "One true thing. No names if they aren't yours to share.",
    duration: "Starts at midnight",
    rules: ["Consent stays in the room.", "Moderators can close a thread.", "Nothing leaves as a screenshot dare."],
  },
  {
    id: "voice",
    title: "The Voice Challenge",
    object: "mic" as CollectibleId,
    blurb: "Say something you've typed a hundred times. Out loud. Once.",
    duration: "This week",
    rules: ["60 seconds max.", "No surprise playback in public rooms.", "Replies are voice or nothing."],
  },
];

export const posts: Post[] = [
  {
    id: "p1",
    authorId: "june",
    kind: "text",
    text: "The Lounge is open. Come say it out loud, or don't say it at all.",
    time: "12m",
    likes: 18,
    object: "spotlight",
  },
  {
    id: "p2",
    authorId: "rio",
    kind: "voice",
    text: "A note from the music room. Play it when you're alone.",
    time: "28m",
    likes: 11,
    duration: 18,
    preview: true,
  },
  {
    id: "p3",
    authorId: "sable",
    kind: "text",
    text: "Someone sent a crown and left before the room could react. Respectfully, that's the move.",
    time: "1h",
    likes: 24,
    object: "crown",
  },
  {
    id: "p4",
    authorId: "idris",
    kind: "poll",
    text: "Where are we actually ending up?",
    time: "2h",
    likes: 9,
    poll: [
      { id: "after", label: "After Hours", votes: 14 },
      { id: "conf", label: "Confessions", votes: 9 },
    ],
  },
  {
    id: "p5",
    authorId: "malik",
    kind: "voice",
    text: "Who is actually awake?",
    time: "3h",
    likes: 15,
    duration: 9,
    preview: true,
  },
  {
    id: "p6",
    authorId: "adaeze",
    kind: "text",
    text: "New in the room. Don't introduce me like a newsletter.",
    time: "4h",
    likes: 21,
    object: "rose",
  },
];

export const seedComments: Record<string, Comment[]> = {
  p1: [
    { id: "c1", authorId: "kelechi", text: "Say less. I'm already outside." },
    { id: "c2", authorId: "noor", text: "Watching first." },
  ],
  p3: [{ id: "c3", authorId: "june", text: "Leave while it's still elegant." }],
  p6: [{ id: "c4", authorId: "june", text: "Noted. No speeches." }],
};

export const notifications: { id: string; text: string; object: CollectibleId; time: string }[] = [
  { id: "n1", text: "Malik sent you a crown.", object: "crown", time: "2h" },
  { id: "n2", text: "The Silence Game is open tonight.", object: "eye", time: "3h" },
  { id: "n3", text: "Adaeze saved a seat in The Lounge.", object: "spade", time: "5h" },
];

export const seedGifts: GiftEvent[] = [
  { id: "g1", from: "malik", object: "crown", note: "For the room.", time: "2h" },
];

export const inbound = ["malik", "adaeze", "june"];

export const threads = [
  { id: "malik", title: "Malik", object: "moon" as CollectibleId, time: "2m" },
  { id: "lounge", title: "The Lounge", object: "spade" as CollectibleId, time: "14m" },
  { id: "adaeze", title: "Adaeze", object: "heart" as CollectibleId, time: "1h" },
];

export const seedMessages: Record<string, ChatMessage[]> = {
  malik: [
    { id: "m1", from: "them", text: "You up?", at: "2:11" },
    { id: "m2", from: "them", text: "The Lounge is loud tonight.", at: "2:12" },
    { id: "m3", from: "them", object: "crown", text: "Sent you something.", at: "2:14" },
  ],
  lounge: [
    { id: "l1", from: "them", text: "June: Who is actually outside?", at: "1:02" },
    { id: "l2", from: "them", text: "Rio: Music room is open if the talk gets boring.", at: "1:06" },
    { id: "l3", from: "them", text: "Noor: I'm listening. Not performing.", at: "1:09" },
  ],
  adaeze: [
    { id: "a1", from: "them", text: "Don't make it a whole introduction.", at: "11:40" },
    { id: "a2", from: "them", object: "rose", text: "This felt more accurate.", at: "11:41" },
  ],
};

export const emojiGroups: { name: string; ids: CollectibleId[] }[] = [
  { name: "Faces", ids: ["sideeye", "unbothered", "smirk", "eye"] },
  { name: "Club", ids: ["crown", "spade", "blackcard", "spotlight", "king", "cards"] },
  { name: "Voice", ids: ["mic", "bubble", "headphones"] },
  { name: "Gifts", ids: ["rose", "heart", "diamond", "tea", "icecream"] },
  { name: "Shapes", ids: ["circle", "triangle", "cross", "square", "star", "chaos", "moon"] },
];

export const giftCatalogue: { id: CollectibleId; name: string; group: string }[] = [
  { id: "rose", name: "Rose", group: "Affection" },
  { id: "heart", name: "Heart", group: "Affection" },
  { id: "crown", name: "Crown", group: "Royalty" },
  { id: "king", name: "Golden piece", group: "Royalty" },
  { id: "blackcard", name: "Black Card", group: "Royalty" },
  { id: "diamond", name: "Diamond", group: "Royalty" },
  { id: "tea", name: "Tea", group: "Funny" },
  { id: "chaos", name: "Chaos token", group: "Funny" },
  { id: "smirk", name: "Smirk", group: "Funny" },
  { id: "icecream", name: "Ice cream", group: "Lifestyle" },
  { id: "headphones", name: "Headphones", group: "Music" },
  { id: "mic", name: "Microphone", group: "Music" },
  { id: "spotlight", name: "Spotlight", group: "Special" },
  { id: "star", name: "Star", group: "Special" },
];

export const collectibleNames: Record<CollectibleId, string> = {
  bubble: "Say it",
  cards: "The hand",
  spade: "Spade",
  king: "The piece",
  rose: "Rose",
  crown: "Crown",
  mic: "Mic drop",
  heart: "Heart",
  tea: "Tea",
  sideeye: "Side Eye",
  smirk: "Smirk",
  unbothered: "Unbothered",
  diamond: "Diamond",
  headphones: "Headphones",
  spotlight: "Spotlight",
  blackcard: "Black Card",
  star: "Star",
  circle: "Circle",
  triangle: "Triangle",
  cross: "Cross",
  square: "Square",
  icecream: "Ice cream",
  eye: "The look",
  moon: "After hours",
  chaos: "Chaos",
};

export const giftCost: Partial<Record<CollectibleId, number>> = {
  rose: 20,
  heart: 15,
  crown: 80,
  king: 60,
  blackcard: 100,
  diamond: 120,
  tea: 10,
  chaos: 25,
  smirk: 10,
  icecream: 15,
  headphones: 40,
  mic: 30,
  spotlight: 70,
  star: 35,
};

export function costOf(id: CollectibleId) {
  return giftCost[id] ?? 20;
}

export type SpaceKind = "room" | "squad" | "group" | "experiment";

export type SpaceCard = {
  id: string;
  name: string;
  object: CollectibleId;
  blurb: string;
  meta: string;
  members: string[];
  rules?: string[];
};

export function spaces(kind: SpaceKind): SpaceCard[] {
  if (kind === "room") {
    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      object: room.object,
      blurb: room.blurb,
      meta: `${room.members.length} in the scene`,
      members: room.members,
    }));
  }
  if (kind === "squad") {
    return squads.map((squad) => ({
      id: squad.id,
      name: squad.name,
      object: squad.object,
      blurb: squad.blurb,
      meta: squad.access,
      members: squad.members,
    }));
  }
  if (kind === "group") {
    return groups.map((group) => ({
      id: group.id,
      name: group.name,
      object: group.object,
      blurb: group.blurb,
      meta: `${group.members.length} members`,
      members: group.members,
    }));
  }
  return experiments.map((item) => ({
    id: item.id,
    name: item.title,
    object: item.object,
    blurb: item.blurb,
    meta: item.duration,
    members: [],
    rules: item.rules,
  }));
}

export function findSpace(kind: SpaceKind, id: string) {
  return spaces(kind).find((item) => item.id === id) ?? null;
}

export function memberById(id: string) {
  return members.find((member) => member.id === id);
}

export function memberByHandle(handle: string) {
  return members.find((member) => member.handle === handle);
}

export function personalityById(id: string | null) {
  return personalities.find((item) => item.id === id) ?? null;
}
