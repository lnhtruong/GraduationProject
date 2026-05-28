import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';
import type { AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(
  '/',
  createProxyMiddleware({
    target: config.services.course.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api/course': '',
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
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role.toString());
      }

      const contentType = req.headers['content-type'] || '';
      if (
        contentType.includes('application/json') &&
        req.body &&
        typeof req.body === 'object'
      ) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      if (proxyRes.headers['set-cookie']) {
        res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
      }
      console.log(`[Course Service] ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
    },
    onError: (err, req: Request, res: Response) => {
      console.error('[Course Service Proxy Error]', err && (err as any).message);
      res.status(503).json({
        success: false,
        message: 'Course service is unavailable',
      });
    },
  }),
);

export default router;

