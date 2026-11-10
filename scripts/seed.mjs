import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import pg from "pg";
import catalog from "../db/catalog.json" with { type: "json" };

function loadEnv() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch {
    // env already present
  }
}

loadEnv();

const email = process.env.SEED_ADMIN_EMAIL || "fluxbeatempire@gmail.com";
const password = process.env.SEED_ADMIN_PASSWORD;
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!password) {
  console.error("SEED_ADMIN_PASSWORD is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const reset = process.argv.includes("--reset");
const existing = await client.query("SELECT COUNT(*)::int AS n FROM social.users");
if (existing.rows[0].n > 0 && !reset) {
  const hash = await bcrypt.hash(password, 10);
  await client.query(
    `UPDATE social.users SET password_hash = $1, email = $2, is_admin = true WHERE username = 'godwin'`,
    [hash, email],
  );
  console.log("social data already present; refreshed the owner password");
  await client.end();
  process.exit(0);
}

const ago = (minutes) => new Date(Date.now() - minutes * 60_000);
const hash = await bcrypt.hash(password, 10);

const people = [
  ["godwin", email, "Godwin", "Building the club. Your people. Your scene. Your rules.", "Lagos, Nigeria", ["Music", "Movies & TV", "Naija & Culture", "Trending"], true, true, 56750, 186, 4820, 312, 420000, 12, hash],
  ["blaqsoul", "blaqsoul@nochalant.app", "BlaqSoul", "Host of The Lounge. Movies, music, and real gist.", "Lagos, Nigeria", ["Movies & TV", "Music", "Gossip"], true, false, 88000, 2480, 14300, 890, 3450000, 40, null],
  ["tiana", "tiana@nochalant.app", "Tiana", "Movie head. Trailer first, opinion second.", "Abuja, Nigeria", ["Movies & TV", "Relationships", "Lifestyle"], true, false, 24000, 860, 12400, 640, 1450000, 18, null],
  ["deekay", "deekay@nochalant.app", "DeeKay", "Speaker. Facts over drama.", "Lagos, Nigeria", ["Music", "Trending", "Sports"], true, false, 31000, 540, 8700, 410, 1920000, 22, null],
  ["amara", "amara@nochalant.app", "Amara", "Peace, loyalty, and consistent effort.", "Port Harcourt, Nigeria", ["Relationships", "Lifestyle", "Music"], true, false, 45000, 1320, 29100, 1200, 2780000, 30, null],
  ["khalz", "khalz@nochalant.app", "Khalz", "Games all night.", "Ibadan, Nigeria", ["Games", "Sports", "Trending"], false, false, 8000, 120, 6400, 210, 1210000, 4, null],
  ["movieplug", "movieplug@nochalant.app", "MoviePlug", "New releases, no spoilers. Mostly.", "Lagos, Nigeria", ["Movies & TV", "Gossip", "Naija & Culture"], true, false, 15000, 430, 9800, 300, 980000, 9, null],
  ["vibequeen", "vibequeen@nochalant.app", "VibeQueen", "If the song is right, I stay.", "Enugu, Nigeria", ["Music", "Lifestyle", "Relationships"], false, false, 12000, 260, 7200, 500, 765000, 7, null],
  ["naijagist", "naijagist@nochalant.app", "NaijaGist", "The timeline, but louder.", "Lagos, Nigeria", ["Gossip", "Naija & Culture", "Trending"], true, false, 9000, 980, 15400, 220, 610000, 6, null],
  ["kingflex", "kingflex@nochalant.app", "KingFlex", "Communication is everything.", "Abuja, Nigeria", ["Music", "Games", "Sports"], false, false, 4000, 70, 2100, 180, 240000, 2, null],
  ["sade", "sade@nochalant.app", "Sade", "Here for the rooms.", "Lagos, Nigeria", ["Music", "Lifestyle", "Gossip"], false, false, 2500, 40, 900, 80, 80000, 1, null],
];

await client.query("BEGIN");
try {
  await client.query("TRUNCATE social.users RESTART IDENTITY CASCADE");
  await client.query("TRUNCATE social.gifts, social.games RESTART IDENTITY CASCADE");

  for (const gift of catalog.gifts) {
    await client.query(
      `INSERT INTO social.gifts (id, name, price_naira, emoji, category, sort) VALUES ($1,$2,$3,$4,$5,$6)`,
      [gift.id, gift.name, gift.price, gift.emoji, gift.category, gift.sort],
    );
  }
  for (const game of [
    ["whot", "Whot", "The card game every Nigerian table knows.", 4328, "cards"],
    ["checkmate", "Checkmate", "Chess. Quiet minds, loud boards.", 2917, "chess"],
    ["ludo", "Ludo", "Roll, chase, and talk your smoke.", 6751, "ludo"],
    ["more", "More Games", "Dominoes, Draft, Trivia and more.", 860, "more"],
  ]) {
    await client.query(
      `INSERT INTO social.games (slug, name, blurb, playing, cover_key) VALUES ($1,$2,$3,$4,$5)`,
      game,
    );
  }

  const ids = {};
  for (const person of people) {
    const result = await client.query(
      `INSERT INTO social.users (
        username, email, display_name, bio, location, interests, verified, is_admin, wallet_naira,
        posts_count, followers_count, following_count, gift_total, gifts_received, password_hash, onboarded, is_pro
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true,false) RETURNING id`,
      person,
    );
    ids[person[0]] = result.rows[0].id;
  }

  const follows = [
    ["godwin", "tiana"],
    ["godwin", "deekay"],
    ["godwin", "amara"],
    ["tiana", "blaqsoul"],
    ["amara", "tiana"],
    ["deekay", "blaqsoul"],
    ["blaqsoul", "amara"],
  ];
  for (const [from, to] of follows) {
    await client.query(`INSERT INTO social.follows (follower_id, following_id) VALUES ($1,$2)`, [ids[from], ids[to]]);
  }

  async function group(slug, name, description, category, icon, owner, members) {
    const result = await client.query(
      `INSERT INTO social.groups (slug, name, description, category, icon, owner_id, member_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [slug, name, description, category, icon, ids[owner], members],
    );
    return result.rows[0].id;
  }

  const movie = await group(
    "movie-heads",
    "Movie Heads",
    "A community for movie lovers. Talk new releases, trailers, reviews, Naija films and everything entertainment.",
    "Movies",
    "🎬",
    "blaqsoul",
    18700,
  );
  const gist = await group("naija-gist", "Naija Gist", "The group chat the timeline wishes it was.", "Gossip", "🇳🇬", "naijagist", 24500);
  const games = await group("game-zone", "Game Zone", "Whot, Ludo, chess, and the arguments that come with them.", "Games", "🎮", "khalz", 12900);
  const love = await group("relationships", "Relationships", "No cap. Just the real talk.", "Relationships", "❤️", "amara", 20100);

  for (const [groupId, username, role] of [
    [movie, "blaqsoul", "owner"],
    [movie, "tiana", "member"],
    [movie, "godwin", "member"],
    [movie, "amara", "member"],
    [gist, "naijagist", "owner"],
    [gist, "godwin", "member"],
    [games, "khalz", "owner"],
    [games, "deekay", "member"],
    [love, "amara", "owner"],
    [love, "tiana", "member"],
  ]) {
    await client.query(`INSERT INTO social.group_members (group_id, user_id, role) VALUES ($1,$2,$3)`, [groupId, ids[username], role]);
  }

  async function scene(row) {
    const result = await client.query(
      `INSERT INTO social.scenes (
        slug, title, description, scene_type, category, host_id, group_id, is_private, is_adult, is_live,
        listener_count, tags, pinned_message, trend_label, cover_key
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      row,
    );
    return result.rows[0].id;
  }

  const lounge = await scene([
    "the-lounge",
    "The Lounge",
    "Real talk, music, gist, life, and everything in between. Pull up!",
    "voice",
    "Talk",
    ids.blaqsoul,
    null,
    false,
    true,
    true,
    1200,
    ["NaijaGist", "Music", "Lifestyle", "Relationships"],
    "Welcome to The Lounge! Be respectful, keep it real and stay on topic. No hate, no spam.",
    "12.4K members",
    "mic",
  ]);
  const naijaLive = await scene([
    "naija-gist-vibes",
    "Naija Gist & Vibes",
    "Talk, entertainment, and whatever just dropped.",
    "voice",
    "Talk",
    ids.naijagist,
    gist,
    false,
    false,
    true,
    324,
    ["Gossip", "Naija"],
    null,
    null,
    "cast-a",
  ]);
  const music = await scene([
    "music-chill",
    "Music & Chill",
    "Headphones on. Opinions loud.",
    "voice",
    "Music",
    ids.vibequeen,
    null,
    false,
    false,
    true,
    178,
    ["Music", "Vibes"],
    null,
    null,
    "cast-b",
  ]);
  const rel = await scene([
    "relationships-no-cap",
    "Relationships No Cap",
    "Talk and life, with the filter off.",
    "voice",
    "Relationships",
    ids.amara,
    love,
    false,
    true,
    true,
    96,
    ["Relationships", "Life"],
    null,
    null,
    "cast-c",
  ]);
  const movieScene = await scene([
    "movie-heads-live",
    "Movie Heads",
    "Reviews, trailers, and Nollywood arguments.",
    "voice",
    "Movies",
    ids.tiana,
    movie,
    false,
    false,
    false,
    89,
    ["Movies"],
    null,
    "8.9K members",
    "clapper",
  ]);
  const gameScene = await scene([
    "game-zone-live",
    "Game Zone",
    "A table is always open.",
    "game",
    "Games",
    ids.khalz,
    games,
    false,
    false,
    true,
    62,
    ["Games"],
    null,
    "6.2K members",
    "game",
  ]);

  const cast = [
    [lounge, "blaqsoul", "host"],
    [lounge, "tiana", "cohost"],
    [lounge, "deekay", "speaker"],
    [lounge, "amara", "speaker"],
    [lounge, "kingflex", "listener"],
    [lounge, "khalz", "listener"],
    [lounge, "movieplug", "listener"],
    [lounge, "vibequeen", "listener"],
    [lounge, "naijagist", "listener"],
    [lounge, "sade", "listener"],
    [naijaLive, "naijagist", "host"],
    [naijaLive, "godwin", "listener"],
    [music, "vibequeen", "host"],
    [music, "deekay", "speaker"],
    [rel, "amara", "host"],
    [rel, "tiana", "cohost"],
    [movieScene, "tiana", "host"],
    [movieScene, "blaqsoul", "speaker"],
    [gameScene, "khalz", "host"],
    [gameScene, "kingflex", "speaker"],
  ];
  for (const [sceneId, username, role] of cast) {
    await client.query(`INSERT INTO social.scene_members (scene_id, user_id, role) VALUES ($1,$2,$3)`, [
      sceneId,
      ids[username],
      role,
    ]);
  }
  for (const username of ["khalz", "movieplug", "vibequeen", "naijagist", "kingflex", "sade"]) {
    await client.query(
      `INSERT INTO social.speak_requests (scene_id, user_id, status) VALUES ($1,$2,'pending')`,
      [lounge, ids[username]],
    );
  }

  const lines = [
    ["blaqsoul", "What's the topic for tonight? 👀", 56, 2],
    ["tiana", "Let's talk: “Relationships in 2026” — what's really working and what's not? 👇", 42, 2],
    ["deekay", "Facts! A lot has changed. People are now more about peace than drama. 💯", 38, 1],
    ["amara", "Peace, loyalty and consistent effort — that's the new flex. 🧡", 76, 1],
    ["kingflex", "Agreed! Communication is everything. 👏", 24, 0],
  ];
  for (const [username, body, likes, minutes] of lines) {
    await client.query(
      `INSERT INTO social.scene_messages (scene_id, user_id, body, likes, created_at) VALUES ($1,$2,$3,$4,$5)`,
      [lounge, ids[username], body, likes, ago(minutes)],
    );
  }

  const post = await client.query(
    `INSERT INTO social.posts (group_id, user_id, body, media_key, tag, likes, comments_count, reposts, created_at)
     VALUES ($1,$2,$3,'gladiator','reviews',624,118,34,$4) RETURNING id`,
    [
      movie,
      ids.blaqsoul,
      "Just watched Gladiator II — the visuals, the scale, the acting... pure cinema! 🔥 Anyone else seen it?",
      ago(120),
    ],
  );
  await client.query(
    `INSERT INTO social.posts (group_id, user_id, body, tag, likes, comments_count, reposts, created_at)
     VALUES ($1,$2,$3,'trending',210,64,12,$4)`,
    [movie, ids.tiana, "Top 5 Nollywood movies of 2026 so far? Drop your list! 👇", ago(300)],
  );
  await client.query(
    `INSERT INTO social.posts (group_id, user_id, body, tag, likes, comments_count, reposts, created_at)
     VALUES ($1,$2,$3,'news',88,19,4,$4)`,
    [movie, ids.movieplug, "New trailer alert: the Lagos cut just landed. No spoilers in the replies. 🎬", ago(40)],
  );
  await client.query(`INSERT INTO social.comments (post_id, user_id, body, created_at) VALUES ($1,$2,$3,$4)`, [
    post.rows[0].id,
    ids.tiana,
    "The scale is ridiculous. I need to see it on a big screen.",
    ago(80),
  ]);
  await client.query(`INSERT INTO social.post_likes (post_id, user_id) VALUES ($1,$2)`, [post.rows[0].id, ids.godwin]);

  async function chat(kind, title, refColumn, refId, isPublic, pinned, lastBody, icon, lastAt) {
    const result = await client.query(
      `INSERT INTO social.chats (kind, title, ${refColumn}, is_public, pinned, last_body, last_at, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [kind, title, refId, isPublic, pinned, lastBody, lastAt, icon],
    );
    return result.rows[0].id;
  }

  const movieChat = await chat("group", "Movie Heads", "group_id", movie, true, true, "Tiana: That new trailer is crazy! 🔥", "🎬", ago(20));
  const gameChat = await chat("group", "Game Zone", "group_id", games, true, false, "New tournament drops this weekend! 🎮", "🎮", ago(190));
  const loungeChat = await chat("scene", "The Lounge", "scene_id", lounge, true, false, "KingFlex: Agreed! Communication is everything.", "🎙️", ago(1));
  const updates = await chat("system", "Nochalant Updates", "group_id", null, true, false, "New features, events and what's coming next...", "📣", ago(60 * 26));
  const dee = await chat("dm", "DeeKay", "group_id", null, false, false, "Bro, you joining the Lounge tonight?", null, ago(43));
  const ama = await chat("dm", "Amara", "group_id", null, false, false, "That gist was wild! 😂", null, ago(114));
  const blaq = await chat("dm", "BlaqSoul", "group_id", null, false, false, "Send me the clip from the Scene 🙏", null, ago(320));

  // The system chat insert used group_id null. Fix by allowing null. The query passes null. Good.
  const members = [
    [movieChat, "godwin", 12],
    [movieChat, "tiana", 0],
    [movieChat, "blaqsoul", 0],
    [gameChat, "godwin", 0],
    [gameChat, "khalz", 0],
    [loungeChat, "godwin", 0],
    [loungeChat, "blaqsoul", 0],
    [updates, "godwin", 0],
    [dee, "godwin", 1],
    [dee, "deekay", 0],
    [ama, "godwin", 2],
    [ama, "amara", 0],
    [blaq, "godwin", 0],
    [blaq, "blaqsoul", 0],
  ];
  for (const [chatId, username, unread] of members) {
    await client.query(`INSERT INTO social.chat_members (chat_id, user_id, unread) VALUES ($1,$2,$3)`, [
      chatId,
      ids[username],
      unread,
    ]);
  }
  const messages = [
    [movieChat, "tiana", "That new trailer is crazy! 🔥", 20],
    [movieChat, "blaqsoul", "I told you. Pure cinema.", 18],
    [dee, "deekay", "Bro, you joining the Lounge tonight?", 43],
    [dee, "godwin", "Pulling up. Save me a seat.", 40],
    [ama, "amara", "That gist was wild! 😂", 114],
    [blaq, "blaqsoul", "Send me the clip from the Scene 🙏", 320],
    [updates, "godwin", "New features, events and what's coming next. The club is open.", 60 * 26],
    [gameChat, "khalz", "New tournament drops this weekend! 🎮", 190],
  ];
  for (const [chatId, username, body, minutes] of messages) {
    await client.query(`INSERT INTO social.chat_messages (chat_id, user_id, body, created_at) VALUES ($1,$2,$3,$4)`, [
      chatId,
      ids[username],
      body,
      ago(minutes),
    ]);
  }

  const giftCycle = ["rose", "fire", "heart", "applause", "popcorn", "crown", "shades", "cheers", "ride", "mic", "heart", "fire"];
  const senders = ["amara", "tiana", "deekay", "blaqsoul", "khalz", "vibequeen", "movieplug", "naijagist", "kingflex", "sade", "amara", "tiana"];
  for (let index = 0; index < giftCycle.length; index += 1) {
    const gift = catalog.gifts.find((item) => item.id === giftCycle[index]);
    await client.query(
      `INSERT INTO social.gift_sends (gift_id, from_user, to_user, scene_id, amount_naira, created_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [gift.id, ids[senders[index]], ids.godwin, lounge, gift.price, ago(30 + index * 40)],
    );
  }

  await client.query(
    `INSERT INTO social.transactions (user_id, kind, amount_naira, title, detail, created_at) VALUES
     ($1,'gift_in',5000,'Gift received','From Amara',$2),
     ($1,'withdrawal',-20000,'Withdrawal','To Bank Account (GTB ****4321)',$3),
     ($1,'earnings',12500,'Scene earnings','The Lounge · 287 listeners',$4)`,
    [ids.godwin, ago(90), ago(60 * 20), new Date("2026-11-08T22:36:00+01:00")],
  );

  await client.query(
    `INSERT INTO social.notifications (user_id, title, body, href, read, created_at) VALUES
     ($1,'Gift received','Amara sent you a gift.','/wallet/gifts',false,$2),
     ($1,'New follower','Tiana followed you.','/u/tiana',false,$3),
     ($1,'Scene request','6 people want to speak in The Lounge.','/scene/the-lounge/requests',true,$4)`,
    [ids.godwin, ago(90), ago(200), ago(15)],
  );
  await client.query(
    `INSERT INTO social.invites (user_id, kind, title, body, href, status) VALUES
     ($1,'group','Game Zone','Khalz invited you to the weekend tournament.','/group/game-zone','pending'),
     ($1,'scene','The Lounge','BlaqSoul asked you to co-host tonight.','/scene/the-lounge','pending')`,
    [ids.godwin],
  );

  const events = [
    ["naija-entertainment", "Naija Entertainment Gist & Trending", "Movies, music, celebrity, gossip.", "Movies · Music · Celebrity · Gossip", ids.blaqsoul, lounge, new Date(), true, 2847, "clapper"],
    ["podcast-live", "The Nochalant Podcast Live", "Real conversations. No filter.", "Talk", ids.godwin, null, new Date(new Date().setHours(20, 0, 0, 0)), false, 0, "mic"],
    ["game-night", "Nochalant Game Night", "Ludo, Whot, Chess, Checkmate.", "Games", ids.khalz, gameScene, new Date(Date.now() + 22 * 3600_000), false, 0, "game"],
    ["music-vibes", "Music Vibes Session", "Afrobeats, Amapiano, throwbacks.", "Music", ids.vibequeen, music, new Date("2026-11-14T21:00:00+01:00"), false, 0, "headphones"],
    ["movie-night", "Movie Night: New Releases", "Watch, discuss, review.", "Movies", ids.tiana, movieScene, new Date("2026-11-15T20:00:00+01:00"), false, 0, "popcorn"],
  ];
  for (const event of events) {
    await client.query(
      `INSERT INTO social.events (slug, title, description, category, host_id, scene_id, starts_at, is_live, listener_count, cover_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      event,
    );
  }

  await client.query(
    `INSERT INTO social.matches (game_slug, player_a, player_b, status, watching)
     VALUES ('whot', $1, $2, 'live', 412)`,
    [ids.blaqsoul, ids.deekay],
  );

  await client.query(
    `INSERT INTO social.scene_visits (user_id, scene_id) VALUES ($1,$2), ($1,$3)`,
    [ids.godwin, lounge, music],
  );

  await client.query("COMMIT");
  console.log("seeded Nochalant social data");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
