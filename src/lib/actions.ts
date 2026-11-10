"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { INTERESTS, planById } from "./catalog";
import { getDb, type Row } from "./db";
import { clearSession, createSession, paystackConfigured, requireUser } from "./auth";
import { hashPassword, verifyPassword } from "./password";
import { markPaymentPaid } from "./payments";
import { slugify } from "./format";

export type FormState = { error: string };

const interestIds = new Set(INTERESTS.map((item) => item.id));

function clean(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function attachPublicInbox(userId: string) {
  const db = getDb();
  await db`
    INSERT INTO social.chat_members (chat_id, user_id, unread)
    SELECT id, ${userId}, CASE WHEN kind = 'system' THEN 1 ELSE 0 END
    FROM social.chats
    WHERE is_public = true
    ON CONFLICT DO NOTHING
  `;
  await db`
    INSERT INTO social.notifications (user_id, title, body, href)
    VALUES (
      ${userId},
      'Welcome to the Club',
      'Your people. Your scene. Your rules. Pull up.',
      '/home'
    )
  `;
}

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const username = clean(formData.get("username")).toLowerCase();
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return { error: "Use 3–20 letters, numbers, or underscores." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password needs at least 8 characters." };
  const db = getDb();
  const passwordHash = await hashPassword(password);
  let userId = "";
  try {
    const rows = (await db`
      INSERT INTO social.users (email, username, display_name, password_hash, location)
      VALUES (${email}, ${username}, ${username}, ${passwordHash}, 'Nigeria')
      RETURNING id
    `) as Row[];
    userId = String(rows[0].id);
  } catch {
    return { error: "That email or username is already taken." };
  }
  await createSession(userId);
  redirect("/onboarding");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = clean(formData.get("email")).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const db = getDb();
  const rows = (await db`
    SELECT id, password_hash, onboarded FROM social.users WHERE email = ${email} LIMIT 1
  `) as Row[];
  const user = rows[0];
  if (!user?.password_hash || !(await verifyPassword(password, String(user.password_hash)))) {
    return { error: "Email or password is incorrect." };
  }
  await createSession(String(user.id));
  redirect(user.onboarded ? "/home" : "/onboarding");
}

export async function signOut() {
  await clearSession();
  redirect("/");
}

export async function saveOnboarding(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const displayName = clean(formData.get("displayName")).slice(0, 40);
  const bio = clean(formData.get("bio")).slice(0, 150);
  const interests = formData.getAll("interests").map(String).filter((item) => interestIds.has(item));
  const avatar = String(formData.get("avatar") ?? "");
  if (displayName.length < 2) return { error: "Add a display name." };
  if (interests.length < 3) return { error: "Choose at least 3 interests." };
  if (avatar && !/^data:image\/(png|jpeg|webp);base64,/i.test(avatar)) {
    return { error: "Use a PNG, JPG, or WebP photo." };
  }
  if (avatar.length > 450_000) return { error: "That photo is too large. Try one under 300KB." };
  const db = getDb();
  await db`
    UPDATE social.users
    SET display_name = ${displayName},
        bio = ${bio},
        interests = ${interests},
        avatar_url = ${avatar || null},
        onboarded = true
    WHERE id = ${user.id}
  `;
  if (!user.onboarded) await attachPublicInbox(user.id);
  redirect("/ready");
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const displayName = clean(formData.get("displayName")).slice(0, 40);
  const bio = clean(formData.get("bio")).slice(0, 150);
  const location = clean(formData.get("location")).slice(0, 60) || "Nigeria";
  const interests = formData.getAll("interests").map(String).filter((item) => interestIds.has(item));
  const avatar = String(formData.get("avatar") ?? "");
  if (displayName.length < 2) return { error: "Add a display name." };
  if (interests.length < 3) return { error: "Choose at least 3 interests." };
  if (avatar && (!/^data:image\/(png|jpeg|webp);base64,/i.test(avatar) || avatar.length > 450_000)) {
    return { error: "Use a smaller PNG, JPG, or WebP photo." };
  }
  const db = getDb();
  await db`
    UPDATE social.users
    SET display_name = ${displayName},
        bio = ${bio},
        location = ${location},
        interests = ${interests},
        avatar_url = CASE WHEN ${avatar} = '' THEN avatar_url ELSE ${avatar} END
    WHERE id = ${user.id}
  `;
  revalidatePath("/profile");
  redirect("/profile");
}

export async function createPlace(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const sceneType = clean(formData.get("sceneType"));
  const title = clean(formData.get("title")).slice(0, 80);
  const description = clean(formData.get("description")).slice(0, 200);
  const category = clean(formData.get("category")) || "Talk";
  const isPrivate = formData.get("isPrivate") === "on";
  const isAdult = formData.get("isAdult") === "on";
  if (!["voice", "chat", "group", "game"].includes(sceneType)) return { error: "Choose a scene type." };
  if (title.length < 3) return { error: "Add a title." };
  const db = getDb();
  if (sceneType === "group") {
    const slug = slugify(title);
    const rows = (await db`
      INSERT INTO social.groups (slug, name, description, category, icon, owner_id, member_count)
      VALUES (${slug}, ${title}, ${description}, ${category}, '👥', ${user.id}, 1)
      RETURNING id
    `) as Row[];
    await db`
      INSERT INTO social.group_members (group_id, user_id, role) VALUES (${String(rows[0].id)}, ${user.id}, 'owner')
    `;
    const chat = (await db`
      INSERT INTO social.chats (kind, title, group_id, is_public, last_body, icon)
      VALUES ('group', ${title}, ${String(rows[0].id)}, ${!isPrivate}, 'The group is open.', '👥')
      RETURNING id
    `) as Row[];
    await db`
      INSERT INTO social.chat_members (chat_id, user_id, unread) VALUES (${String(chat[0].id)}, ${user.id}, 0)
    `;
    revalidatePath("/discover");
    redirect(`/group/${slug}`);
  }
  const slug = slugify(title);
  const rows = (await db`
    INSERT INTO social.scenes (
      slug, title, description, scene_type, category, host_id, is_private, is_adult, is_live, listener_count, cover_key, pinned_message
    ) VALUES (
      ${slug}, ${title}, ${description}, ${sceneType}, ${category}, ${user.id}, ${isPrivate}, ${isAdult}, true, 1,
      ${sceneType === "game" ? "game" : sceneType === "chat" ? "chat" : "mic"},
      ${"Welcome in. Be respectful, keep it real, and stay on topic."}
    )
    RETURNING id
  `) as Row[];
  const sceneId = String(rows[0].id);
  await db`
    INSERT INTO social.scene_members (scene_id, user_id, role) VALUES (${sceneId}, ${user.id}, 'host')
  `;
  const chat = (await db`
    INSERT INTO social.chats (kind, title, scene_id, is_public, last_body, icon)
    VALUES ('scene', ${title}, ${sceneId}, ${!isPrivate}, 'The room is live.', '🎙️')
    RETURNING id
  `) as Row[];
  await db`INSERT INTO social.chat_members (chat_id, user_id, unread) VALUES (${String(chat[0].id)}, ${user.id}, 0)`;
  revalidatePath("/home");
  redirect(`/scene/${slug}`);
}

export async function joinScene(slug: string) {
  const user = await requireUser();
  const db = getDb();
  const scenes = (await db`SELECT id, is_private FROM social.scenes WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!scenes[0]) return;
  const sceneId = String(scenes[0].id);
  await db`
    INSERT INTO social.scene_members (scene_id, user_id, role)
    VALUES (${sceneId}, ${user.id}, 'listener')
    ON CONFLICT DO NOTHING
  `;
  await db`
    INSERT INTO social.scene_visits (user_id, scene_id, visited_at)
    VALUES (${user.id}, ${sceneId}, now())
    ON CONFLICT (user_id, scene_id) DO UPDATE SET visited_at = now()
  `;
  revalidatePath(`/scene/${slug}`);
}

export async function leaveScene(slug: string) {
  const user = await requireUser();
  const db = getDb();
  await db`
    DELETE FROM social.scene_members
    WHERE user_id = ${user.id}
      AND scene_id = (SELECT id FROM social.scenes WHERE slug = ${slug})
      AND role <> 'host'
  `;
  revalidatePath("/home");
  redirect("/home");
}

export async function requestSpeak(slug: string) {
  const user = await requireUser();
  const db = getDb();
  const scenes = (await db`SELECT id FROM social.scenes WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!scenes[0]) return { error: "Scene not found." };
  const sceneId = String(scenes[0].id);
  await joinScene(slug);
  await db`
    INSERT INTO social.speak_requests (scene_id, user_id, status)
    VALUES (${sceneId}, ${user.id}, 'pending')
    ON CONFLICT (scene_id, user_id) DO UPDATE SET status = 'pending'
  `;
  revalidatePath(`/scene/${slug}`);
  return { error: "" };
}

export async function decideSpeak(requestUserId: string, slug: string, accept: boolean) {
  const user = await requireUser();
  const db = getDb();
  const scenes = (await db`SELECT id, host_id FROM social.scenes WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!scenes[0] || String(scenes[0].host_id) !== user.id) return;
  const sceneId = String(scenes[0].id);
  if (accept) {
    await db`
      INSERT INTO social.scene_members (scene_id, user_id, role)
      VALUES (${sceneId}, ${requestUserId}, 'speaker')
      ON CONFLICT (scene_id, user_id) DO UPDATE SET role = 'speaker'
    `;
  }
  await db`
    UPDATE social.speak_requests SET status = ${accept ? "accepted" : "declined"}
    WHERE scene_id = ${sceneId} AND user_id = ${requestUserId}
  `;
  revalidatePath(`/scene/${slug}`);
}

export async function setMuted(slug: string, muted: boolean) {
  const user = await requireUser();
  const db = getDb();
  await db`
    UPDATE social.scene_members SET muted = ${muted}
    WHERE user_id = ${user.id} AND scene_id = (SELECT id FROM social.scenes WHERE slug = ${slug})
  `;
}

export async function postSceneMessage(slug: string, body: string) {
  const user = await requireUser();
  const text = body.trim().slice(0, 500);
  if (!text) return;
  const db = getDb();
  const scenes = (await db`SELECT id FROM social.scenes WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!scenes[0]) return;
  const sceneId = String(scenes[0].id);
  await db`
    INSERT INTO social.scene_members (scene_id, user_id, role)
    VALUES (${sceneId}, ${user.id}, 'listener')
    ON CONFLICT DO NOTHING
  `;
  await db`
    INSERT INTO social.scene_messages (scene_id, user_id, body) VALUES (${sceneId}, ${user.id}, ${text})
  `;
  await db`
    UPDATE social.chats SET last_body = ${text}, last_at = now() WHERE scene_id = ${sceneId}
  `;
  revalidatePath(`/scene/${slug}`);
}

export async function likeSceneMessage(messageId: string, slug: string) {
  const user = await requireUser();
  const db = getDb();
  const existing = (await db`
    SELECT 1 FROM social.scene_message_likes WHERE message_id = ${messageId} AND user_id = ${user.id}
  `) as Row[];
  if (existing.length) {
    await db`DELETE FROM social.scene_message_likes WHERE message_id = ${messageId} AND user_id = ${user.id}`;
    await db`UPDATE social.scene_messages SET likes = GREATEST(likes - 1, 0) WHERE id = ${messageId}`;
  } else {
    await db`INSERT INTO social.scene_message_likes (message_id, user_id) VALUES (${messageId}, ${user.id})`;
    await db`UPDATE social.scene_messages SET likes = likes + 1 WHERE id = ${messageId}`;
  }
  revalidatePath(`/scene/${slug}`);
}

export async function updateScene(slug: string, formData: FormData) {
  const user = await requireUser();
  const db = getDb();
  const title = clean(formData.get("title")).slice(0, 80);
  const description = clean(formData.get("description")).slice(0, 200);
  const isPrivate = formData.get("isPrivate") === "on";
  const isAdult = formData.get("isAdult") === "on";
  await db`
    UPDATE social.scenes
    SET title = ${title}, description = ${description}, is_private = ${isPrivate}, is_adult = ${isAdult}
    WHERE slug = ${slug} AND host_id = ${user.id}
  `;
  revalidatePath(`/scene/${slug}`);
  redirect(`/scene/${slug}?tab=people`);
}

export async function invitePerson(slug: string, personId: string) {
  const user = await requireUser();
  const db = getDb();
  const scenes = (await db`SELECT id, title FROM social.scenes WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!scenes[0]) return;
  await db`
    INSERT INTO social.invites (user_id, kind, title, body, href)
    VALUES (
      ${personId},
      'scene',
      ${`${user.displayName} invited you`},
      ${`Pull up to ${String(scenes[0].title)}.`},
      ${`/scene/${slug}`}
    )
  `;
  await db`
    INSERT INTO social.notifications (user_id, title, body, href)
    VALUES (${personId}, 'Scene invite', ${`${user.displayName} invited you to ${String(scenes[0].title)}.`}, ${`/scene/${slug}`})
  `;
  revalidatePath(`/scene/${slug}/invite`);
}

export async function toggleFollow(targetId: string) {
  const user = await requireUser();
  if (user.id === targetId) return;
  const db = getDb();
  const existing = (await db`
    SELECT 1 FROM social.follows WHERE follower_id = ${user.id} AND following_id = ${targetId}
  `) as Row[];
  if (existing.length) {
    await db`DELETE FROM social.follows WHERE follower_id = ${user.id} AND following_id = ${targetId}`;
    await db`UPDATE social.users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ${targetId}`;
    await db`UPDATE social.users SET following_count = GREATEST(following_count - 1, 0) WHERE id = ${user.id}`;
  } else {
    await db`INSERT INTO social.follows (follower_id, following_id) VALUES (${user.id}, ${targetId})`;
    await db`UPDATE social.users SET followers_count = followers_count + 1 WHERE id = ${targetId}`;
    await db`UPDATE social.users SET following_count = following_count + 1 WHERE id = ${user.id}`;
    await db`
      INSERT INTO social.notifications (user_id, title, body, href)
      VALUES (${targetId}, 'New follower', ${`${user.displayName} followed you.`}, ${`/u/${user.username}`})
    `;
  }
  revalidatePath("/discover");
  revalidatePath("/profile");
}

export async function toggleGroup(slug: string) {
  const user = await requireUser();
  const db = getDb();
  const groups = (await db`SELECT id FROM social.groups WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!groups[0]) return;
  const groupId = String(groups[0].id);
  const existing = (await db`
    SELECT 1 FROM social.group_members WHERE group_id = ${groupId} AND user_id = ${user.id}
  `) as Row[];
  if (existing.length) {
    await db`DELETE FROM social.group_members WHERE group_id = ${groupId} AND user_id = ${user.id} AND role <> 'owner'`;
  } else {
    await db`INSERT INTO social.group_members (group_id, user_id, role) VALUES (${groupId}, ${user.id}, 'member')`;
    const chats = (await db`SELECT id FROM social.chats WHERE group_id = ${groupId} LIMIT 1`) as Row[];
    if (chats[0]) {
      await db`
        INSERT INTO social.chat_members (chat_id, user_id, unread)
        VALUES (${String(chats[0].id)}, ${user.id}, 0)
        ON CONFLICT DO NOTHING
      `;
    }
  }
  revalidatePath(`/group/${slug}`);
}

export async function createPost(slug: string, formData: FormData) {
  const user = await requireUser();
  const body = clean(formData.get("body")).slice(0, 600);
  const tag = clean(formData.get("tag")) || "all";
  if (body.length < 2) return;
  const db = getDb();
  const groups = (await db`SELECT id FROM social.groups WHERE slug = ${slug} LIMIT 1`) as Row[];
  if (!groups[0]) return;
  await db`
    INSERT INTO social.posts (group_id, user_id, body, tag)
    VALUES (${String(groups[0].id)}, ${user.id}, ${body}, ${tag})
  `;
  await db`UPDATE social.users SET posts_count = posts_count + 1 WHERE id = ${user.id}`;
  revalidatePath(`/group/${slug}`);
}

export async function togglePostLike(postId: string) {
  const user = await requireUser();
  const db = getDb();
  const existing = (await db`
    SELECT 1 FROM social.post_likes WHERE post_id = ${postId} AND user_id = ${user.id}
  `) as Row[];
  if (existing.length) {
    await db`DELETE FROM social.post_likes WHERE post_id = ${postId} AND user_id = ${user.id}`;
    await db`UPDATE social.posts SET likes = GREATEST(likes - 1, 0) WHERE id = ${postId}`;
  } else {
    await db`INSERT INTO social.post_likes (post_id, user_id) VALUES (${postId}, ${user.id})`;
    await db`UPDATE social.posts SET likes = likes + 1 WHERE id = ${postId}`;
  }
  revalidatePath("/group");
}

export async function commentOnPost(postId: string, slug: string, formData: FormData) {
  const user = await requireUser();
  const body = clean(formData.get("body")).slice(0, 400);
  if (!body) return;
  const db = getDb();
  await db`INSERT INTO social.comments (post_id, user_id, body) VALUES (${postId}, ${user.id}, ${body})`;
  await db`UPDATE social.posts SET comments_count = comments_count + 1 WHERE id = ${postId}`;
  revalidatePath(`/group/${slug}`);
}

export async function repost(postId: string) {
  const user = await requireUser();
  const db = getDb();
  await db`UPDATE social.posts SET reposts = reposts + 1 WHERE id = ${postId}`;
  await db`
    INSERT INTO social.notifications (user_id, title, body, href)
    SELECT user_id, 'Repost', ${`${user.displayName} reposted you.`}, '/profile'
    FROM social.posts WHERE id = ${postId}
  `;
  revalidatePath("/group");
}

export async function toggleSave(postId: string) {
  const user = await requireUser();
  const db = getDb();
  const existing = (await db`
    SELECT 1 FROM social.saved_items WHERE user_id = ${user.id} AND kind = 'post' AND ref_id = ${postId}
  `) as Row[];
  if (existing.length) {
    await db`DELETE FROM social.saved_items WHERE user_id = ${user.id} AND kind = 'post' AND ref_id = ${postId}`;
  } else {
    await db`INSERT INTO social.saved_items (user_id, kind, ref_id) VALUES (${user.id}, 'post', ${postId})`;
  }
  revalidatePath("/profile/saved");
}

export async function sendChat(chatId: string, formData: FormData) {
  const user = await requireUser();
  const body = clean(formData.get("body")).slice(0, 500);
  if (!body) return;
  const db = getDb();
  const member = (await db`
    SELECT 1 FROM social.chat_members WHERE chat_id = ${chatId} AND user_id = ${user.id}
  `) as Row[];
  if (!member.length) return;
  await db`INSERT INTO social.chat_messages (chat_id, user_id, body) VALUES (${chatId}, ${user.id}, ${body})`;
  await db`UPDATE social.chats SET last_body = ${body}, last_at = now() WHERE id = ${chatId}`;
  await db`
    UPDATE social.chat_members SET unread = unread + 1
    WHERE chat_id = ${chatId} AND user_id <> ${user.id}
  `;
  revalidatePath(`/chats/${chatId}`);
  revalidatePath("/chats");
}

export async function markChatRead(chatId: string) {
  const user = await requireUser();
  const db = getDb();
  await db`UPDATE social.chat_members SET unread = 0 WHERE chat_id = ${chatId} AND user_id = ${user.id}`;
}

export async function sendGift(formData: FormData) {
  const user = await requireUser();
  const giftId = clean(formData.get("giftId"));
  const toUser = clean(formData.get("toUser"));
  const sceneId = clean(formData.get("sceneId"));
  const db = getDb();
  const gifts = (await db`SELECT price_naira, name FROM social.gifts WHERE id = ${giftId} LIMIT 1`) as Row[];
  if (!gifts[0] || !toUser || toUser === user.id) return { error: "Pick a gift and someone to receive it." };
  const price = Number(gifts[0].price_naira);
  const paid = (await db`
    WITH pay AS (
      UPDATE social.users
      SET wallet_naira = wallet_naira - ${price}, gift_total = gift_total + ${price}
      WHERE id = ${user.id} AND wallet_naira >= ${price}
      RETURNING id
    ),
    credit AS (
      UPDATE social.users
      SET wallet_naira = wallet_naira + ${price}, gifts_received = gifts_received + 1
      WHERE id = ${toUser} AND EXISTS (SELECT 1 FROM pay)
      RETURNING id
    )
    INSERT INTO social.gift_sends (gift_id, from_user, to_user, scene_id, amount_naira)
    SELECT ${giftId}, ${user.id}, ${toUser}, ${sceneId || null}, ${price}
    WHERE EXISTS (SELECT 1 FROM credit)
    RETURNING id
  `) as Row[];
  if (!paid.length) return { error: "Your balance is too low for that gift." };
  await db`
    INSERT INTO social.transactions (user_id, kind, amount_naira, title, detail)
    VALUES (${user.id}, 'gift_out', ${-price}, ${String(gifts[0].name)}, 'Gift sent')
  `;
  await db`
    INSERT INTO social.transactions (user_id, kind, amount_naira, title, detail)
    VALUES (${toUser}, 'gift_in', ${price}, 'Gift received', ${`From ${user.displayName}`})
  `;
  await db`
    INSERT INTO social.notifications (user_id, title, body, href)
    VALUES (${toUser}, 'Gift received', ${`${user.displayName} sent you ${String(gifts[0].name)}.`}, '/wallet/gifts')
  `;
  revalidatePath("/wallet");
  revalidatePath("/gifts");
  revalidatePath("/leaderboard");
  return { error: "" };
}

export async function remindEvent(eventId: string) {
  const user = await requireUser();
  const db = getDb();
  const existing = (await db`
    SELECT 1 FROM social.event_reminders WHERE event_id = ${eventId} AND user_id = ${user.id}
  `) as Row[];
  if (existing.length) {
    await db`DELETE FROM social.event_reminders WHERE event_id = ${eventId} AND user_id = ${user.id}`;
  } else {
    await db`INSERT INTO social.event_reminders (event_id, user_id) VALUES (${eventId}, ${user.id})`;
  }
  revalidatePath("/events");
}

export async function startCheckout(planId: string) {
  const user = await requireUser();
  const plan = planById(planId);
  if (!plan) return;
  const db = getDb();
  const reference = `nc_${randomUUID()}`;
  await db`
    INSERT INTO social.payments (user_id, reference, purpose, plan, amount_naira, status)
    VALUES (${user.id}, ${reference}, 'pro', ${plan.id}, ${plan.price}, 'pending')
  `;
  if (!paystackConfigured()) redirect(`/pro/checkout?reference=${reference}`);
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: plan.price * 100,
      reference,
      callback_url: `${origin}/pro/callback?reference=${reference}`,
      metadata: { plan: plan.id, purpose: "pro" },
    }),
  });
  const json = (await response.json()) as { status?: boolean; data?: { authorization_url?: string } };
  if (!json.status || !json.data?.authorization_url) redirect(`/pro/checkout?reference=${reference}&error=paystack`);
  redirect(json.data.authorization_url);
}

