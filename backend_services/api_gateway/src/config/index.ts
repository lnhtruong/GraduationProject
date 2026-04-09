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
    course: {
      url: process.env.COURSE_SERVICE_URL || 'http://localhost:8008',
    },
    media: {
      url: process.env.MEDIA_SERVICE_URL || 'http://localhost:8003',
    },
    payment: {
      url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8006',
    },
    mascot_colab: { url: process.env.MASCOT_COLAB_SERVICE_URL || 'http://localhost:3005' },
  },
  // trong 15p 1 ip dc gửi tối đa 100 request
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests
  },
};




