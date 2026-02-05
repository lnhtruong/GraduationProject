import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Proxy all user routes to user service
router.use(
  '/',
  createProxyMiddleware({
    target: config.services.user.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '', // Remove /api/users prefix when forwarding
    },
    onProxyReq: (proxyReq, req: AuthRequest) => {
      // Forward original headers
      if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }

      // Forward userId in header for user service
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId.toString());
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      // Log proxy response
      console.log(
        `[User Service] ${req.method} ${req.path} -> ${proxyRes.statusCode}`,
      );
    },
    onError: (err, req: Request, res: Response) => {
      console.error('[User Service Proxy Error]', err.message);
      res.status(503).json({
        success: false,
        message: 'User service is unavailable',
      });
    },
  }),
);

export default router;

