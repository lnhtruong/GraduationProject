export const PUBLIC_AUTH_ROUTES = [
  "/",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export function isPublicAuthRoute(pathname?: string) {
  if (!pathname) return false;
  return PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route));
}
