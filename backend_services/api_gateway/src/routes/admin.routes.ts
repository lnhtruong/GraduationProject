import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(
  '/',
  createProxyMiddleware({
    target: config.services.payment.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/admin': '/admin',
    },
    onProxyReq: (proxyReq, req: AuthRequest) => {
      if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId.toString());
        proxyReq.setHeader('X-User-Role', req.user.role.toString());
      }
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      console.log(`[Admin Routes] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
    },
    onError: (err, req: Request, res: Response) => {
      console.error('[Admin Routes Proxy Error]', err && (err as any).message);
      res.status(503).json({
        success: false,
        message: 'Service unavailable',
      });
    },
  }),
);

export default router;
