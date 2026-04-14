export const PUBLIC_AUTH_ROUTES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

// Dev-only routes — không yêu cầu auth, không có trong production build
const DEV_PUBLIC_ROUTES =
  process.env.NODE_ENV === "development" ? ["/dev"] : [];

export function isPublicAuthRoute(pathname?: string) {
  if (!pathname) return false;
  const allPublic = [...PUBLIC_AUTH_ROUTES, ...DEV_PUBLIC_ROUTES];
  return allPublic.some((route) => pathname.startsWith(route));
}
