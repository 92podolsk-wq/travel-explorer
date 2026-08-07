import type { MetadataRoute } from "next";

const baseUrl = "https://wayora.ru";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${baseUrl}/account`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5
    }
  ];
}
