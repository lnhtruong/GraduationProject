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
      '^/api': '', // Remove /api prefix when forwarding
    },
    onProxyReq: (proxyReq, req: AuthRequest) => {

      console.log('check header: ', req.headers);
      // Forward original headers
      if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }

      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }

      if (
        req.method !== 'GET' &&
        req.method !== 'HEAD' &&
        req.body &&
        Object.keys(req.body).length > 0
      ) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }

      // console.log('check req.user: ', req.user);

      // Forward userId in header for user service
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.userId.toString());
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      if (proxyRes.headers['set-cookie']) {
        res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
      }
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

