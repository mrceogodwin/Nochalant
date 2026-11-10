"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Pencil, UserRound } from "lucide-react";
import { INTERESTS, SCENE_TYPES, CATEGORIES, PLANS } from "@/lib/catalog";
import {
  commentOnPost,
  createPlace,
  createPost,
  remindEvent,
  repost,
  requestSpeak,
  saveOnboarding,
  sendChat,
  sendGift,
  signIn,
  signUp,
  startCheckout,
  toggleFollow,
  toggleGroup,
  togglePostLike,
  toggleSave,
  updateProfile,
  type FormState,
} from "@/lib/actions";
import { PrimaryButton } from "./shell";

function ErrorNote({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="text-center text-sm font-medium text-red-400">{error}</p>;
}

export function SignUpForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signUp, { error: "" } satisfies FormState);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <label className="field flex h-14 items-center gap-3 rounded-full px-4">
        <UserRound size={18} className="text-zinc-400" />
        <input name="username" required placeholder="Username" className="w-full bg-transparent outline-none placeholder:text-zinc-500" />
      </label>
      <label className="field flex h-14 items-center gap-3 rounded-full px-4">
        <Mail size={18} className="text-zinc-400" />
        <input name="email" type="email" required placeholder="Email address" className="w-full bg-transparent outline-none placeholder:text-zinc-500" />
      </label>
      <label className="field flex h-14 items-center gap-3 rounded-full px-4">
        <Lock size={18} className="text-zinc-400" />
        <input name="password" type={show ? "text" : "password"} required minLength={8} placeholder="Create password" className="w-full bg-transparent outline-none placeholder:text-zinc-500" />
        <button type="button" onClick={() => setShow((value) => !value)} aria-label="Show password" className="text-zinc-400">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </label>
      {notice === "google" ? <p className="text-center text-sm text-amber-300">Google sign-in needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.</p> : null}
      {notice === "apple" ? <p className="text-center text-sm text-amber-300">Apple sign-in needs APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID and APPLE_PRIVATE_KEY.</p> : null}
      <ErrorNote error={state.error} />
      <PrimaryButton pending={pending}>Create Account</PrimaryButton>
    </form>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, { error: "" } satisfies FormState);
  return (
    <form action={action} className="space-y-3">
      <label className="field flex h-14 items-center gap-3 rounded-full px-4">
        <Mail size={18} className="text-zinc-400" />
        <input name="email" type="email" required placeholder="Email address" className="w-full bg-transparent outline-none placeholder:text-zinc-500" />
      </label>
      <label className="field flex h-14 items-center gap-3 rounded-full px-4">
        <Lock size={18} className="text-zinc-400" />
        <input name="password" type="password" required placeholder="Password" className="w-full bg-transparent outline-none placeholder:text-zinc-500" />
      </label>
      <ErrorNote error={state.error} />
      <PrimaryButton pending={pending}>Sign in</PrimaryButton>
    </form>
  );
}

