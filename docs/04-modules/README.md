# 04 — Modules Index

Mỗi module/service một file. Đọc file của module bị động chạm khi làm task.

| File | Service | Tech | Entry |
|------|---------|------|-------|
| [api-gateway.md](./api-gateway.md) | API Gateway | Express + TS | `backend_services/api_gateway/src/index.ts` |
| [auth-service.md](./auth-service.md) | Auth Service | NestJS | `backend_services/auth_service/src/main.ts` |
| [user-service.md](./user-service.md) | User Service | NestJS | `backend_services/user_service/src/main.ts` |
| [course-service.md](./course-service.md) | Course Service | NestJS | `backend_services/course_service/src/main.ts` |
| [media-service.md](./media-service.md) | Media Service | NestJS + Socket.IO | `backend_services/media_service/src/main.ts` |
| [payment-service.md](./payment-service.md) | Payment Service | Express + JS | `backend_services/payment_service/src/server.js` |
| [mail-service.md](./mail-service.md) | Mail Service | Express + JS | `backend_services/mail_service/src/server.js` |
| [ai-service.md](./ai-service.md) | AI Service (CLI) | Node + OpenAI | `backend_services/ai_service/index.js` |
| [inference-service.md](./inference-service.md) | Inference (scaffold) | NestJS | `backend_services/inference_service/src/main.ts` |
| [frontend-nextjs.md](./frontend-nextjs.md) | Frontend chính | Next.js 16 | `frontend-nextjs/app/layout.tsx` |
| [database.md](./database.md) | Database & migrations | Knex + MySQL | `database/knexfile.js` |

## Lookup nhanh theo feature

| Feature | Service chính | Module dir |
|---------|---------------|------------|
| Register / login / JWT / OTP | `auth_service` | `src/auth/` |
| User profile, role | `user_service` | `src/users/` |
| Course CRUD, publish flow | `course_service` | `src/course/` |
| Lesson | `course_service` | `src/lessons/` |
| Quiz (manual + AI) | `course_service` | `src/quizzes/` |
| Cart, enroll | `course_service` | `src/carts/`, `src/enrolls/` |
| Roadmap | `course_service` | `src/roadmaps/` |
| Feedback / report | `course_service` | `src/feedbacks/`, `src/reports/` |
| Video upload + Bunny | `media_service` | `src/videos/`, `src/bunny/` |
| Mascot overlay editor | `media_service` | `src/projects/`, `src/mascot_overlays/`, `src/images_mascot/` |
| Newsfeed (short video) | `media_service` | `src/feed/` |
| Notification, SSE, WS | `media_service` | `src/notifications/`, `src/sse/`, `src/websocket/` |
| Payment (PayOS) | `payment_service` | `src/` |
| Email (OTP, forgot pw) | `mail_service` | `src/` |
| AI quiz CLI | `ai_service` | (root) |
