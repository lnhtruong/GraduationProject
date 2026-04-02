export const COOKIE_CONFIG = {
  REFRESH_TOKEN_NAME: 'refreshToken',
  REFRESH_TOKEN_OPTIONS: {
    httpOnly: true,
    secure: true, // SameSite=None requires Secure in modern browsers
    sameSite: 'none' as const, // Allow cross-site cookie (localhost frontend -> ngrok backend)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  },
} as const;