export function OnboardingForm({
  displayName,
  bio,
  interests,
  mode = "setup",
  location = "Nigeria",
}: {
  displayName: string;
  bio: string;
  interests: string[];
  mode?: "setup" | "edit";
  location?: string;
}) {
  const action = mode === "edit" ? updateProfile : saveOnboarding;
  const [state, formAction, pending] = useActionState(action, { error: "" } satisfies FormState);
  const [picked, setPicked] = useState<string[]>(interests);
  const [text, setText] = useState(bio);
  const [preview, setPreview] = useState("");
  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="avatar" value={preview} />
      {picked.map((item) => (
        <input key={item} type="hidden" name="interests" value={item} />
      ))}
      <label className="mx-auto grid h-28 w-28 cursor-pointer place-items-center">
        <span className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border-2 border-[#ff7a00] bg-zinc-800">
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <UserRound size={42} className="text-zinc-500" />}
          <span className="absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full bg-[#ff7a00] text-black">
            <Pencil size={14} />
          </span>
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setPreview(String(reader.result || ""));
            reader.readAsDataURL(file);
          }}
        />
      </label>
      <label className="field flex h-14 items-center gap-3 rounded-full px-4">
        <UserRound size={18} className="text-zinc-400" />
        <input name="displayName" defaultValue={displayName} placeholder="Display name" className="w-full bg-transparent outline-none placeholder:text-zinc-500" />
      </label>
      {mode === "edit" ? (
        <label className="field flex h-14 items-center gap-3 rounded-full px-4">
          <input name="location" defaultValue={location} placeholder="Location" className="w-full bg-transparent outline-none" />
        </label>
      ) : null}
      <label className="field block rounded-3xl px-4 py-3">
        <span className="flex items-start gap-3">
          <Pencil size={18} className="mt-1 text-zinc-400" />
          <textarea
            name="bio"
            value={text}
            maxLength={150}
            onChange={(event) => setText(event.target.value)}
            placeholder="Tell us about you (optional)"
            className="min-h-16 w-full resize-none bg-transparent outline-none placeholder:text-zinc-500"
          />
        </span>
        <span className="block text-right text-xs text-zinc-500">{text.length}/150</span>
      </label>
      <div>
        <p className="mb-2 font-bold">
          Select your interests <span className="font-medium text-zinc-400">(choose at least 3)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((interest) => {
            const on = picked.includes(interest.id);
            return (
              <button
                type="button"
                key={interest.id}
                onClick={() =>
                  setPicked((current) =>
                    current.includes(interest.id) ? current.filter((item) => item !== interest.id) : [...current, interest.id],
                  )
                }
                className={`rounded-full border px-3 py-2 text-sm font-semibold ${on ? "border-[#ff7a00] bg-[#ff7a00]/15 text-white" : "border-white/10 bg-white/5 text-zinc-200"}`}
              >
                {interest.emoji} {interest.id}
              </button>
            );
          })}
        </div>
      </div>
      <ErrorNote error={state.error} />
      <PrimaryButton pending={pending}>{mode === "edit" ? "Save profile" : "Continue"}</PrimaryButton>
    </form>
  );
}

export function CreateForm() {
  const [state, action, pending] = useActionState(createPlace, { error: "" } satisfies FormState);
  const [type, setType] = useState("voice");
  const [description, setDescription] = useState("");
  const [isPrivate, setPrivate] = useState(false);
  const [adult, setAdult] = useState(true);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="sceneType" value={type} />
      <div className="grid grid-cols-4 gap-2">
        {SCENE_TYPES.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setType(item.id)}
            className={`rounded-2xl border p-2 text-left ${type === item.id ? "border-[#ff7a00] bg-[#ff7a00]/15" : "border-white/10 bg-white/5"}`}
          >
            <span className="block text-lg">{item.id === "voice" ? "🎙️" : item.id === "chat" ? "💬" : item.id === "group" ? "👥" : "🎮"}</span>
            <span className="mt-2 block text-xs font-bold leading-tight">{item.name}</span>
            <span className="mt-1 block text-[10px] leading-tight text-zinc-400">{item.detail}</span>
          </button>
        ))}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Scene Title *</span>
        <input name="title" required placeholder="e.g. The Lounge, Naija Gist, Movie Talk..." className="field h-12 w-full rounded-full px-4 outline-none" />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Description</span>
        <textarea
          name="description"
          maxLength={200}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What's this scene about?"
          className="field min-h-24 w-full rounded-3xl px-4 py-3 outline-none"
        />
        <span className="block text-right text-xs text-zinc-500">{description.length}/200</span>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold">Category</span>
        <span className="field flex h-12 items-center rounded-full px-4">
          <select name="category" className="w-full bg-transparent outline-none">
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-black">
                {category}
              </option>
            ))}
          </select>
        </span>
      </label>
      <div className="space-y-2">
        <p className="font-bold">Scene Settings</p>
        <Toggle name="isPrivate" on={isPrivate} setOn={setPrivate} title="Private Scene" detail="Only people with the link can join" icon="🔒" />
        <Toggle name="isAdult" on={adult} setOn={setAdult} title="18+ (Adults Only)" detail="For mature conversations" icon="18+" />
      </div>
      <ErrorNote error={state.error} />
      <PrimaryButton pending={pending}>Create Scene</PrimaryButton>
    </form>
  );
}

