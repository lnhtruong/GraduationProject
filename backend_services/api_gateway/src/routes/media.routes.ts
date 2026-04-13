// src/routes/mascot.routes.ts
import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 *  - Incoming:  /api/media/videos    -> Forward to: <media_service_url>/videos
 *  - Incoming:  /api/media/mascot_images    -> Forward to: <media_service_url>/mascot_images
 *  - Incoming:  /api/media/mascot_overlays    -> Forward to: <media_service_url>/mascot_overlays
 *  - Incoming:  /api/media/projects    -> Forward to: <media_service_url>/projects
 *  - Incoming:  /api/media/webhooks/cloudinary/upload    -> Forward to: <media_service_url>/webhooks/cloudinary/upload
 */
router.use(
    '/',
    createProxyMiddleware({
        target: config.services.media.url,
        changeOrigin: true,
        pathRewrite: {
            '^/api/media': '',
        },
        onProxyReq: (proxyReq, req: AuthRequest) => {
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            if (req.user) {
                if (req.user.userId !== undefined) {
                    proxyReq.setHeader('X-User-Id', req.user.userId.toString());
                }
                if (req.user.email) {
                    proxyReq.setHeader('X-User-Email', req.user.email);
                }
            }

            if (req.body && Object.keys(req.body).length) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
        },
        onProxyRes: (proxyRes, req: Request, res: Response) => {
            console.log(
                `[Mascot Service] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`,
            );
        },
        onError: (err, req: Request, res: Response) => {
            console.error('[Mascot Service Proxy Error]', err && err.message);
            res.status(503).json({
                success: false,
                message: 'Media service is unavailable',
            });
        },
    }),
);

export default router;