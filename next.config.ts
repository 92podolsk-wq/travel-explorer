import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // POI photo URLs are admin-submitted and can point at essentially any
    // https host (Pexels, Yandex, Wikimedia, one-off sites pasted by admins,
    // etc. — confirmed via a DB scan, not just Unsplash). A fixed allowlist
    // would break optimization for photos from hosts not yet seen.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  }
};

export default nextConfig;
