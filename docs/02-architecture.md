# 02 — Architecture

## Sơ đồ tổng thể

```
                          ┌──────────────────────────┐
                          │  Browser (Next.js SPA)   │
                          │  frontend-nextjs/        │
                          └────────────┬─────────────┘
                                       │ HTTPS (REST + Socket.IO + SSE)
                                       │ Authorization: Bearer <accessToken>
                                       │ Cookie: refreshToken (HttpOnly)
                                       ▼
                          ┌──────────────────────────┐
                          │     API Gateway          │
                          │ backend_services/        │
                          │ api_gateway/ (Express)   │
                          │  - cors / rate-limit     │
                          │  - JWT verify            │
                          │  - role-based access     │
                          │  - x-user-id / role inject│
                          │  - proxy http + ws       │
                          └─┬────┬────┬────┬────┬────┘
            ┌───────────────┘    │    │    │    └──────────────────┐
            ▼                    ▼    ▼    ▼                       ▼
     ┌──────────────┐  ┌──────────────┐  ┌────────────────┐ ┌─────────────┐
     │ auth_service │  │ user_service │  │ course_service │ │ media_service│
     │   (NestJS)   │  │   (NestJS)   │  │    (NestJS)    │ │   (NestJS)   │
     │ login/JWT/   │  │ profile/     │  │ courses/lessons│ │ videos/feed/ │
     │ OTP/refresh  │  │ role update  │  │ quizzes/carts/ │ │ projects/    │
     │              │  │              │  │ enrolls/feedb. │ │ mascot/SSE/WS│
     └──┬───────┬───┘  └──────┬───────┘  └────────┬───────┘ └───┬──────────┘
        │       │             │                   │             │
        │       │             │                   │             │
        │       └─────────────┴───────────────────┴─────────────┤
        │                                                       │
        │                                                       │
        ▼                                                       ▼
   ┌─────────┐                                          ┌──────────────┐
   │  Redis  │ ◄── payment_service publish ─────────────│ payment_svc  │
   │  (cache │     payment:webhook                      │  (Express)   │
   │  + pubsub│    payment:success                      │  PayOS       │
   │  + OTP) │     mail_service consumes OTP            └──────────────┘
   └─────────┘                                                 │
        ▲                                                      │
        │   mail_service ── nodemailer ──► SMTP (Gmail)        │
        │                                                      │
        └──────────────────────────────────────────────────────┘

                          ┌──────────────────────────┐
                          │       MySQL 8            │  ← All Sequelize services
                          │   graduation_db          │     connect directly
                          │   - users / roles        │     (no shared module)
                          │   - courses / lessons    │     Migrations:
                          │   - videos / projects    │     database/knex_migrations
                          │   - feed / notifications │
                          │   - transactions / cart  │
                          └──────────────────────────┘

                                   ▲
                                   │
   ┌──────────────┐                │             ┌──────────────────┐
   │ Bunny Stream │ ◄────TUS upload + webhook────┤  media_service   │
   │ (video CDN)  │                              │  /webhooks/      │
   └──────────────┘                              │  bunny-stream    │
                                                 └──────────────────┘
   ┌──────────────┐                              ┌──────────────────┐
   │ Cloudinary   │ ◄── signed upload ───────────┤  media_service   │
   │ (image CDN)  │      /cloudinary/sign        │  /cloudinary/*   │
   └──────────────┘                              └──────────────────┘

   ┌──────────────┐                              ┌──────────────────┐
   │  OpenAI API  │ ◄── HTTP POST ───────────────┤ course_service   │
   │              │   (quiz generation)          │ /quizzes/ai      │
   └──────────────┘                              │ + ai_service CLI │
                                                 └──────────────────┘
```

## Các layer chính

### 1. Edge / Gateway layer
- **File**: `backend_services/api_gateway/src/index.ts`
- **Trách nhiệm**:
  - CORS, rate-limit (chỉ áp cho POST/PATCH/PUT/DELETE trên `/api/auth`, `/api/media`)
  - JWT verify (qua `middleware/auth.middleware.ts`)
  - Role-based authorization (qua `middleware/access-policy.ts` — bảng rule lớn)
  - Inject `x-user-id`, `x-user-role`, `x-user-email` headers vào request downstream
  - Proxy HTTP (`http-proxy-middleware`) và WebSocket (`http-proxy`) tới service tương ứng
  - Phân route theo prefix: `/api/auth`, `/api/users`, `/api/course`, `/api/media`, `/api/payment`, `/api/mascot_colab`, `/api/feed`
- **Quirk**: WebSocket socket.io traffic được forward thẳng tới `media_service` (xem `app.use('/socket.io', mediaWebSocketProxy)`).

### 2. Service layer (microservices)
Mỗi service tự chứa: controller (HTTP), service (business), Sequelize models (data), DTO (validation `class-validator`). Không có shared lib — mỗi service tự define model trùng nhau cho các bảng cần truy cập (vd `course.model.ts` xuất hiện ở cả `course_service` và `media_service`).

**Communication giữa services**:
- **Đồng bộ**: HTTP qua Axios khi cần (vd `auth_service` gọi `mail_service` để gửi OTP — config `MAIL_SERVICE_URL` trong `auth_service/.env`)
- **Bất đồng bộ**: Redis Pub/Sub (xem `backend_services/payment_service/REDIS_EVENTS.md`)
  - Channels: `payment:webhook`, `payment:success`, `payment:failed`
  - Consumer mẫu: services khác `subscribe` để cấp quyền enroll sau payment

