import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import {
  authMutatingRateLimitMiddleware,
  mediaMutatingRateLimitMiddleware,
} from './middleware/rate-limit.middleware';
import { loggingMiddleware, requestLogger } from './middleware/logging.middleware';
import { AuthRequest } from './middleware/auth.middleware';
import { authorizationMiddleware } from './middleware/authorization.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import mediaRoutes from './routes/media.routes';
import mascotColabRoutes from './routes/mascot_colab_routes';
import courseRoutes from './routes/course.routes';
import instructorRoutes from './routes/instructor.routes';
import paymentRoutes from './routes/payment.routes';
import adminRoutes from './routes/admin.routes';
import feedRoutes from './routes/feed.routes';
import { createProxyMiddleware } from 'http-proxy-middleware';
import httpProxy from 'http-proxy';
import { IncomingMessage, ServerResponse } from 'http';

const app = express();
app.set('trust proxy', 1);

// Create http-proxy for WebSocket upgrades
const wsProxy = httpProxy.createProxyServer({
  target: config.services.media.url,
  changeOrigin: true,
  ws: true,
});

wsProxy.on('error', (err: Error, req: IncomingMessage, res: ServerResponse | any) => {
  console.error('[❌ Media WS Proxy Error]', {
    message: err.message,
    code: (err as any).code,
    stack: err.stack,
    url: req.url,
  });
  if (res && typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Media websocket service is unavailable',
    }));
  }
});

wsProxy.on('proxyRes', (proxyRes, req, res) => {
  console.log('[✅ Media WS Proxy Response]', {
    statusCode: proxyRes.statusCode,
    url: req.url,
  });
});

const mediaWebSocketProxy = createProxyMiddleware({
  target: config.services.media.url,
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
  onError: (err: Error, req: IncomingMessage, res: ServerResponse) => {
    console.error('[❌ Media WebSocket Proxy Middleware Error]', {
      message: err.message,
      code: (err as any).code,
      stack: err.stack,
      url: req.url,
    });
    if (res && !res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Media websocket service is unavailable',
      }));
    }
  },
});

// Middleware
app.use(cors({

  origin: function (origin, callback) {

    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'ngrok-skip-browser-warning'
  ],
}));
// Webhook paths: capture raw bytes as Buffer vào req.body để proxy có thể
// write trực tiếp vào proxyReq (HPM v3 không tự stream khi có onProxyReq).
// Đặt TRƯỚC express.json() để stream chưa bị consume.
app.use((req, res, next) => {
  if (!req.path.includes('/webhooks/')) return next();
  express.raw({ type: '*/*', limit: '10mb' })(req, res, next);
});

// Non-webhook: parse JSON / urlencoded như cũ
app.use((req, res, next) => {
  if (req.path.includes('/webhooks/')) return next();
  express.json()(req, res, next);
});
app.use((req, res, next) => {
  if (req.path.includes('/webhooks/')) return next();
  express.urlencoded({ extended: true })(req, res, next);
});
app.use(loggingMiddleware);
app.use(requestLogger);

//  Parse cookies
app.use(cookieParser());

// Socket.IO handshake + polling/websocket transport forwarding to media service.
app.use('/socket.io', mediaWebSocketProxy);

// Rate limit: chỉ POST/PATCH/PUT/DELETE trên /api/auth và /api/media (trừ webhooks). GET không áp dụng.
app.use(authMutatingRateLimitMiddleware);
app.use(mediaMutatingRateLimitMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res, next) => {
  if (req.path.includes('course')) {
    console.log('==== WEBHOOK HIT ====');
    console.log('URL:', req.originalUrl);
    console.log('METHOD:', req.method);
    console.log('HEADERS:', req.headers);
    console.log('BODY:', req.body);
  }
  next();
});

// Global authorization middleware
app.use(authorizationMiddleware);

// Middleware to forward user ID to downstream services
app.use((req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.userId) {
    req.headers['x-user-id'] = String(req.user.userId);
    req.headers['x-user-role'] = String(req.user.role);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/instructors', userRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/mascot_colab', mascotColabRoutes);
app.use('/api/feed', feedRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(` API Gateway is running on port ${config.port}`);
  console.log(` Auth Service: ${config.services.auth.url}`);
  console.log(` User Service: ${config.services.user.url}`);
  console.log(` Course Service: ${config.services.course.url}`);
  console.log(` Media Service: ${config.services.media.url}`);
  console.log(` Payment Service: ${config.services.payment.url}`);
  // console.log(` Edit Session Service: ${config.services.edit.url}`);
  console.log(` Mascot Colab Service: ${config.services.mascot_colab.url}`);
});

server.on('upgrade', (req, socket, head) => {
  console.log('[📡 WebSocket Upgrade]', {
    url: req.url,
    headers: {
      upgrade: req.headers.upgrade,
      connection: req.headers.connection,
      'sec-websocket-version': req.headers['sec-websocket-version'],
    },
  });

  socket.on('error', (err) => {
    console.error('[❌ WebSocket Socket Error]', {
      message: err.message,
      code: (err as any).code,
    });
  });

  wsProxy.ws(req, socket, head);
});