export async function startTopUp(formData: FormData) {
  const user = await requireUser();
  const amount = Math.round(Number(formData.get("amount")));
  if (!Number.isFinite(amount) || amount < 100 || amount > 1_000_000) return;
  const db = getDb();
  const reference = `nc_${randomUUID()}`;
  await db`
    INSERT INTO social.payments (user_id, reference, purpose, amount_naira, status)
    VALUES (${user.id}, ${reference}, 'wallet', ${amount}, 'pending')
  `;
  if (!paystackConfigured()) redirect(`/wallet/add?reference=${reference}`);
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: amount * 100,
      reference,
      callback_url: `${origin}/wallet/add?reference=${reference}`,
      metadata: { purpose: "wallet" },
    }),
  });
  const json = (await response.json()) as { status?: boolean; data?: { authorization_url?: string } };
  if (!json.status || !json.data?.authorization_url) redirect(`/wallet/add?reference=${reference}&error=paystack`);
  redirect(json.data.authorization_url);
}

export async function completeTestPayment(reference: string) {
  const user = await requireUser();
  const db = getDb();
  const rows = (await db`
    SELECT user_id FROM social.payments WHERE reference = ${reference} LIMIT 1
  `) as Row[];
  if (!rows[0] || String(rows[0].user_id) !== user.id) return;
  if (paystackConfigured()) return;
  await markPaymentPaid(reference);
  revalidatePath("/wallet");
  revalidatePath("/profile");
  redirect("/wallet");
}

