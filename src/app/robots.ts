import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/app-shell", "/api", "/trip"]
    },
    sitemap: "https://wayora.ru/sitemap.xml"
  };
}