function Toggle({
  name,
  on,
  setOn,
  title,
  detail,
  icon,
}: {
  name: string;
  on: boolean;
  setOn: (value: boolean) => void;
  title: string;
  detail: string;
  icon: string;
}) {
  return (
    <label className="card flex items-center gap-3 rounded-2xl px-3 py-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ff7a00]/15 text-sm font-bold text-[#ff9a3c]">{icon}</span>
      <span className="flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-xs text-zinc-400">{detail}</span>
      </span>
      <input type="checkbox" name={name} checked={on} onChange={(event) => setOn(event.target.checked)} className="peer sr-only" />
      <span className={`h-7 w-12 rounded-full p-1 ${on ? "bg-[#ff7a00]" : "bg-zinc-700"}`}>
        <span className={`block h-5 w-5 rounded-full bg-white transition ${on ? "translate-x-5" : ""}`} />
      </span>
    </label>
  );
}

export function FollowButton({ userId, following, compact = false }: { userId: string; following: boolean; compact?: boolean }) {
  const [on, setOn] = useState(following);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn((value) => !value);
          await toggleFollow(userId);
        })
      }
      className={`rounded-full font-bold ${compact ? "h-8 px-4 text-xs" : "h-10 px-5 text-sm"} ${on ? "border border-white/15 text-white" : "orange-fill text-black"}`}
    >
      {on ? "Following" : "Follow"}
    </button>
  );
}

export function JoinGroupButton({ slug, joined }: { slug: string; joined: boolean }) {
  const [on, setOn] = useState(joined);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn((value) => !value);
          await toggleGroup(slug);
        })
      }
      className={`rounded-full px-4 py-2 text-sm font-bold ${on ? "border border-[#ffb000] text-[#ffb000]" : "orange-fill text-black"}`}
    >
      {on ? "Joined" : "Join"}
    </button>
  );
}

export function PostComposer({ slug }: { slug: string }) {
  return (
    <form action={createPost.bind(null, slug)} className="card flex items-center gap-2 rounded-full px-3 py-2">
      <input name="body" placeholder="Share something with the group..." className="h-10 flex-1 bg-transparent outline-none placeholder:text-zinc-500" />
      <input type="hidden" name="tag" value="all" />
      <button className="font-bold text-[#ff7a00]">Post</button>
    </form>
  );
}

export function PostActions({
  postId,
  slug,
  liked,
  likes,
  comments,
  reposts,
  saved,
}: {
  postId: string;
  slug: string;
  liked: boolean;
  likes: number;
  comments: number;
  reposts: number;
  saved: boolean;
}) {
  const [state, setState] = useState({ liked, likes, saved });
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex items-center gap-4 text-sm text-zinc-300">
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            setState((current) => ({ ...current, liked: !current.liked, likes: current.likes + (current.liked ? -1 : 1) }));
            await togglePostLike(postId);
          })
        }
      >
        {state.liked ? "❤️" : "🤍"} {state.likes}
      </button>
      <a href={`/group/${slug}/post/${postId}`}>💬 {comments}</a>
      <form action={repost.bind(null, postId)}>
        <button>↻ {reposts}</button>
      </form>
      <button
        onClick={() =>
          start(async () => {
            setState((current) => ({ ...current, saved: !current.saved }));
            await toggleSave(postId);
          })
        }
      >
        {state.saved ? "🔖" : "📑"}
      </button>
    </div>
  );
}

export function CommentForm({ postId, slug }: { postId: string; slug: string }) {
  return (
    <form action={commentOnPost.bind(null, postId, slug)} className="flex gap-2">
      <input name="body" placeholder="Add a comment" className="field h-12 flex-1 rounded-full px-4 outline-none" />
      <button className="orange-fill rounded-full px-4 font-bold">Send</button>
    </form>
  );
}

