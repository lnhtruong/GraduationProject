# 08 — Workflows (local dev, test, deploy)

## 1. Setup local từ đầu

### Prerequisites
- Node.js >= 18
- Yarn + npm
- Docker Desktop (cho MySQL + Redis)
- MySQL client (mysql CLI hoặc DBeaver/MySQL Workbench)

### Bước 1: Clone & start infra
```bash
git clone <repo>
cd GraduationProject
docker-compose up -d              # Start MySQL (3306) + Redis (6379)
docker ps                          # Verify graduation_mysql + graduation_redis running
```

### Bước 2: Migrate DB
```bash
cd database
cp .env.example .env               # Set DB_USER, DB_PASSWORD, DB_NAME (mặc định khớp docker-compose)
yarn install
yarn migrate                       # Chạy tất cả migration trong knex_migrations/
yarn migrate:status                # Verify
```

### Bước 3: Setup từng service

Mỗi service có flow: `cp .env.example .env` → install deps → start dev. Port mặc định khác nhau (xem dưới).

```bash
# Auth service
cd backend_services/auth_service
cp .env.example .env               # Set JWT_SECRET, MAIL_SERVICE_URL, DB_*, REDIS_*
yarn install
yarn start:dev                     # nest start --watch, port 8001

# User service
cd backend_services/user_service
cp .env.example .env
yarn install
yarn start:dev                     # port 8002

# Course service
cd backend_services/course_service
cp .env.example .env               # + OPENAI_API_KEY cho quiz AI
yarn install
yarn start:dev                     # port 8008

# Media service
cd backend_services/media_service
cp .env.example .env               # + BUNNY_*, CLOUDINARY_*
yarn install
yarn start:dev                     # port 8003

# Payment service
cd backend_services/payment_service
cp .env.example .env               # + PAYOS_*
npm install
npm run dev                        # nodemon, port 8006

# Mail service
cd backend_services/mail_service
cp .env.example .env               # + MAIL_USER, MAIL_PASS
npm install
npm run dev                        # TODO: xác minh port

# API Gateway (chạy CUỐI sau khi các service đã up)
cd backend_services/api_gateway
cp .env.example .env               # Set AUTH_SERVICE_URL=http://localhost:8001, USER_SERVICE_URL, ...
npm install
npm run dev                        # port 3000
```

### Bước 4: Setup frontend
```bash
cd frontend-nextjs
cp .env.example .env.local         # NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev                        # ⚠ port 3000 conflict với gateway!
                                   # Đổi: PORT=3001 npm run dev
```

## 2. Tổ hợp port mặc định (sau khi setup)

| Service | Local port |
|---------|-----------|
| MySQL | 3306 |
| Redis | 6379 |
| `api_gateway` | 3000 |
| `frontend-nextjs` | 3001 (sau khi đổi từ default 3000) |
| `auth_service` | 8001 |
| `user_service` | 8002 |
| `media_service` | 8003 |
| `payment_service` | 8006 |
| `course_service` | 8008 |
| `mail_service` | TODO |
| `inference_service` | TODO |
| `ai_service` | (CLI — không listen) |

## 3. Lệnh hữu ích

### Database
```bash
cd database
yarn migrate                       # Chạy migration pending
yarn migrate:rollback              # Rollback batch cuối
yarn migrate:status                # Current version
yarn migrate:list                  # Show all migrations
yarn migrate:railway               # Migrate prod (Railway DB)
```

### Test (NestJS services)
```bash
cd backend_services/auth_service
yarn test                          # Unit tests
yarn test:watch                    # Watch mode
yarn test:cov                      # With coverage
yarn test:e2e                      # End-to-end
```

### Build production
```bash
# NestJS service
yarn build                         # Output: dist/
yarn start:prod                    # node dist/main

# API Gateway (TypeScript)
npm run build                      # tsc → dist/
npm start                          # node dist/index.js

# Frontend
npm run build                      # next build
npm start                          # next start
```

