import catalog from "../../db/catalog.json";

export const INTERESTS = catalog.interests;
export const GIFTS = catalog.gifts;
export const PLANS = catalog.plans;

export const CATEGORIES = [
  "Talk",
  "Music",
  "Movies",
  "Games",
  "Relationships",
  "Sports",
  "Lifestyle",
  "Gossip",
  "Naija & Culture",
];

export const SCENE_TYPES = [
  { id: "voice", name: "Voice Scene", detail: "Live talk with audio", icon: "mic" },
  { id: "chat", name: "Chat Scene", detail: "Text conversation with the group", icon: "chat" },
  { id: "group", name: "Group", detail: "A lasting community", icon: "users" },
  { id: "game", name: "Game Room", detail: "Play and hangout", icon: "game" },
] as const;

export const PERKS = [
  { title: "Bigger Scenes", detail: "(up to 5,000)", icon: "mic" },
  { title: "Create more Groups", detail: "", icon: "users" },
  { title: "Better Audio & Video", detail: "", icon: "hd" },
  { title: "Creator Tools & Insights", detail: "", icon: "chart" },
  { title: "Pro Badge", detail: "on your profile", icon: "crown" },
  { title: "No Ads", detail: "(Ad-free experience)", icon: "ad" },
  { title: "Exclusive Content & Events", detail: "", icon: "gem" },
  { title: "Priority Support", detail: "", icon: "support" },
];

export const SUPPORT_EMAIL = "fluxbeatempire@gmail.com";

export function planById(id: string) {
  return PLANS.find((plan) => plan.id === id) ?? null;
}
