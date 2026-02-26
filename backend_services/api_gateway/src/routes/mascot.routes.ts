// src/routes/mascot.routes.ts
import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Proxy all mascot routes to mascot microservice
 *
 * Mount this router on the gateway as: app.use('/api/mascot', mascotRoutes);
 *
 * Behavior:
 *  - Incoming:  /api/mascot/mascot_videos    -> Forward to: <mascot_service_url>/mascot_videos
 *  - Incoming:  /api/mascot/mascot_images    -> Forward to: <mascot_service_url>/mascot_images
 *
 * We remove the /api/mascot prefix when forwarding (pathRewrite).
 */
router.use(
    '/',
    createProxyMiddleware({
        target: config.services.mascot.url,
        changeOrigin: true,
        // remove the /api/mascot prefix so backend receives /mascot_videos, /mascot_images, ...
        pathRewrite: {
            '^/api/mascot': '',
        },
        onProxyReq: (proxyReq, req: AuthRequest) => {
            // Forward content-type and authorization
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            // Forward body if exists (POST/PUT/PATCH)
            if (req.body && Object.keys(req.body).length) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }

            // Forward authenticated user info to downstream services
            if (req.user) {
                if (req.user.userId !== undefined) {
                    proxyReq.setHeader('X-User-Id', req.user.userId.toString());
                }
                if (req.user.email) {
                    proxyReq.setHeader('X-User-Email', req.user.email);
                }
            }
        },
        onProxyRes: (proxyRes, req: Request, res: Response) => {
            // Simple logging for visibility
            console.log(
                `[Mascot Service] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`,
            );
        },
        onError: (err, req: Request, res: Response) => {
            console.error('[Mascot Service Proxy Error]', err && err.message);
            res.status(503).json({
                success: false,
                message: 'Mascot service is unavailable',
            });
        },
        // optional: increase timeout if mascot service can be slow
        // proxyTimeout: 30000,
        // timeout: 30000,
    }),
);

export default router;