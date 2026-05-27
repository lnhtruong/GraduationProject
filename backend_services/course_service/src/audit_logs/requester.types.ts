export interface RequesterContext {
  userId: number;
  role: number;
  ip?: string | null;
  userAgent?: string | null;
}

export function buildRequesterFromHeaders(
  userIdHeader?: string,
  roleHeader?: string,
  forwardedFor?: string,
  userAgent?: string,
): RequesterContext | null {
  const userId = parseInt(userIdHeader ?? '', 10);
  const role = parseInt(roleHeader ?? '', 10);
  if (Number.isNaN(userId) || Number.isNaN(role)) return null;
  return {
    userId,
    role,
    ip: forwardedFor?.split(',')[0]?.trim() ?? null,
    userAgent: userAgent ?? null,
  };
}
