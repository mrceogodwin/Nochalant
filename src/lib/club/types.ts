export const collectibleIds = [
  "bubble",
  "cards",
  "spade",
  "king",
  "rose",
  "crown",
  "mic",
  "heart",
  "tea",
  "sideeye",
  "smirk",
  "unbothered",
  "diamond",
  "headphones",
  "spotlight",
  "blackcard",
  "star",
  "circle",
  "triangle",
  "cross",
  "square",
  "icecream",
  "eye",
  "moon",
  "chaos",
] as const;

export type CollectibleId = (typeof collectibleIds)[number];

export type RoleId = "leader" | "member" | "observer";

export type PostKind = "text" | "voice" | "poll" | "question";

export type PollOption = {
  id: string;
  label: string;
  votes: number;
};

export type Post = {
  id: string;
  authorId: string;
  kind: PostKind;
  text: string;
  time: string;
  likes: number;
  object?: CollectibleId;
  duration?: number;
  preview?: boolean;
  poll?: PollOption[];
  mine?: boolean;
  audio?: string;
};

export type Draft = {
  id: string;
  kind: PostKind;
  text: string;
  left: string;
  right: string;
  object: CollectibleId | null;
  time: string;
};

export type Comment = {
  id: string;
  authorId: string;
  text: string;
};

export type GiftEvent = {
  id: string;
  from: string;
  object: CollectibleId;
  note: string;
  time: string;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text?: string;
  object?: CollectibleId;
  audio?: string;
  duration?: number;
  at: string;
};
