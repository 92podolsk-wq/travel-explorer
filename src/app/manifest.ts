import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wayora — Explore Japan",
    short_name: "Wayora",
    description:
      "Discover the best places to visit in Kyoto, Osaka, Nara, and beyond. Build smart multi-day routes and save favorites.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f4ee",
    theme_color: "#287f72",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
