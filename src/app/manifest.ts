import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Travel Explorer",
    short_name: "Travel Explorer",
    description: "Smart map for planning photography-first travel in Japan.",
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
