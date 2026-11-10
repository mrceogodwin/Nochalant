import { bool, iso, num, str, textArray, type Row } from "./db";
import type {
  ChatMessage,
  ChatThread,
  ClubEvent,
  GameInfo,
  Gift,
  Group,
  LeaderRow,
  Member,
  Person,
  Post,
  Scene,
  SceneMessage,
  Txn,
  User,
} from "./types";

export function mapUser(row: Row): User {
  return {
    id: str(row, "id"),
    email: str(row, "email"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    bio: str(row, "bio"),
    location: str(row, "location") || "Nigeria",
    interests: textArray(row, "interests"),
    onboarded: bool(row, "onboarded"),
    isAdmin: bool(row, "is_admin"),
    isPro: bool(row, "is_pro"),
    proPlan: row.pro_plan ? str(row, "pro_plan") : null,
    proRenewsAt: row.pro_renews_at ? iso(row, "pro_renews_at") : null,
    walletNaira: num(row, "wallet_naira"),
    verified: bool(row, "verified"),
    postsCount: num(row, "posts_count"),
    followersCount: num(row, "followers_count"),
    followingCount: num(row, "following_count"),
    giftTotal: num(row, "gift_total"),
    giftsReceived: num(row, "gifts_received"),
    bankName: row.bank_name ? str(row, "bank_name") : null,
    accountNumber: row.account_number ? str(row, "account_number") : null,
    accountName: row.account_name ? str(row, "account_name") : null,
  };
}

export function mapPerson(row: Row): Person {
  return {
    id: str(row, "id"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    bio: str(row, "bio"),
    location: str(row, "location") || "Nigeria",
    interests: textArray(row, "interests"),
    verified: bool(row, "verified"),
    isPro: bool(row, "is_pro"),
    postsCount: num(row, "posts_count"),
    followersCount: num(row, "followers_count"),
    followingCount: num(row, "following_count"),
    giftTotal: num(row, "gift_total"),
    following: bool(row, "following"),
  };
}

export function mapScene(row: Row): Scene {
  return {
    id: str(row, "id"),
    slug: str(row, "slug"),
    title: str(row, "title"),
    description: str(row, "description"),
    sceneType: str(row, "scene_type"),
    category: str(row, "category"),
    isPrivate: bool(row, "is_private"),
    isAdult: bool(row, "is_adult"),
    isLive: bool(row, "is_live"),
    listenerCount: num(row, "listener_count"),
    tags: textArray(row, "tags"),
    pinnedMessage: row.pinned_message ? str(row, "pinned_message") : null,
    trendLabel: row.trend_label ? str(row, "trend_label") : null,
    coverKey: str(row, "cover_key") || "mic",
    hostName: str(row, "host_name"),
    hostUsername: str(row, "host_username"),
    groupSlug: row.group_slug ? str(row, "group_slug") : null,
  };
}

export function mapMember(row: Row): Member {
  return {
    id: str(row, "id"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    verified: bool(row, "verified"),
    role: str(row, "role"),
    muted: bool(row, "muted"),
  };
}

export function mapSceneMessage(row: Row): SceneMessage {
  return {
    id: str(row, "id"),
    body: str(row, "body"),
    likes: num(row, "likes"),
    liked: bool(row, "liked"),
    createdAt: iso(row, "created_at"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    verified: bool(row, "verified"),
    role: str(row, "role") || "listener",
  };
}

export function mapGroup(row: Row): Group {
  return {
    id: str(row, "id"),
    slug: str(row, "slug"),
    name: str(row, "name"),
    description: str(row, "description"),
    category: str(row, "category"),
    icon: str(row, "icon") || "👥",
    memberCount: num(row, "member_count"),
    joined: bool(row, "joined"),
  };
}

export function mapPost(row: Row): Post {
  return {
    id: str(row, "id"),
    body: str(row, "body"),
    mediaKey: row.media_key ? str(row, "media_key") : null,
    tag: str(row, "tag") || "all",
    likes: num(row, "likes"),
    commentsCount: num(row, "comments_count"),
    reposts: num(row, "reposts"),
    liked: bool(row, "liked"),
    saved: bool(row, "saved"),
    createdAt: iso(row, "created_at"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    verified: bool(row, "verified"),
  };
}

export function mapChat(row: Row): ChatThread {
  return {
    id: str(row, "id"),
    kind: str(row, "kind"),
    title: str(row, "title"),
    icon: row.icon ? str(row, "icon") : null,
    pinned: bool(row, "pinned"),
    lastBody: str(row, "last_body"),
    lastAt: iso(row, "last_at"),
    unread: num(row, "unread"),
    username: row.username ? str(row, "username") : null,
  };
}

export function mapChatMessage(row: Row, myId: string): ChatMessage {
  return {
    id: str(row, "id"),
    body: str(row, "body"),
    createdAt: iso(row, "created_at"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    mine: str(row, "user_id") === myId,
  };
}

export function mapGift(row: Row): Gift {
  return {
    id: str(row, "id"),
    name: str(row, "name"),
    priceNaira: num(row, "price_naira"),
    emoji: str(row, "emoji"),
    category: str(row, "category"),
  };
}

export function mapTxn(row: Row): Txn {
  return {
    id: str(row, "id"),
    kind: str(row, "kind"),
    amountNaira: num(row, "amount_naira"),
    title: str(row, "title"),
    detail: str(row, "detail"),
    createdAt: iso(row, "created_at"),
  };
}

export function mapEvent(row: Row): ClubEvent {
  return {
    id: str(row, "id"),
    slug: str(row, "slug"),
    title: str(row, "title"),
    description: str(row, "description"),
    category: str(row, "category"),
    startsAt: iso(row, "starts_at"),
    isLive: bool(row, "is_live"),
    listenerCount: num(row, "listener_count"),
    coverKey: str(row, "cover_key") || "mic",
    hostName: str(row, "host_name"),
    reminded: bool(row, "reminded"),
    sceneSlug: row.scene_slug ? str(row, "scene_slug") : null,
  };
}

export function mapGame(row: Row): GameInfo {
  return {
    slug: str(row, "slug"),
    name: str(row, "name"),
    blurb: str(row, "blurb"),
    playing: num(row, "playing"),
    coverKey: str(row, "cover_key") || "cards",
  };
}

export function mapLeader(row: Row): LeaderRow {
  return {
    id: str(row, "id"),
    username: str(row, "username"),
    displayName: str(row, "display_name"),
    avatarUrl: row.avatar_url ? str(row, "avatar_url") : null,
    verified: bool(row, "verified"),
    score: num(row, "score"),
  };
}
