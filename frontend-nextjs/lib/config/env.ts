/**
 * Environment variables validation and configuration
 */

// Client-side environment variables (prefixed with NEXT_PUBLIC_)
export const clientEnv = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
} as const;

// Server-side environment variables
export const serverEnv = {
  API_PROXY_TARGET: process.env.API_PROXY_TARGET || "",
  NODE_ENV: process.env.NODE_ENV as "development" | "production" | "test",
} as const;

/**
 * Validate that required environment variables are set
 */
export function validateEnv() {
  const errors: string[] = [];

  // Validate client env
  if (!clientEnv.API_BASE_URL) {
    errors.push("NEXT_PUBLIC_API_BASE_URL is required");
  }

  // Validate server env in development
  if (serverEnv.NODE_ENV === "development" && !serverEnv.API_PROXY_TARGET) {
    console.warn(
      "API_PROXY_TARGET is not set. API requests may fail in development."
    );
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join("\n")}`);
  }

  return {
    client: clientEnv,
    server: serverEnv,
  };
}

/**
 * Get environment info for debugging
 */
export function getEnvInfo() {
  return {
    NODE_ENV: serverEnv.NODE_ENV,
    API_BASE_URL: clientEnv.API_BASE_URL,
    // Don't expose sensitive server env in client
    ...(typeof window === "undefined" && {
      API_PROXY_TARGET: serverEnv.API_PROXY_TARGET,
    }),
  };
}
