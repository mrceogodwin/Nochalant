export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  interests: string[];
  onboarded: boolean;
  isAdmin: boolean;
  isPro: boolean;
  proPlan: string | null;
  proRenewsAt: string | null;
  walletNaira: number;
  verified: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  giftTotal: number;
  giftsReceived: number;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
};

export type Person = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  interests: string[];
  verified: boolean;
  isPro: boolean;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  giftTotal: number;
  following: boolean;
};

export type Scene = {
  id: string;
  slug: string;
  title: string;
  description: string;
  sceneType: string;
  category: string;
  isPrivate: boolean;
  isAdult: boolean;
  isLive: boolean;
  listenerCount: number;
  tags: string[];
  pinnedMessage: string | null;
  trendLabel: string | null;
  coverKey: string;
  hostName: string;
  hostUsername: string;
  groupSlug: string | null;
};

export type Member = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  role: string;
  muted: boolean;
};

export type SceneMessage = {
  id: string;
  body: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  role: string;
};

export type Group = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  memberCount: number;
  joined: boolean;
};

export type Post = {
  id: string;
  body: string;
  mediaKey: string | null;
  tag: string;
  likes: number;
  commentsCount: number;
  reposts: number;
  liked: boolean;
  saved: boolean;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
};

export type ChatThread = {
  id: string;
  kind: string;
  title: string;
  icon: string | null;
  pinned: boolean;
  lastBody: string;
  lastAt: string;
  unread: number;
  username: string | null;
};

export type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  mine: boolean;
};

export type Gift = {
  id: string;
  name: string;
  priceNaira: number;
  emoji: string;
  category: string;
};

export type Txn = {
  id: string;
  kind: string;
  amountNaira: number;
  title: string;
  detail: string;
  createdAt: string;
};

export type ClubEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  startsAt: string;
  isLive: boolean;
  listenerCount: number;
  coverKey: string;
  hostName: string;
  reminded: boolean;
  sceneSlug: string | null;
};

export type GameInfo = {
  slug: string;
  name: string;
  blurb: string;
  playing: number;
  coverKey: string;
};

export type LeaderRow = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  verified: boolean;
  score: number;
};
