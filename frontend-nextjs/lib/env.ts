const isProduction = process.env.NODE_ENV === "production";

function readPublicEnv(name: string, fallback = "") {
  const value = process.env[name]?.trim() ?? "";

  if (value) {
    return value.replace(/\/+$/, "");
  }

  if (isProduction && !fallback) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return fallback.replace(/\/+$/, "");
}

function readPublicUrl(name: string, fallback = "") {
  const value = readPublicEnv(name, fallback);

  if (!value) {
    return value;
  }

  try {
    return new URL(value).toString().replace(/\/+$/, "");
  } catch {
    throw new Error(`Invalid URL in public environment variable: ${name}`);
  }
}

export const API_URL = readPublicUrl("NEXT_PUBLIC_API_BASE_URL");
export const SITE_URL = readPublicUrl(
  "NEXT_PUBLIC_SITE_URL",
  isProduction ? "" : "http://localhost:3000",
);
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
