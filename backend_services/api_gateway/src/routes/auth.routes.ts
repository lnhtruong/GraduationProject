import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';

const router = Router();

// Proxy all auth routes to auth service
router.use(
  '/',
  createProxyMiddleware({
    target: config.services.auth.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '', // Remove /api/auth prefix when forwarding
    },
    onProxyReq: (proxyReq, req: Request) => {
      // Forward original headers 
      if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      // Log proxy response
      console.log(
        `[Auth Service] ${req.method} ${req.path} -> ${proxyRes.statusCode}`,
      );
    },
    onError: (err, req: Request, res: Response) => {
      console.error('[Auth Service Proxy Error]', err.message);
      res.status(503).json({
        success: false,
        message: 'Auth service is unavailable',
      });
    },
  }),
);

export default router;

