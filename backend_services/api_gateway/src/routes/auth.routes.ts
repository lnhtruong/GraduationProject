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
      '^/api': '', // Remove /api/auth prefix when forwarding
    },
    onProxyReq: (proxyReq, req: Request) => {

      // console.log('request: ', req);

      // console.log('req: ', req);
      // const bodyData = JSON.stringify(req.body);
      // Forward original headers 
      if (req.headers['content-type']) {
        proxyReq.setHeader('Content-Type', req.headers['content-type']);
      }
      if (req.headers.cookie) {
        proxyReq.setHeader('Cookie', req.headers.cookie);
      }
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }

      // proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));

      // Write the parsed body for any method that can carry one — including
      // empty `{}` objects. Skipping empty bodies leaves the original
      // Content-Length header in place but no body bytes, which makes the
      // upstream wait forever for the missing bytes.
      if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }

    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {

      if (proxyRes.headers['set-cookie']) {
        res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
      }
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