export function ChatComposer({ chatId }: { chatId: string }) {
  return (
    <form action={sendChat.bind(null, chatId)} className="flex items-center gap-2">
      <input name="body" placeholder="Type a message..." className="field h-12 flex-1 rounded-full px-4 outline-none" />
      <button className="orange-fill h-12 rounded-full px-4 font-bold">Send</button>
    </form>
  );
}

export function SceneComposer({ slug, placeholder }: { slug: string; placeholder: string }) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const text = body.trim();
        if (!text) return;
        setBody("");
        start(async () => {
          const { postSceneMessage } = await import("@/lib/actions");
          await postSceneMessage(slug, text);
          router.refresh();
        });
      }}
    >
      <input value={body} onChange={(event) => setBody(event.target.value)} placeholder={placeholder} className="field h-12 flex-1 rounded-full px-4 outline-none" />
      <button disabled={pending} className="grid h-11 w-11 place-items-center rounded-full border border-[#ff7a00] text-lg" aria-label="Gift" type="button">
        🎁
      </button>
      <button disabled={pending} className="orange-fill h-11 rounded-full px-4 font-bold">
        Send
      </button>
    </form>
  );
}

export function SpeakBar({ slug, role }: { slug: string; role: string | null }) {
  const [live, setLive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [note, setNote] = useState("");
  const [showReact, setShowReact] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <div>
      {note ? <p className="mb-2 text-center text-xs text-amber-200">{note}</p> : null}
      {showReact ? (
        <div className="mb-3 flex justify-center gap-2">
          {["🔥", "❤️", "👏", "😂", "💯"].map((emoji) => (
            <button
              key={emoji}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg"
              onClick={() =>
                start(async () => {
                  const { postSceneMessage } = await import("@/lib/actions");
                  await postSceneMessage(slug, emoji);
                  setShowReact(false);
                  router.refresh();
                })
              }
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-5 items-end text-center text-[11px] text-zinc-300">
        <button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await requestSpeak(slug);
              setNote(result?.error || "Request sent. The host will see it.");
            })
          }
          className="flex flex-col items-center gap-1"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10">✋</span>
          Request
        </button>
        <button onClick={() => setShowReact((value) => !value)} className="flex flex-col items-center gap-1">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10">❤️</span>
          React
        </button>
        <button
          onClick={() =>
            start(async () => {
              if (!role || role === "listener") {
                await requestSpeak(slug);
                setNote("You're in the queue to speak.");
                return;
              }
              if (!live) {
                try {
                  await navigator.mediaDevices.getUserMedia({ audio: true });
                  setLive(true);
                  setNote("Mic is live on this device. Other people hear you once LiveKit keys are set.");
                } catch {
                  setNote("Allow the microphone to speak. Multi-party audio still needs LiveKit.");
                }
              } else {
                setLive(false);
              }
            })
          }
          className="flex flex-col items-center gap-1"
        >
          <span className={`orange-fill grid h-16 w-16 place-items-center rounded-full text-2xl text-black ${live ? "ring-4 ring-orange-500/40" : ""}`}>🎙️</span>
          Speak
        </button>
        <button
          onClick={() =>
            start(async () => {
              const next = !muted;
              setMuted(next);
              const { setMuted: save } = await import("@/lib/actions");
              await save(slug, next);
            })
          }
          className="flex flex-col items-center gap-1"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full bg-white/10">{muted ? "🔇" : "🎤"}</span>
          Mute
        </button>
        <form action={async () => { const { leaveScene } = await import("@/lib/actions"); await leaveScene(slug); }}>
          <button className="flex flex-col items-center gap-1">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-[#ff3b30] text-white">📞</span>
            Leave
          </button>
        </form>
      </div>
    </div>
  );
}

export function MessageLike({ id, slug, liked, likes }: { id: string; slug: string; liked: boolean; likes: number }) {
  const [state, setState] = useState({ liked, likes });
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          setState((current) => ({ liked: !current.liked, likes: current.likes + (current.liked ? -1 : 1) }));
          const { likeSceneMessage } = await import("@/lib/actions");
          await likeSceneMessage(id, slug);
        })
      }
      className="text-sm text-zinc-300"
    >
      {state.liked ? "❤️" : "🤍"} {state.likes}
    </button>
  );
}

