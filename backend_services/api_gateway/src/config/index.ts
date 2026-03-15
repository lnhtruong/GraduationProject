import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:8001',
    },
    user: {
      url: process.env.USER_SERVICE_URL || 'http://localhost:8002',
    },
    mascot: {
      url: process.env.MASCOT_SERVICE_URL || 'http://localhost:8003',
    },
    edit: {
      // edit_session_service (projects, mascot_overlays)
      url: process.env.EDIT_SESSION_SERVICE_URL || 'http://localhost:8004',
    },
    mascot_colab: { url: process.env.MASCOT_COLAB_SERVICE_URL || 'http://localhost:3005' },
    payment: {
      url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3000',
    },
  },
  // trong 15p 1 ip dc gửi tối đa 100 request
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests
  },
};