### Lint
```bash
yarn lint                          # Mọi NestJS service
npm run lint                       # Gateway, frontend
```

## 4. Debug

### Logs
- API Gateway log mỗi request qua `loggingMiddleware` — xem terminal gateway
- Mỗi service NestJS log câu lệnh SQL nếu `logging: true` trong Sequelize config
- Frontend: browser console + Next.js terminal

### DB inspect
```bash
docker exec -it graduation_mysql mysql -u graduation_user -pgraduation_password graduation_db
# Hoặc dùng GUI client tới localhost:3306
```

### Redis inspect
```bash
docker exec -it graduation_redis redis-cli
> KEYS *
> GET MAIL_OTP:user@example.com
```

### WebSocket
- Note debug ở `WEBSOCKET_DEBUG.md` (root) và `backend_services/media_service/src/websocket/README.md`
- Frontend test: trang `app/(app)/components/SseTestClient.tsx`

## 5. Test API thủ công

Xem `README_SETUP.md` để có curl examples cho register/login/profile.

Quick test:
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login (capture accessToken)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile
curl http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <accessToken>"
```

## 6. Deploy production (Render.com)

### Config
- `render.yaml` ở root — Infrastructure as Code
- Mỗi service một entry `type: web` hoặc `type: redis` (DB không có trong file — dùng external Railway MySQL)

### Services deployed (theo `render.yaml`)
- `api-gateway`
- `auth-service`
- `user-service`
- ~~`edit-session-service`~~ (đã xóa local — entry còn trong render.yaml nhưng deploy sẽ fail)
- `mail-service`
- `payment-service`
- ~~`mascot-video-service`~~ (đã xóa local)
- `redis-cache` (managed Redis)

### Missing from render.yaml
- `course_service` — TODO: xác minh deploy thế nào (manual entry trên Render dashboard?)
- `media_service` — TODO: xác minh
- `inference_service`, `ai_service` — chưa deploy

### Env secrets cần set ở Render
- `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` (Railway MySQL)
- `JWT_SECRET` (consistent giữa gateway + auth_service)
- `CORS_ORIGINS` (auth_service)
- `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_WEBHOOK_URL`, `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL`
- `BUNNY_API_KEY`, `BUNNY_LIBRARY_ID`, …
- `CLOUDINARY_*`
- `OPENAI_API_KEY`

### Manual migration prod
```bash
cd database
DB_HOST=... DB_PORT=... DB_USER=... DB_PASSWORD=... DB_NAME=... yarn migrate:railway
```

## 7. AI model service (deploy-model)

```bash
cd deploy-model
chmod +x setup.sh setup_full.sh setup_joyvasa_fast.sh setup_api_only.sh
./setup_full.sh                    # Full install (joyvasa + dependencies)
# hoặc ./setup_api_only.sh nếu chỉ cần API
python main.py                     # Start FastAPI server (TODO: xác minh port)
```

## 8. Common troubleshooting

| Triệu chứng | Nguyên nhân thường gặp |
|-------------|------------------------|
| Gateway trả 403 "Endpoint access is not configured" | Endpoint chưa thêm rule trong `api_gateway/src/middleware/access-policy.ts` |
| 401 trên endpoint cần auth | Token expire, gọi `/api/auth/refresh` trước |
| `JsonWebTokenError: invalid signature` | `JWT_SECRET` giữa gateway và auth_service không khớp |
| DB connect refused | Docker container chưa up hoặc port 3306 bị chiếm |
| Sequelize "Unknown column" | Migration chưa chạy, hoặc Sequelize model trỏ sai field |
| CORS error | `CORS_ORIGINS` env chưa set ở auth_service / gateway, hoặc origin thiếu |
| WebSocket không connect | Gateway WS proxy lỗi — xem `WEBSOCKET_DEBUG.md` |
| OTP không nhận được mail | `MAIL_USER`/`MAIL_PASS` sai (Gmail cần App Password) |
| PayOS webhook fail | `PAYOS_WEBHOOK_URL` chưa đúng public URL, hoặc HMAC mismatch |
