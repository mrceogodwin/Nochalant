import { getDb, type Row } from "./db";
import {
  mapChat,
  mapChatMessage,
  mapEvent,
  mapGame,
  mapGift,
  mapGroup,
  mapLeader,
  mapMember,
  mapPerson,
  mapPost,
  mapScene,
  mapSceneMessage,
  mapTxn,
} from "./map";

export async function publicScenes() {
  const db = getDb();
  const rows = (await db`
    SELECT s.*, h.display_name AS host_name, h.username AS host_username, g.slug AS group_slug
    FROM social.scenes s
    LEFT JOIN social.users h ON h.id = s.host_id
    LEFT JOIN social.groups g ON g.id = s.group_id
    WHERE s.is_private = false
    ORDER BY s.is_live DESC, s.listener_count DESC
  `) as Row[];
  return rows.map(mapScene);
}

export async function getScene(slug: string) {
  const db = getDb();
  const rows = (await db`
    SELECT s.*, h.display_name AS host_name, h.username AS host_username, g.slug AS group_slug
    FROM social.scenes s
    LEFT JOIN social.users h ON h.id = s.host_id
    LEFT JOIN social.groups g ON g.id = s.group_id
    WHERE s.slug = ${slug}
    LIMIT 1
  `) as Row[];
  return rows[0] ? mapScene(rows[0]) : null;
}

export async function sceneMembers(sceneId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, m.role, m.muted
    FROM social.scene_members m
    JOIN social.users u ON u.id = m.user_id
    WHERE m.scene_id = ${sceneId}
    ORDER BY CASE m.role WHEN 'host' THEN 0 WHEN 'cohost' THEN 1 WHEN 'speaker' THEN 2 ELSE 3 END, u.display_name
  `) as Row[];
  return rows.map(mapMember);
}

export async function sceneMessages(sceneId: string, userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT m.id, m.body, m.likes, m.created_at, u.username, u.display_name, u.avatar_url, u.verified,
      COALESCE(sm.role, 'listener') AS role,
      EXISTS(SELECT 1 FROM social.scene_message_likes l WHERE l.message_id = m.id AND l.user_id = ${userId}) AS liked
    FROM social.scene_messages m
    JOIN social.users u ON u.id = m.user_id
    LEFT JOIN social.scene_members sm ON sm.scene_id = m.scene_id AND sm.user_id = m.user_id
    WHERE m.scene_id = ${sceneId}
    ORDER BY m.created_at ASC
  `) as Row[];
  return rows.map(mapSceneMessage);
}

export async function speakRequests(sceneId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, 'listener' AS role, false AS muted, r.status
    FROM social.speak_requests r
    JOIN social.users u ON u.id = r.user_id
    WHERE r.scene_id = ${sceneId} AND r.status = 'pending'
    ORDER BY r.created_at ASC
  `) as Row[];
  return rows.map((row) => ({ ...mapMember(row), status: String(row.status) }));
}

export async function listGroups(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT g.*, EXISTS(
      SELECT 1 FROM social.group_members m WHERE m.group_id = g.id AND m.user_id = ${userId}
    ) AS joined
    FROM social.groups g
    ORDER BY g.member_count DESC
  `) as Row[];
  return rows.map(mapGroup);
}

export async function getGroup(slug: string, userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT g.*, EXISTS(
      SELECT 1 FROM social.group_members m WHERE m.group_id = g.id AND m.user_id = ${userId}
    ) AS joined
    FROM social.groups g
    WHERE g.slug = ${slug}
    LIMIT 1
  `) as Row[];
  return rows[0] ? mapGroup(rows[0]) : null;
}

export async function groupMembers(groupId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.id, u.username, u.display_name, u.avatar_url, u.verified, m.role, false AS muted
    FROM social.group_members m
    JOIN social.users u ON u.id = m.user_id
    WHERE m.group_id = ${groupId}
    ORDER BY CASE m.role WHEN 'owner' THEN 0 ELSE 1 END, u.display_name
  `) as Row[];
  return rows.map(mapMember);
}

