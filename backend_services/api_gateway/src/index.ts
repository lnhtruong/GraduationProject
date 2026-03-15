import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { loggingMiddleware, requestLogger } from './middleware/logging.middleware';
import { authMiddleware, AuthRequest } from './middleware/auth.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import mascotRoutes from './routes/mascot.routes';
import editRoutes from './routes/edit.routes';
import mascotColabRoutes from './routes/mascot_colab_routes';

const app = express();

// Middleware
app.use(cors({
  credentials: true, // ⭐ Cho phép gửi cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggingMiddleware);
app.use(requestLogger);

// ⭐ Parse cookies - BẮT BUỘC để đọc cookies
app.use(cookieParser());

// Apply rate limiting to all routes
app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API Gateway is online and healthy',
    services: {
        auth: config.services.auth.url,
        user: config.services.user.url,
        mascot: config.services.mascot.url,
        edit: config.services.edit.url
    },
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
];

// Global auth middleware for all other routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (PUBLIC_ROUTES.includes(req.path)) {
    return next();
  }

  return authMiddleware(req as AuthRequest, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mascot', mascotRoutes);
app.use('/api/edit', editRoutes);
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
app.listen(config.port, '0.0.0.0', () => {
  console.log(` API Gateway is running on port ${config.port}`);
  console.log(` Auth Service: ${config.services.auth.url}`);
  console.log(` User Service: ${config.services.user.url}`);
  console.log(` Mascot Service: ${config.services.mascot.url}`);
  console.log(` Edit Session Service: ${config.services.edit.url}`);
  console.log(` Mascot Colab Service: ${config.services.mascot_colab.url}`);
});




