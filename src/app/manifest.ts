// src/app/manifest.ts

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FrontMaster",
    short_name: "FrontMaster",
    description:
      "Frontend interview prep: spaced-repetition flashcards, AI mock interviews, and coding challenges.",
    start_url: "/",
    display: "standalone",
    background_color: "#0d0d16",
    theme_color: "#0d0d16",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
