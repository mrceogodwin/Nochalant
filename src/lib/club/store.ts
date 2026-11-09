import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedComments, seedGifts, seedMessages, costOf, followAsks } from "@/lib/club/data";
import type {
  ChatMessage,
  CollectibleId,
  Comment,
  Draft,
  GiftEvent,
  Post,
  RoleId,
} from "@/lib/club/types";

type ProfileInput = {
  name: string;
  handle: string;
  bio: string;
  emoji: CollectibleId;
  isPrivate: boolean;
};

type Report = { id: string; name: string; reason: string; time: string };
type Ledger = { id: string; label: string; amount: number; time: string };

type ClubState = {
  ageOk: boolean;
  role: RoleId | null;
  personality: string | null;
  interests: string[];
  name: string;
  handle: string;
  bio: string;
  emoji: CollectibleId;
  isPrivate: boolean;
  following: string[];
  blocked: string[];
  greeted: string[];
  liked: string[];
  saved: string[];
  myPosts: Post[];
  pollVotes: Record<string, number>;
  comments: Record<string, Comment[]>;
  gifts: GiftEvent[];
  sentGifts: GiftEvent[];
  joined: string[];
  messages: Record<string, ChatMessage[]>;
  notifRead: boolean;
  favourites: CollectibleId[];
  tokens: number;
  ledger: Ledger[];
  reports: Report[];
  drafts: Draft[];
  reposts: string[];
  challenges: string[];
  asks: string[];
  letIn: string[];
  confirmAge: () => void;
  setRole: (role: RoleId) => void;
  setPersonality: (id: string) => void;
  toggleInterest: (id: string) => void;
  setProfile: (profile: ProfileInput) => void;
  toggleFollow: (id: string) => void;
  toggleGreet: (id: string) => void;
  block: (id: string) => void;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
  addPost: (post: Post) => void;
  vote: (postId: string, index: number) => void;
  addComment: (postId: string, text: string) => void;
  setPrivate: (isPrivate: boolean) => void;
  toggleFavourite: (id: CollectibleId) => void;
  addTokens: (amount: number) => void;
  unblock: (id: string) => void;
  addReport: (report: { name: string; reason: string }) => void;
  saveDraft: (input: Omit<Draft, "id" | "time">) => void;
  removeDraft: (id: string) => void;
  toggleRepost: (id: string) => boolean;
  toggleChallenge: (id: string) => void;
  completeChallenge: (id: string) => void;
  decideAsk: (id: string, accept: boolean) => void;
  sendGift: (input: { to: string; object: CollectibleId; note: string }) => boolean;
  joinThing: (id: string) => void;
  sendMessage: (threadId: string, message: Omit<ChatMessage, "id" | "at" | "from">) => void;
  markNotifs: () => void;
  reset: () => void;
};

