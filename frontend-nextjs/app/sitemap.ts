import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const PUBLIC_ROUTES = [
  "",
  "/courses/search",
  "/newsfeed",
  "/newsfeed/search",
  "/signin",
  "/signup",
  "/forgot-password",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
