// src/routes/mascot_colab.routes.ts
import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(
    '/',
    createProxyMiddleware({
        target: config.services.mascot_colab.url,
        changeOrigin: true,
        pathRewrite: {
            '^/api/mascot_colab': '', // Xoá prefix khi gọi sang NestJS
        },
        onProxyReq: (proxyReq, req: AuthRequest) => {
            // 1. Forward Headers
            if (req.headers['content-type']) {
                proxyReq.setHeader('Content-Type', req.headers['content-type']);
            }
            if (req.headers.authorization) {
                proxyReq.setHeader('Authorization', req.headers.authorization);
            }

            // 2. Forward User Info (nếu đã qua auth middleware)
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

            //Fix lỗi Proxy với file upload
            const contentType = req.headers['content-type'] || '';
            const isMultipart = contentType.includes('multipart/form-data');

            // Nếu KHÔNG phải upload file, và body đã bị express.json() parse mất, 
            // ta phải viết lại body vào proxyReq
            if (!isMultipart && req.body && req.method !== 'GET' && req.method !== 'HEAD') {
                const bodyData = JSON.stringify(req.body);
                proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
                proxyReq.write(bodyData);
            }
            // NẾU LÀ MULTIPART (Upload file): KHÔNG LÀM GÌ CẢ. 
            // http-proxy-middleware sẽ tự động pipe stream dữ liệu gốc sang NestJS.
        },
        onProxyRes: (proxyRes, req: Request, _res: Response) => {
            // Xoá CORS headers từ upstream để gateway's CORS middleware kiểm soát
            delete proxyRes.headers['access-control-allow-origin'];
            delete proxyRes.headers['access-control-allow-credentials'];
            delete proxyRes.headers['access-control-allow-methods'];
            delete proxyRes.headers['access-control-allow-headers'];
            console.log(
                `[Mascot Colab Service] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`,
            );
        },
        onError: (err, _req: Request, res: Response) => {
            console.error('[Mascot Colab Service Proxy Error]', err && err.message);
            res.status(503).json({
                success: false,
                message: 'Mascot Colab service is unavailable',
            });
        },
    }),
);

export default router;