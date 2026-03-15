import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config';

const router = Router();

// Proxy all payment routes to payment service
router.use(
  '/',
  createProxyMiddleware({
    target: config.services.payment.url,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Results in /payment/create-payment instead of /create-payment
    },
    onProxyReq: (proxyReq, req: Request) => {
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

      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req: Request, res: Response) => {
      // Log proxy response
      console.log(
        `[Payment Service] ${req.method} ${req.path} -> ${proxyRes.statusCode}`,
      );
    },
    onError: (err, req: Request, res: Response) => {
      console.error('[Payment Service Proxy Error]', err.message);
      res.status(503).json({
        success: false,
        message: 'Payment service is unavailable',
      });
    },
  }),
);

export default router;
