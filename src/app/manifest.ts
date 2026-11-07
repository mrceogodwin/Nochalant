import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nochalant Club",
    short_name: "Nochalant",
    description: "Your people. Your scene. Your rules.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    orientation: "portrait",
    icons: [
      { src: "/icons/nochalant-mark.svg", sizes: "any", type: "image/svg+xml" },
      
      
    ]
  };
}