export async function groupPosts(groupId: string, userId: string, filter: string) {
  const db = getDb();
  const rows = (await db`
    SELECT p.*, u.username, u.display_name, u.avatar_url, u.verified,
      EXISTS(SELECT 1 FROM social.post_likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) AS liked,
      EXISTS(SELECT 1 FROM social.saved_items s WHERE s.user_id = ${userId} AND s.kind = 'post' AND s.ref_id = p.id) AS saved
    FROM social.posts p
    JOIN social.users u ON u.id = p.user_id
    WHERE p.group_id = ${groupId}
      AND (
        ${filter} = 'all'
        OR (${filter} = 'trending' AND p.likes >= 100)
        OR p.tag = ${filter}
      )
    ORDER BY p.created_at DESC
  `) as Row[];
  return rows.map(mapPost);
}

export async function getPost(id: string, userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT p.*, u.username, u.display_name, u.avatar_url, u.verified,
      EXISTS(SELECT 1 FROM social.post_likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) AS liked,
      EXISTS(SELECT 1 FROM social.saved_items s WHERE s.user_id = ${userId} AND s.kind = 'post' AND s.ref_id = p.id) AS saved
    FROM social.posts p
    JOIN social.users u ON u.id = p.user_id
    WHERE p.id = ${id}
    LIMIT 1
  `) as Row[];
  return rows[0] ? mapPost(rows[0]) : null;
}

export async function postComments(postId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT c.id, c.body, c.created_at, u.username, u.display_name, u.avatar_url, u.verified
    FROM social.comments c
    JOIN social.users u ON u.id = c.user_id
    WHERE c.post_id = ${postId}
    ORDER BY c.created_at ASC
  `) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    body: String(row.body),
    createdAt: new Date(String(row.created_at)).toISOString(),
    username: String(row.username),
    displayName: String(row.display_name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    verified: Boolean(row.verified),
  }));
}

export async function listPeople(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.*, EXISTS(
      SELECT 1 FROM social.follows f WHERE f.follower_id = ${userId} AND f.following_id = u.id
    ) AS following
    FROM social.users u
    WHERE u.id <> ${userId} AND u.onboarded = true
    ORDER BY u.followers_count DESC
  `) as Row[];
  return rows.map(mapPerson);
}

export async function getPerson(username: string, userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.*, EXISTS(
      SELECT 1 FROM social.follows f WHERE f.follower_id = ${userId} AND f.following_id = u.id
    ) AS following
    FROM social.users u
    WHERE u.username = ${username}
    LIMIT 1
  `) as Row[];
  return rows[0] ? mapPerson(rows[0]) : null;
}

export async function listChats(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT c.*, cm.unread, ou.username
    FROM social.chat_members cm
    JOIN social.chats c ON c.id = cm.chat_id
    LEFT JOIN social.chat_members om ON om.chat_id = c.id AND om.user_id <> ${userId}
    LEFT JOIN social.users ou ON ou.id = om.user_id AND c.kind = 'dm'
    WHERE cm.user_id = ${userId}
    ORDER BY c.pinned DESC, c.last_at DESC
  `) as Row[];
  const seen = new Set<string>();
  return rows.map(mapChat).filter((chat) => {
    if (seen.has(chat.id)) return false;
    seen.add(chat.id);
    return true;
  });
}

export async function getChat(id: string, userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT c.*, cm.unread, ou.username
    FROM social.chat_members cm
    JOIN social.chats c ON c.id = cm.chat_id
    LEFT JOIN social.chat_members om ON om.chat_id = c.id AND om.user_id <> ${userId}
    LEFT JOIN social.users ou ON ou.id = om.user_id AND c.kind = 'dm'
    WHERE cm.user_id = ${userId} AND c.id = ${id}
    LIMIT 1
  `) as Row[];
  return rows[0] ? mapChat(rows[0]) : null;
}