### 3. Data layer
- **MySQL 8**: tất cả service connect chung 1 DB (`graduation_db`). Mỗi service Sequelize chỉ register models nó dùng.
- **Migrations**: tập trung ở `database/knex_migrations/`. Production dùng `yarn migrate:railway` (xem `database/knexfile.js`).
- **Redis 7**: nhiều use case:
  - `auth_service`: cache refresh token, blacklist (TTL = `REDIS_TTL=604800`s = 7d)
  - `mail_service`: OTP storage (`MAIL_OTP:<email>`, TTL 300s)
  - `payment_service`: pub/sub events
  - `media_service`: feed recommendation cache (xem `feed/feed-recommendation.worker.ts`)

### 4. External integrations
| Service | Provider | Use |
|---------|----------|-----|
| Image hosting | Cloudinary | Avatar, mascot images, course thumbnail |
| Video hosting | Bunny Stream | Course lesson video, highlight feed video |
| Payment | PayOS | Tạo payment link, webhook verify |
| LLM | OpenAI | Quiz generation từ SRT transcript |
| Email | Gmail SMTP (Nodemailer) | OTP, forgot password |
| AI model deploy | `deploy-model/` (joyvasa wrapper) | Mascot talking-head video gen |

## Data flow chính

### A) Authentication flow
1. `POST /api/auth/register` → Gateway → `auth_service/auth.controller.ts` `register()` → tạo user (`users` table, hash bcrypt)
2. `POST /api/auth/login` → trả `accessToken` (15min) trong response body + set `refreshToken` (7d) trong HTTP-only cookie
3. Mỗi request từ client mang `Authorization: Bearer <accessToken>` → Gateway verify → inject `x-user-id` header → forward
4. Khi access token hết hạn → frontend gọi `POST /api/auth/refresh` (cookie tự gửi kèm) → trả access token mới
5. `POST /api/auth/logout` → clear cookie + xóa refresh token trong Redis

### B) Forgot password / OTP flow
1. Client → `POST /api/auth/forgot-password { email }` → `auth_service` gọi HTTP tới `mail_service`
2. `mail_service` generate OTP 6 số, lưu Redis key `MAIL_OTP:<email>` TTL 5min, gửi email qua Nodemailer
3. Client nhập OTP → `POST /api/auth/check-otp { email, otp, newPassword }` → `auth_service` lấy OTP từ Redis (qua `mail_service`?) — **TODO: xác minh implementation chi tiết**

### C) Payment flow (xem chi tiết `04-modules/payment-service.md`)
1. Student cart → `POST /api/payment/create-payment { courseIds }` → `payment_service` tạo PayOS order, lưu `transactions` + `transaction_items`, return checkout URL
2. Student thanh toán trên PayOS → PayOS gọi webhook `POST /api/payment/payos-callback`
3. `payment_service` verify HMAC → publish Redis `payment:success` với `orderCode`
4. Các service subscribe (vd `course_service` qua mechanism nào đó — **TODO: xác minh có thực sự được consume hay không**) cấp enroll cho user

### D) Video upload + processing flow
1. Frontend `POST /api/media/bunny/videos/init-upload` → `media_service/bunny.controller.ts` → tạo Bunny video, trả TUS upload URL
2. Frontend upload bằng `tus-js-client` thẳng lên Bunny (không qua server)
3. Bunny xử lý xong → webhook `POST /api/media/webhooks/bunny-stream` → `media_service` update `videos` table (`bunny_video_guid`, status)
4. Frontend subscribe progress qua Socket.IO (`media_service/websocket/websocket.gateway.ts`) hoặc SSE (`media_service/sse/sse.controller.ts`)

### E) Newsfeed (short video) flow
1. Lecturer/admin highlight 1 video của course → `POST /api/feed { video_id, course_id, caption, hashtags }` → tạo row `highlight_feed`
2. Student scroll feed → `GET /api/media/feed?cursor&limit&mode=recommended&sessionId=` → `feed.service.ts` trả cursor-paginated, recommendation cache trong Redis
3. View → `POST /api/media/feed/:id/view { watch_duration, completed }` → log `feed_views`
4. Like/save/share → `POST /api/media/feed/:id/interact { type }` → ghi `feed_interactions`
5. Comment → `POST /api/media/feed/:id/comments { content, origin_cmt? }` (origin_cmt cho reply)

### F) Quiz AI generation flow
1. Lecturer chọn 1 lesson đã có video với SRT raw uploaded
2. `POST /api/course/quizzes/ai { lessonActivityId, ... }` → `course_service/quizzes/quizzes.service.ts` `createOneByAI()`
3. Service lấy SRT (`resolve-srt.ts`), gọi helper `quizzes/helper/quiz.gen.ts` (gọi OpenAI)
4. Trả về JSON quiz, lưu vào `quizzes` + `quiz_questions` + `quiz_options`

## Naming convention services ↔ Render
| Local folder | Render service name | Port local default |
|--------------|---------------------|--------------------|
| `api_gateway` | `api-gateway` | 3000 |
| `auth_service` | `auth-service` | 8001 (config gateway) |
| `user_service` | `user-service` | 8002 |
| `course_service` | (chưa thấy trong render.yaml — chạy local 8008) | 8008 |
| `media_service` | (chưa thấy trong render.yaml — chạy local 8003) | 8003 |
| `payment_service` | `payment-service` | 8006 |
| `mail_service` | `mail-service` | 10000 prod |
| ~~`edit_session_service`~~ | `edit-session-service` (đã xóa local) | - |
| ~~`mascot_video_service`~~ | `mascot-video-service` (đã xóa local) | - |

> **TODO: xác minh** — `render.yaml` chưa khai báo `course_service` và `media_service`; có thể deploy thủ công.
