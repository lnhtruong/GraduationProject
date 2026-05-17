# API Gateway

## Mục đích
- Single public entry cho toàn bộ frontend
- JWT verify + role-based access control + rate limit
- Proxy HTTP và WebSocket tới microservice tương ứng
- Inject identity headers (`x-user-id`, `x-user-role`, `x-user-email`) cho downstream

## File / Folder

| Path | Mô tả |
|------|-------|
| `backend_services/api_gateway/src/index.ts` | Bootstrap Express, mount middleware + routes, listen, handle WebSocket upgrade |
| `backend_services/api_gateway/src/config/index.ts` | Đọc env: `PORT`, `JWT_SECRET`, service URLs, rate limit |
| `backend_services/api_gateway/src/middleware/auth.middleware.ts` | `authMiddleware`: verify JWT, decode `{userId, email, role}` → `req.user` |
| `backend_services/api_gateway/src/middleware/authorization.middleware.ts` | `authorizationMiddleware`: lookup rule từ `access-policy`, gọi `authMiddleware` nếu cần, check role |
| `backend_services/api_gateway/src/middleware/access-policy.ts` | `enum UserRole`, **`ACCESS_RULES` array** (~700 dòng) định nghĩa toàn bộ endpoint + access level |
| `backend_services/api_gateway/src/middleware/rate-limit.middleware.ts` | `authMutatingRateLimitMiddleware`, `mediaMutatingRateLimitMiddleware` |
| `backend_services/api_gateway/src/middleware/logging.middleware.ts` | Log mỗi request |
| `backend_services/api_gateway/src/routes/auth.routes.ts` | Proxy `/api/auth/*` → `AUTH_SERVICE_URL` |
| `backend_services/api_gateway/src/routes/user.routes.ts` | Proxy `/api/users/*` → `USER_SERVICE_URL` |
| `backend_services/api_gateway/src/routes/course.routes.ts` | Proxy `/api/course/*` → `COURSE_SERVICE_URL` |
| `backend_services/api_gateway/src/routes/media.routes.ts` | Proxy `/api/media/*` → `MEDIA_SERVICE_URL` |
| `backend_services/api_gateway/src/routes/payment.routes.ts` | Proxy `/api/payment/*` → `PAYMENT_SERVICE_URL` |
| `backend_services/api_gateway/src/routes/feed.routes.ts` | Proxy `/api/feed/*` (gọi tới media service, có thể không cần — **TODO: xác minh**) |
| `backend_services/api_gateway/src/routes/mascot_colab_routes.ts` | Proxy `/api/mascot_colab/*` → `MASCOT_COLAB_SERVICE_URL` (model AI) |

## Kiến trúc xử lý request (theo thứ tự middleware)

`backend_services/api_gateway/src/index.ts`:

```
1. cors                (allow all origin, credentials true)
2. express.json + urlencoded
3. loggingMiddleware + requestLogger
4. cookieParser
5. '/socket.io' proxy  → media service (sớm để WS bypass)
6. authMutatingRateLimitMiddleware    (rate limit cho POST/PATCH/PUT/DELETE auth)
7. mediaMutatingRateLimitMiddleware   (rate limit cho POST/PATCH/PUT/DELETE media)
8. GET /health         (skip auth)
9. (debug log if path contains 'course')
10. authorizationMiddleware   ← Trái tim: tra rule + verify JWT + check role
11. inject x-user-id / x-user-role headers
12. mount route files: authRoutes / userRoutes / courseRoutes / paymentRoutes / mediaRoutes / mascotColabRoutes / feedRoutes
13. 404 handler
14. error handler
```

WebSocket upgrade:
- `server.on('upgrade', ...)` → forward thẳng tới `mediaWebSocketProxy` (target = `MEDIA_SERVICE_URL`)
- `app.use('/socket.io', mediaWebSocketProxy)` cũng cover polling fallback

## Access policy rule format

File: `backend_services/api_gateway/src/middleware/access-policy.ts`

```ts
interface AccessRule {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' | 'OPTIONS' | '*';
  pattern: string | RegExp;
  access: 'public' | 'authenticated' | 'roles';
  roles?: UserRole[];   // chỉ khi access === 'roles'
}
```

Pattern syntax tự define:
- `:param` — match 1 segment
- `*` — match 1 segment
- `**` — match phần còn lại
- literal — exact

Hàm `getAccessRule(req)` duyệt `ACCESS_RULES` theo thứ tự, trả rule đầu match. Method `OPTIONS` luôn public (CORS preflight).

Khi không match rule nào → **deny** với "Endpoint access is not configured" (403).

## Quirks / lưu ý

- **`access-policy.ts` là file phải sửa khi thêm endpoint mới**. Nếu downstream service tạo endpoint mới mà không thêm rule ở đây → Gateway sẽ trả 403.
- Rate limit chỉ áp **mutating methods** (POST/PATCH/PUT/DELETE), KHÔNG áp cho GET. Configurable qua env `RATE_LIMIT_AUTH_MUTATING_MAX`, `RATE_LIMIT_MEDIA_MUTATING_MAX`.
- Body forward: khi proxy POST có JSON body, code **tự stringify và `proxyReq.write()`** (xem `routes/auth.routes.ts` lines 35-39) — vì `express.json()` đã consume stream.
- Path rewrite: `/api/auth/login` → forward thành `/auth/login` tới `auth_service` (rewrite `^/api` → `''`). Mỗi route file định nghĩa rewrite khác nhau.
- WebSocket Socket.IO traffic: client connect tới `<gateway>/socket.io/...` → proxy tới `media_service`. Polling fallback hoạt động qua `app.use('/socket.io', mediaWebSocketProxy)`.
- JWT secret hardcoded fallback (`'your-secret-key-change-in-production'`) trong `config/index.ts` — production phải set `JWT_SECRET` env.

## Dependencies sang module khác
- Verify JWT bằng `JWT_SECRET` — phải KHỚP với `auth_service` (cùng env)
- Service URLs từ env (`AUTH_SERVICE_URL`, `USER_SERVICE_URL`, `COURSE_SERVICE_URL`, `MEDIA_SERVICE_URL`, `PAYMENT_SERVICE_URL`, `MASCOT_COLAB_SERVICE_URL`)

## Cách chạy local
```bash
cd backend_services/api_gateway
cp .env.example .env   # (nếu có)
npm install
npm run dev            # ts-node-dev, port 3000
```

## Endpoint debug
- `GET /health` → `{ success: true, message, timestamp }`