export async function chatMessages(chatId: string, userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT m.id, m.body, m.created_at, m.user_id, u.username, u.display_name, u.avatar_url
    FROM social.chat_messages m
    JOIN social.users u ON u.id = m.user_id
    WHERE m.chat_id = ${chatId}
    ORDER BY m.created_at ASC
  `) as Row[];
  return rows.map((row) => mapChatMessage(row, userId));
}

export async function unreadCount(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT COUNT(*)::int AS n FROM social.chat_members WHERE user_id = ${userId} AND unread > 0
  `) as Row[];
  return Number(rows[0]?.n ?? 0);
}

export async function notifications(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT id, title, body, href, read, created_at
    FROM social.notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 40
  `) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : null,
    read: Boolean(row.read),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function unreadNotes(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT COUNT(*)::int AS n FROM social.notifications WHERE user_id = ${userId} AND read = false
  `) as Row[];
  return Number(rows[0]?.n ?? 0);
}

export async function listGifts() {
  const db = getDb();
  const rows = (await db`SELECT * FROM social.gifts ORDER BY sort ASC`) as Row[];
  return rows.map(mapGift);
}

export async function transactions(userId: string, kind?: string) {
  const db = getDb();
  const rows = (await db`
    SELECT * FROM social.transactions
    WHERE user_id = ${userId} AND (${kind ?? ""} = '' OR kind = ${kind ?? ""})
    ORDER BY created_at DESC
    LIMIT 40
  `) as Row[];
  return rows.map(mapTxn);
}

export async function receivedGifts(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT g.name, g.emoji, s.amount_naira, s.created_at, u.display_name
    FROM social.gift_sends s
    JOIN social.gifts g ON g.id = s.gift_id
    JOIN social.users u ON u.id = s.from_user
    WHERE s.to_user = ${userId}
    ORDER BY s.created_at DESC
    LIMIT 30
  `) as Row[];
  return rows.map((row) => ({
    name: String(row.name),
    emoji: String(row.emoji),
    amount: Number(row.amount_naira),
    createdAt: new Date(String(row.created_at)).toISOString(),
    fromName: String(row.display_name),
  }));
}

export async function leaderboard() {
  const db = getDb();
  const rows = (await db`
    SELECT id, username, display_name, avatar_url, verified, gift_total AS score
    FROM social.users
    WHERE onboarded = true
    ORDER BY gift_total DESC, display_name ASC
    LIMIT 12
  `) as Row[];
  return rows.map(mapLeader);
}

export async function creators() {
  const db = getDb();
  const rows = (await db`
    SELECT id, username, display_name, avatar_url, verified, followers_count AS score
    FROM social.users WHERE onboarded = true
    ORDER BY followers_count DESC LIMIT 12
  `) as Row[];
  return rows.map(mapLeader);
}

export async function mostActive() {
  const db = getDb();
  const rows = (await db`
    SELECT id, username, display_name, avatar_url, verified, posts_count AS score
    FROM social.users WHERE onboarded = true
    ORDER BY posts_count DESC LIMIT 12
  `) as Row[];
  return rows.map(mapLeader);
}

export async function listEvents(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT e.*, COALESCE(h.display_name, 'Nochalant') AS host_name, s.slug AS scene_slug,
      EXISTS(SELECT 1 FROM social.event_reminders r WHERE r.event_id = e.id AND r.user_id = ${userId}) AS reminded
    FROM social.events e
    LEFT JOIN social.users h ON h.id = e.host_id
    LEFT JOIN social.scenes s ON s.id = e.scene_id
    ORDER BY e.is_live DESC, e.starts_at ASC
  `) as Row[];
  return rows.map(mapEvent);
}

export async function listGames() {
  const db = getDb();
  const rows = (await db`SELECT * FROM social.games ORDER BY playing DESC`) as Row[];
  return rows.map(mapGame);
}

