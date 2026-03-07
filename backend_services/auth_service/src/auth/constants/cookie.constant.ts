export const COOKIE_CONFIG = {
    REFRESH_TOKEN_NAME: 'refreshToken',
    REFRESH_TOKEN_OPTIONS: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true khi production (HTTPS)
        sameSite: 'strict' as const, // Bảo vệ CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
    },
} as const;