const initial = {
  ageOk: false,
  role: null as RoleId | null,
  personality: null as string | null,
  interests: [] as string[],
  name: "",
  handle: "",
  bio: "",
  emoji: "spade" as CollectibleId,
  isPrivate: false,
  following: [] as string[],
  blocked: [] as string[],
  greeted: [] as string[],
  liked: [] as string[],
  saved: [] as string[],
  myPosts: [] as Post[],
  pollVotes: {} as Record<string, number>,
  comments: seedComments,
  gifts: seedGifts,
  sentGifts: [] as GiftEvent[],
  joined: [] as string[],
  messages: seedMessages,
  notifRead: false,
  favourites: [] as CollectibleId[],
  tokens: 180,
  ledger: [] as Ledger[],
  reports: [] as Report[],
  drafts: [] as Draft[],
  reposts: [] as string[],
  challenges: [] as string[],
  asks: [...followAsks],
  letIn: [] as string[],
};

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export const useClub = create<ClubState>()(
  persist(
    (set, get) => ({
      ...initial,
      confirmAge: () => set({ ageOk: true }),
      setRole: (role) => set({ role }),
      setPersonality: (personality) => set({ personality }),
      toggleInterest: (id) => set((state) => ({ interests: toggle(state.interests, id) })),
      setProfile: (profile) => set(profile),
      setPrivate: (isPrivate) => set({ isPrivate }),
      toggleFavourite: (id) => set((state) => ({ favourites: toggle(state.favourites, id) as CollectibleId[] })),
      addTokens: (amount) =>
        set((state) => ({
          tokens: state.tokens + amount,
          ledger: [
            { id: `led-${Date.now()}`, label: `Preview credit`, amount, time: "Now" },
            ...state.ledger,
          ],
        })),
      unblock: (id) => set((state) => ({ blocked: state.blocked.filter((item) => item !== id) })),
      addReport: ({ name, reason }) =>
        set((state) => ({
          reports: [{ id: `rep-${Date.now()}`, name, reason, time: "Now" }, ...state.reports],
        })),
      saveDraft: (input) =>
        set((state) => ({
          drafts: [{ ...input, id: `draft-${Date.now()}`, time: "Now" }, ...state.drafts],
        })),
      removeDraft: (id) => set((state) => ({ drafts: state.drafts.filter((draft) => draft.id !== id) })),
      toggleRepost: (id) => {
        const on = !get().reposts.includes(id);
        set((state) => ({
          reposts: on ? [id, ...state.reposts] : state.reposts.filter((item) => item !== id),
        }));
        return on;
      },
      toggleChallenge: (id) => set((state) => ({ challenges: toggle(state.challenges, id) })),
      completeChallenge: (id) =>
        set((state) => (state.challenges.includes(id) ? state : { challenges: [...state.challenges, id] })),
      decideAsk: (id, accept) =>
        set((state) => ({
          asks: state.asks.filter((item) => item !== id),
          letIn: accept && !state.letIn.includes(id) ? [...state.letIn, id] : state.letIn,
        })),
      toggleFollow: (id) => set((state) => ({ following: toggle(state.following, id) })),
      toggleGreet: (id) => set((state) => ({ greeted: toggle(state.greeted, id) })),
      block: (id) =>
        set((state) => ({
          blocked: state.blocked.includes(id) ? state.blocked : [...state.blocked, id],
          following: state.following.filter((item) => item !== id),
        })),
      toggleLike: (id) => set((state) => ({ liked: toggle(state.liked, id) })),
      toggleSave: (id) => set((state) => ({ saved: toggle(state.saved, id) })),
      addPost: (post) => set((state) => ({ myPosts: [post, ...state.myPosts] })),
      vote: (postId, index) =>
        set((state) =>
          state.pollVotes[postId] !== undefined ? state : { pollVotes: { ...state.pollVotes, [postId]: index } },
        ),
      addComment: (postId, text) =>
        set((state) => ({
          comments: {
            ...state.comments,
            [postId]: [
              ...(state.comments[postId] ?? []),
              { id: `local-${Date.now()}`, authorId: "me", text },
            ],
          },
        })),
      sendGift: ({ to, object, note }) => {
        const cost = costOf(object);
        if (get().tokens < cost) return false;
        set((state) => ({
          tokens: state.tokens - cost,
          ledger: [
            { id: `led-${Date.now()}`, label: `${object} for ${to}`, amount: -cost, time: "Now" },
            ...state.ledger,
          ],
          sentGifts: [
            { id: `gift-${Date.now()}`, from: "me", object, note: note || `For ${to}`, time: "Now" },
            ...state.sentGifts,
          ],
        }));
        return true;
      },
      joinThing: (id) =>
        set((state) => ({ joined: state.joined.includes(id) ? state.joined : [...state.joined, id] })),
      sendMessage: (threadId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [threadId]: [
              ...(state.messages[threadId] ?? []),
              { ...message, from: "me", id: `msg-${Date.now()}`, at: "Now" },
            ],
          },
        })),
      markNotifs: () => set({ notifRead: true }),
      reset: () => set({ ...initial, comments: seedComments, gifts: seedGifts, messages: seedMessages }),
    }),
    {
      name: "nochalant-club-v1",
      skipHydration: true,
      partialize: (state) => ({
        ageOk: state.ageOk,
        role: state.role,
        personality: state.personality,
        interests: state.interests,
        name: state.name,
        handle: state.handle,
        bio: state.bio,
        emoji: state.emoji,
        isPrivate: state.isPrivate,
        following: state.following,
        blocked: state.blocked,
        greeted: state.greeted,
        liked: state.liked,
        saved: state.saved,
        myPosts: state.myPosts.map(({ ...post }) => {
          const next = { ...post };
          delete (next as Post & { audio?: string }).audio;
          return next;
        }),
        pollVotes: state.pollVotes,
        comments: state.comments,
        gifts: state.gifts,
        sentGifts: state.sentGifts,
        joined: state.joined,
        messages: Object.fromEntries(
          Object.entries(state.messages).map(([key, list]) => [
            key,
            list.map(({ audio: _audio, ...rest }) => rest),
          ]),
        ),
        notifRead: state.notifRead,
        favourites: state.favourites,
        tokens: state.tokens,
        ledger: state.ledger,
        reports: state.reports,
        drafts: state.drafts,
        reposts: state.reposts,
        challenges: state.challenges,
        asks: state.asks,
        letIn: state.letIn,
      }),
    },
  ),
);
