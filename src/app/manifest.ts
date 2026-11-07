import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/club",
    name: "Nochalant Club",
    short_name: "Nochalant",
    description: "Your people. Your scene. Your rules.",
    start_url: "/club",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#050506",
    theme_color: "#050506",
    orientation: "portrait",
    categories: ["social", "entertainment", "music"],
    icons: [
      { src: "/icons/nochalant-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Home", short_name: "Home", url: "/club" },
      { name: "Discover", short_name: "Discover", url: "/discover" },
      { name: "Chats", short_name: "Chats", url: "/chats" },
      { name: "Offline drafts", short_name: "Drafts", url: "/drafts" }
    ]
  };
}
