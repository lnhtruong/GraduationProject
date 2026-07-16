const isProduction = process.env.NODE_ENV === "production";

type PublicEnvOptions = {
  requiredInProduction?: boolean;
};

function readPublicEnv(
  name: string,
  fallback = "",
  options: PublicEnvOptions = {},
) {
  const value = process.env[name]?.trim() ?? "";
  const requiredInProduction = options.requiredInProduction ?? false;

  if (value) {
    return value.replace(/\/+$/, "");
  }

  if (isProduction && requiredInProduction && !fallback) {
    throw new Error(`Missing required public environment variable: ${name}`);
  }

  return fallback.replace(/\/+$/, "");
}

function readPublicUrl(
  name: string,
  fallback = "",
  options: PublicEnvOptions = {},
) {
  const value = readPublicEnv(name, fallback, options);

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
  { requiredInProduction: true },
);
export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
