# API Gateway

API Gateway cho microservices architecture, chịu trách nhiệm:
- Routing requests đến các services
- Verify JWT access token
- Rate limiting
- Logging
- Auth middleware

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm start
```

## Environment Variables

```env
PORT=3000
JWT_SECRET=your-secret-key-change-in-production
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Routes

- `/health` - Health check
- `/api/auth/*` - Proxy to auth service (no auth required)
- `/api/users/*` - Proxy to user service (auth required)