export function GiftForm({
  people,
  sceneId,
  balance,
}: {
  people: { id: string; name: string }[];
  sceneId?: string;
  balance: number;
}) {
  const [giftId, setGiftId] = useState("rose");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const gifts = ["rose", "fire", "heart", "applause", "popcorn", "crown", "shades", "cheers", "ride", "mic", "diamond", "boost"];
  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        start(async () => {
          const result = await sendGift(data);
          setError(result?.error || "Gift sent.");
        });
      }}
    >
      <input type="hidden" name="giftId" value={giftId} />
      {sceneId ? <input type="hidden" name="sceneId" value={sceneId} /> : null}
      <label className="block text-sm">
        Send to
        <select name="toUser" className="field mt-1 h-12 w-full rounded-full px-3">
          {people.map((person) => (
            <option key={person.id} value={person.id} className="bg-black">
              {person.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-4 gap-2">
        {gifts.map((id) => (
          <button type="button" key={id} onClick={() => setGiftId(id)} className={`rounded-2xl border p-2 text-xs capitalize ${giftId === id ? "border-[#ff7a00]" : "border-white/10"}`}>
            {id}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-400">Balance {balance.toLocaleString("en-NG")}</p>
      {error ? <p className="text-sm text-amber-200">{error}</p> : null}
      <PrimaryButton pending={pending} type="submit">
        Send gift
      </PrimaryButton>
    </form>
  );
}

export function PlanPicker() {
  const [plan, setPlan] = useState("quarterly");
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {PLANS.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => setPlan(item.id)}
            className={`relative rounded-3xl border p-3 text-center ${plan === item.id ? "border-[#ff9a1a] bg-[#ff7a00]/10 shadow-[0_0_24px_rgba(255,122,0,0.25)]" : "border-white/10"}`}
          >
            {item.badge ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#ff7a00] px-2 py-0.5 text-[10px] font-bold text-black">
                {item.badge}
              </span>
            ) : null}
            <span className="block text-xs text-zinc-300">{item.name}</span>
            <span className="mt-2 block text-lg font-black">₦{item.price.toLocaleString("en-NG")}</span>
            <span className="mt-1 block text-[10px] text-zinc-400">{item.detail}</span>
          </button>
        ))}
      </div>
      <button
        className="orange-fill relative mt-5 flex h-14 w-full items-center justify-center rounded-full font-extrabold"
        disabled={pending}
        onClick={() => start(async () => { await startCheckout(plan); })}
      >
        {pending ? "Opening checkout…" : "Upgrade Now"}
      </button>
    </div>
  );
}

export function RemindButton({ eventId, reminded }: { eventId: string; reminded: boolean }) {
  const [on, setOn] = useState(reminded);
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOn((value) => !value);
          await remindEvent(eventId);
        })
      }
      className="rounded-full border border-white/15 px-3 py-2 text-xs font-bold"
    >
      {on ? "Reminded" : "Remind Me"}
    </button>
  );
}

export function CopyLink({ path }: { path: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="card flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left"
      onClick={async () => {
        await navigator.clipboard.writeText(`${window.location.origin}${path}`);
        setDone(true);
      }}
    >
      <span>Share Scene Link</span>
      <span>{done ? "Copied" : "›"}</span>
    </button>
  );
}

export function MarkRead({ chatId }: { chatId: string }) {
  useEffect(() => {
    void import("@/lib/actions").then(({ markChatRead }) => markChatRead(chatId));
  }, [chatId]);
  return null;
}
