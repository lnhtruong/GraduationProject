import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { loggingMiddleware, requestLogger } from './middleware/logging.middleware';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import mediaRoutes from './routes/media.routes';
import mascotColabRoutes from './routes/mascot_colab_routes';
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
  // Fix lỗi 1: Tự động lấy origin của request gửi đến để cho phép
  origin: function (origin, callback) {
    // Cho phép mọi origin (kể cả postman/curl không có origin)
    callback(null, true);
  },
  credentials: true, // ⭐ Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // Fix lỗi 2: BẮT BUỘC thêm 'ngrok-skip-browser-warning' vào đây
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'ngrok-skip-browser-warning' // Bypass trang cảnh báo của ngrok
  ],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(requestLogger);

// ⭐ Parse cookies - BẮT BUỘC để đọc cookies
app.use(cookieParser());

// Socket.IO handshake + polling/websocket transport forwarding to media service.
app.use('/socket.io', mediaWebSocketProxy);

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

// Public routes that DON'T require authentication
const PUBLIC_ROUTES = [
  '/health',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/check-otp',
  '/api/media/webhooks/cloudinary/upload',
  // '/api/media/cloudinary/sign',
  '/api/media/webhooks/ai-model/result'
];

app.use((req, res, next) => {
  if (req.path.includes('media')) {
    console.log('==== WEBHOOK HIT ====');
    console.log('URL:', req.originalUrl);
    console.log('METHOD:', req.method);
    console.log('HEADERS:', req.headers);
    console.log('BODY:', req.body);
  }
  next();
});

// Global auth middleware for all other routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/socket.io')) {
    return next();
  }

  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }

  return authMiddleware(req as AuthRequest, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/mascot_colab', mascotColabRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// Start server
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(` API Gateway is running on port ${config.port}`);
  console.log(` Auth Service: ${config.services.auth.url}`);
  console.log(` User Service: ${config.services.user.url}`);
  console.log(` Media Service: ${config.services.media.url}`);
  console.log(` Edit Session Service: ${config.services.edit.url}`);
  console.log(` Mascot Colab Service: ${config.services.mascot_colab.url}`);
});

// Handle WebSocket upgrades and proxy to media service
server.on('upgrade', (req, socket, head) => {
  console.log('[📡 WebSocket Upgrade]', {
    url: req.url,
    headers: {
      upgrade: req.headers.upgrade,
      connection: req.headers.connection,
      'sec-websocket-version': req.headers['sec-websocket-version'],
    },
  });

  // Handle socket errors
  socket.on('error', (err) => {
    console.error('[❌ WebSocket Socket Error]', {
      message: err.message,
      code: (err as any).code,
    });
  });

  // Proxy the upgrade
  wsProxy.ws(req, socket, head);
});




