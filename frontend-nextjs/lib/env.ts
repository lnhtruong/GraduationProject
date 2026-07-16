const isProduction = process.env.NODE_ENV === "production";

function normalizeUrl(value = "") {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  try {
    return new URL(trimmedValue).toString().replace(/\/+$/, "");
  } catch {
    return "";
  }
}

const vercelSiteUrl =
  process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "";

export const API_URL = normalizeUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
export const SITE_URL = normalizeUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    (vercelSiteUrl ? `https://${vercelSiteUrl}` : "") ||
    (isProduction ? "" : "http://localhost:3000"),
);
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
