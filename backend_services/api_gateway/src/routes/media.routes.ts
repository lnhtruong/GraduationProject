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
                if (req.user.role !== undefined) {
                    proxyReq.setHeader('X-User-Role', req.user.role.toString());
                }
            }

            const isWebhook = req.path.startsWith('/webhooks/');

            if (isWebhook) {
                // Webhook body đã được `express.raw()` capture thành Buffer ở index.ts.
                // Quan trọng: phải clear Transfer-Encoding (Node đôi khi auto-chunk khi write)
                // và set Content-Length đúng, không để HPM ghi đè + ép body length.
                if (Buffer.isBuffer(req.body) && req.body.length > 0) {
                    proxyReq.removeHeader('transfer-encoding');
                    proxyReq.setHeader('Content-Length', req.body.length);
                    if (req.headers['content-type']) {
                        proxyReq.setHeader('Content-Type', req.headers['content-type']);
                    }
                    // Forward QStash signature header explicitly để chắc chắn không bị strip
                    if (req.headers['upstash-signature']) {
                        proxyReq.setHeader(
                            'upstash-signature',
                            req.headers['upstash-signature'] as string,
                        );
                    }
                    proxyReq.write(req.body);
                    console.log(
                        '[Mascot Proxy] webhook raw body forwarded',
                        'bytes=', req.body.length,
                        'first10Hex=', req.body.slice(0, 10).toString('hex'),
                        'last5Hex=', req.body.slice(-5).toString('hex'),
                        'firstUtf8=', JSON.stringify(req.body.toString('utf8').slice(0, 100)),
                        'sig=', req.headers['upstash-signature'] ? 'present' : 'missing',
                        'ct=', req.headers['content-type'],
                    );
                } else {
                    console.warn(
                        '[Mascot Proxy] webhook expected raw Buffer body but got',
                        typeof req.body, 'contentLength=', req.headers['content-length'],
                    );
                }
                return;
            }

            // Non-webhook: re-stringify đã parsed body
            if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
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