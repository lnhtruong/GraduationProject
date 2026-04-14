// src/routes/feed.routes.ts
import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';

const router = Router();

/**
 * Forward /api/feed/* to media_service /feed/*
 */
router.use(
    '/',
    createProxyMiddleware({
        target: config.services.media.url,
        changeOrigin: true,
        pathRewrite: {
            '^/api/feed': '/feed', // Remove /api/feed prefix
        },
    }),
);

export default router;