export async function withdraw(formData: FormData) {
  const user = await requireUser();
  const amount = Math.round(Number(formData.get("amount")));
  const bank = clean(formData.get("bank")).slice(0, 40);
  const account = clean(formData.get("account")).replace(/\D/g, "").slice(0, 12);
  if (!bank || account.length < 10 || !Number.isFinite(amount) || amount < 100) return;
  const db = getDb();
  const paid = (await db`
    UPDATE social.users
    SET wallet_naira = wallet_naira - ${amount}, bank_name = ${bank}, account_number = ${account}
    WHERE id = ${user.id} AND wallet_naira >= ${amount}
    RETURNING id
  `) as Row[];
  if (!paid.length) return;
  await db`
    INSERT INTO social.transactions (user_id, kind, amount_naira, title, detail)
    VALUES (
      ${user.id},
      'withdrawal',
      ${-amount},
      'Withdrawal',
      ${`To ${bank} ****${account.slice(-4)} · pending review`}
    )
  `;
  revalidatePath("/wallet");
  redirect("/wallet");
}

export async function savePayout(formData: FormData) {
  const user = await requireUser();
  const bank = clean(formData.get("bank")).slice(0, 40);
  const account = clean(formData.get("account")).replace(/\D/g, "").slice(0, 12);
  const name = clean(formData.get("accountName")).slice(0, 60);
  const db = getDb();
  await db`
    UPDATE social.users SET bank_name = ${bank}, account_number = ${account}, account_name = ${name}
    WHERE id = ${user.id}
  `;
  revalidatePath("/wallet/payout");
  redirect("/wallet");
}

export async function markNotesRead() {
  const user = await requireUser();
  const db = getDb();
  await db`UPDATE social.notifications SET read = true WHERE user_id = ${user.id}`;
  revalidatePath("/notifications");
}

export async function respondInvite(id: string, accept: boolean) {
  const user = await requireUser();
  const db = getDb();
  await db`
    UPDATE social.invites SET status = ${accept ? "accepted" : "declined"}
    WHERE id = ${id} AND user_id = ${user.id}
  `;
  revalidatePath("/invites");
  revalidatePath("/chats");
}