export async function liveMatch() {
  const db = getDb();
  const rows = (await db`
    SELECT m.id, m.watching, m.status, g.name AS game_name, a.display_name AS a_name, a.username AS a_user,
      b.display_name AS b_name, b.username AS b_user
    FROM social.matches m
    JOIN social.games g ON g.slug = m.game_slug
    LEFT JOIN social.users a ON a.id = m.player_a
    LEFT JOIN social.users b ON b.id = m.player_b
    WHERE m.status = 'live'
    ORDER BY m.created_at DESC
    LIMIT 1
  `) as Row[];
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: String(row.id),
    watching: Number(row.watching),
    gameName: String(row.game_name),
    aName: String(row.a_name ?? "Player"),
    aUser: String(row.a_user ?? ""),
    bName: String(row.b_name ?? "Player"),
    bUser: String(row.b_user ?? ""),
  };
}

export async function invites(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT id, kind, title, body, href, status, created_at
    FROM social.invites WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : null,
    status: String(row.status),
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}

export async function pendingInviteCount(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT COUNT(*)::int AS n FROM social.invites WHERE user_id = ${userId} AND status = 'pending'
  `) as Row[];
  return Number(rows[0]?.n ?? 0);
}

export async function followersOf(userId: string, me: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.*, EXISTS(
      SELECT 1 FROM social.follows f WHERE f.follower_id = ${me} AND f.following_id = u.id
    ) AS following
    FROM social.follows link
    JOIN social.users u ON u.id = link.follower_id
    WHERE link.following_id = ${userId}
    ORDER BY u.display_name
  `) as Row[];
  return rows.map(mapPerson);
}

export async function followingOf(userId: string, me: string) {
  const db = getDb();
  const rows = (await db`
    SELECT u.*, EXISTS(
      SELECT 1 FROM social.follows f WHERE f.follower_id = ${me} AND f.following_id = u.id
    ) AS following
    FROM social.follows link
    JOIN social.users u ON u.id = link.following_id
    WHERE link.follower_id = ${userId}
    ORDER BY u.display_name
  `) as Row[];
  return rows.map(mapPerson);
}

export async function savedPosts(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT p.*, u.username, u.display_name, u.avatar_url, u.verified,
      EXISTS(SELECT 1 FROM social.post_likes l WHERE l.post_id = p.id AND l.user_id = ${userId}) AS liked,
      true AS saved
    FROM social.saved_items s
    JOIN social.posts p ON p.id = s.ref_id
    JOIN social.users u ON u.id = p.user_id
    WHERE s.user_id = ${userId} AND s.kind = 'post'
    ORDER BY s.created_at DESC
  `) as Row[];
  return rows.map(mapPost);
}

export async function sceneHistory(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT s.*, h.display_name AS host_name, h.username AS host_username, g.slug AS group_slug, v.visited_at
    FROM social.scene_visits v
    JOIN social.scenes s ON s.id = v.scene_id
    LEFT JOIN social.users h ON h.id = s.host_id
    LEFT JOIN social.groups g ON g.id = s.group_id
    WHERE v.user_id = ${userId}
    ORDER BY v.visited_at DESC
  `) as Row[];
  return rows.map(mapScene);
}

export async function myScenes(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT s.*, h.display_name AS host_name, h.username AS host_username, g.slug AS group_slug
    FROM social.scene_members m
    JOIN social.scenes s ON s.id = m.scene_id
    LEFT JOIN social.users h ON h.id = s.host_id
    LEFT JOIN social.groups g ON g.id = s.group_id
    WHERE m.user_id = ${userId}
    ORDER BY s.is_live DESC, s.title
  `) as Row[];
  return rows.map(mapScene);
}

export async function activityFor(userId: string) {
  const db = getDb();
  const rows = (await db`
    SELECT id, title, body, href, created_at FROM social.notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC LIMIT 20
  `) as Row[];
  return rows.map((row) => ({
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    href: row.href ? String(row.href) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  }));
}
