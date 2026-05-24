# 04 — Modules Index

Mỗi service / module một file. Khi làm task, mở **chỉ file của module mình động chạm**.

## Bảng dịch vụ

| File | Service | Tech | Default port | Entry |
|------|---------|------|--------------|-------|
| [api-gateway.md](./api-gateway.md) | API Gateway | Express + TS | `3000` | `backend_services/api_gateway/src/index.ts` |
| [auth-service.md](./auth-service.md) | Auth Service | NestJS | `8001` | `backend_services/auth_service/src/main.ts` |
| [user-service.md](./user-service.md) | User Service | NestJS | `8002` | `backend_services/user_service/src/main.ts` |
| [course-service.md](./course-service.md) | Course Service | NestJS | `8008` | `backend_services/course_service/src/main.ts` |
| [media-service.md](./media-service.md) | Media Service | NestJS + Socket.IO | `8003` | `backend_services/media_service/src/main.ts` |
| [payment-service.md](./payment-service.md) | Payment Service | Express + JS | `8006` (env) | `backend_services/payment_service/src/server.js` |
| [mail-service.md](./mail-service.md) | Mail Service | Express + JS | `3000` | `backend_services/mail_service/src/server.js` |
| [ai-service.md](./ai-service.md) | AI Service (CLI) | Node + OpenAI | — | `backend_services/ai_service/index.js` |
| [inference-service.md](./inference-service.md) | Inference (Colab pool) | NestJS | `3005` | `backend_services/inference_service/src/main.ts` |
| [frontend-nextjs.md](./frontend-nextjs.md) | Web client | Next.js 16 + React 19 | `3000` (dev) | `frontend-nextjs/app/layout.tsx` |
| [database.md](./database.md) | DB schema & migrations | Knex + MySQL | — | `database/knexfile.js` |

---

## Lookup nhanh theo feature

| Feature | Service chính | Module dir |
|---|---|---|
| Register / login / JWT / OTP reset | `auth_service` | `src/auth/` |
| Google OAuth | `auth_service` | `src/auth/auth.service.ts > googleLogin` |
| User profile, role, reset password | `user_service` | `src/users/` |
| Course CRUD + review/publish workflow | `course_service` | `src/course/` |
| Lesson | `course_service` | `src/lessons/` |
| Quiz thủ công | `course_service` | `src/quizzes/` |
| Quiz AI (OpenAI từ SRT) | `course_service` | `src/quizzes/helper/quiz.gen.ts` |
| Cart, enroll, check-mine-exists | `course_service` | `src/carts/`, `src/enrolls/` |
| Lesson progress | `course_service` | `src/lessonProgress/` |
| Roadmap (ordered courses) | `course_service` | `src/roadmaps/` |
| Feedback / reaction | `course_service` | `src/feedbacks/`, `src/feedback-reactions/` |
| Report → ban user / course / lesson | `course_service` | `src/reports/` |
| Video upload Bunny (TUS) | `media_service` | `src/bunny/`, `src/videos/` |
| Video metadata CRUD | `media_service` | `src/videos/` |
| Mascot overlay editor | `media_service` | `src/projects/`, `src/mascot_overlays/`, `src/images_mascot/` |
| Newsfeed (short video, like/save/view/comment) | `media_service` | `src/feed/` |
| Notifications (DB + push) | `media_service` | `src/notifications/` |
| Server-Sent Events | `media_service` | `src/sse/` |
| WebSocket (Socket.IO `/media`) | `media_service` | `src/websocket/` |
| Cloudinary upload (sign + raw) | `media_service` | `src/cloudinary/` |
| Webhooks Cloudinary / Bunny / AI | `media_service` | `src/webhook/` |
| PayOS payment + transaction | `payment_service` | `src/` |
| Redis Pub/Sub payment events | `payment_service` | `src/services/event.publisher.js` |
| Email OTP, forgot password | `mail_service` | `src/` |
| Colab pool routing (highlight, mascot, quiz) | `inference_service` | `src/colab/`, `src/app.controller.ts` |
| Web UI (student / lecturer / admin) | `frontend-nextjs` | `app/` + `features/` |
| Migrations + schema | `database` | `knex_migrations/` |

---

## Service dependency graph

```mermaid
graph TD
    FE[frontend-nextjs<br/>:3000]
    GW[api_gateway<br/>:3000]
    AS[auth_service<br/>:8001]
    US[user_service<br/>:8002]
    CS[course_service<br/>:8008]
    MS[media_service<br/>:8003]
    PS[payment_service<br/>:8006]
    MAIL[mail_service<br/>:3000]
    INF[inference_service<br/>:3005]
    AI[ai_service<br/>(CLI)]
    DB[(MySQL<br/>graduation_db)]
    R[(Redis)]
    BUN[Bunny Stream]
    CLD[Cloudinary]
    PO[PayOS]
    SMTP[SMTP]
    OAI[OpenAI]
    COL[Colab workers<br/>+ ngrok]
    QS[Upstash QStash]

    FE -- HTTPS /api/* + Socket.IO --> GW
    GW --> AS
    GW --> US
    GW --> CS
    GW --> MS
    GW --> PS
    GW --> INF
    AS -- POST /mail/otp --> MAIL
    AS -- refresh token --> R
    AS --> DB
    US --> DB
    CS --> DB
    CS -- POST /quizzes/ai --> OAI
    MS --> DB
    MS --> R
    MS --> BUN
    MS --> CLD
    PS --> DB
    PS -- publish events --> R
    PS -- POST /enroll, DELETE /carts/items --> CS
    PS --> PO
    MAIL --> R
    MAIL --> SMTP
    INF -- pickHealthy + forward --> COL
    INF --> R
    COL -- publish result --> QS
    QS -- webhook /webhooks/ai-model/result --> MS
    AI -. dev offline .- OAI
```

**Đọc đồ thị này khi:** chuẩn bị thay đổi 1 service và muốn biết service nào sẽ vỡ. Cụ thể:

- Sửa `auth_service` (endpoint, payload) → gateway access-policy + frontend `lib/http.ts` + `mail_service`.
- Sửa `course_service` enroll/cart → `payment_service` (gọi vào sau khi PayOS thành công).
- Sửa `media_service` webhook contract → Bunny / Cloudinary / Colab dashboard cần update URL.
- Sửa schema bảng → tạo migration trong `database/` trước, sau đó cập nhật Sequelize model ở mọi service đụng bảng đó.

---

## Cấu trúc 1 doc (style guide)

Mỗi file `*.md` trong folder này nên có:

1. **Header** + entry + port mặc định.
2. **Mục đích** ngắn gọn (bullet, 5–8 dòng).
3. **Sequence diagram** ít nhất 1 cái cho flow tiêu biểu (mermaid).
4. **Module / folder tree** (tree text).
5. **Endpoints table** (Method / Path / Access / Body / Mô tả).
6. **Env vars** table.
7. **Scripts** (`yarn dev`, `yarn start`).
8. **Tips** debug cuối file (gạch đầu dòng các "vết đau" hay gặp).

Giữ nguyên format này khi thêm doc mới.
