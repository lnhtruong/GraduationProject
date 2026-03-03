import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 *  - Incoming:  /api/edit/projects        -> Forward to: <edit_service_url>/projects
 *  - Incoming:  /api/edit/mascot_images   -> Forward to: <edit_service_url>/mascot_images
 */

router.use(
    '/',
    createProxyMiddleware({
        target: config.services.edit.url,
        changeOrigin: true,
        pathRewrite: {
            '^/api/edit': '',
        },
        onProxyReq: (proxyReq, req: AuthRequest) => {
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }

            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            if (req.body && Object.keys(req.body).length) {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }

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
            console.log(
                `[Edit Session Service] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`,
            );
        },
        onError: (err, req: Request, res: Response) => {
            console.error('[Edit Session Service Proxy Error]', err && err.message);
            res.status(503).json({
                success: false,
                message: 'Edit session service is unavailable',
            });
        },
    }),
);

export default router;


