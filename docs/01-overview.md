# 01 — Project Overview

## Mục đích dự án

`GraduationProject` là một **nền tảng học trực tuyến (LMS) tích hợp social/short-video** với 4 trụ chính:

1. **Học tập có cấu trúc**: lecturer tạo course → lesson → quiz/assignment; student enroll, học, theo dõi progress, làm quiz; lecturer/admin có dashboard analytics.
2. **Video editor + mascot overlay**: user upload video → tạo project chỉnh sửa → overlay nhân vật mascot (image-to-talking-video qua model AI deploy riêng) → finalize và publish.
3. **Newsfeed short-video (highlight feed)**: video highlight được publish dạng feed (TikTok-like), có like/save/comment/view, recommendation theo session.
4. **AI quiz generation**: từ video transcript (SRT), gọi OpenAI để generate quiz tự động.

Kèm theo: thanh toán khóa học qua PayOS, cart, roadmap (lộ trình gồm nhiều course xếp thứ tự), forgot-password OTP, admin review course/feedback/report.

## Business domain

- **Domain chính**: Education Technology (EdTech) + UGC (User-Generated Content) video
- **Tích hợp ngoài**: Cloudinary (hình), Bunny Stream (video CDN + transcoding), PayOS (thanh toán VN), OpenAI (quiz gen), SMTP (Gmail) cho mail, model AI tự deploy ở `deploy-model/` (joyvasa wrapper)

## User roles

Định nghĩa ở `backend_services/api_gateway/src/middleware/access-policy.ts` (`enum UserRole`) và bảng `roles` trong DB:

| Role | ID (DB) | Quyền chính |
|------|---------|-------------|
| `ADMIN` | 1 | Review/publish course, ban content, review report, manage user, xem mọi analytics |
| `STUDENT` | 2 | Enroll course, làm quiz, cart, mua khóa học, comment/like feed, report |
| `LECTURER` | 3 | CRUD course/lesson/quiz/roadmap của mình, xem creator analytics, post highlight feed |

Role check ở 2 lớp: (1) Gateway dựa trên `access-policy.ts`, (2) một số controller tự check qua header `x-user-role` (vd `course_service/src/course/course.controller.ts`).

## Tech stack tóm tắt

### Backend
- **Node.js >= 18**, package manager: `yarn` (NestJS services) + `npm` (gateway, payment, mail)
- **NestJS 11** cho: `auth_service`, `user_service`, `course_service`, `media_service`, `mascot_video_service`, `inference_service`
- **Express + TypeScript** cho: `api_gateway`
- **Express + JS thuần** cho: `payment_service`, `mail_service`, `ai_service`
- **ORM**: `sequelize-typescript` v2.1 + `sequelize` v6 (NestJS services). `payment_service` dùng Sequelize JS-style.
- **Migrations**: `knex` v3 (riêng folder `database/`, không nằm trong service nào)
- **Auth**: JWT (HS256), refresh token trong HTTP-only cookie, access token trong Authorization header
- **Cache/Pub-Sub**: Redis 7 — `ioredis` (NestJS) / `redis` v4 (payment)
- **Real-time**: Socket.IO 4 (media_service WebSocket gateway), SSE (NestJS `@Sse` decorator) cho notification stream

### Frontend (chính: `frontend-nextjs/`)
- **Next.js 16** (App Router, React 19, Turbopack)
- **UI**: Radix UI + Tailwind v4 + shadcn-style components ở `components/ui/`
- **State / data**: TanStack Query v5 (server state), Zustand v5 (client state)
- **Forms**: `react-hook-form` + `zod` + `@hookform/resolvers`
- **Editor**: TipTap + CKEditor 5 cho rich text; `@dnd-kit` cho drag-drop (lesson order, quiz reorder)
- **Video upload**: `tus-js-client` (resumable) tới Bunny Stream
- **Realtime client**: `socket.io-client` v4
- **Animation**: `framer-motion`, `embla-carousel`

### Database
- **MySQL 8.0** (`docker-compose.yml`), charset `utf8mb4_unicode_ci`
- **Connection**: services connect trực tiếp qua Sequelize, không qua proxy chung. Mỗi service đọc env riêng nhưng trỏ cùng DB.
- **Redis 7-alpine** cho: refresh token cache (auth), OTP (mail), payment event pub/sub, feed recommendation cache

### Build / Deploy
- **Local**: `docker-compose up -d` (chỉ MySQL + Redis), sau đó chạy từng service bằng `yarn start:dev` / `npm run dev`
- **Production**: Render.com — config ở `render.yaml`, mỗi service một dịch vụ Render, Redis dùng managed Redis. Bunny Stream và Cloudinary là external.

## Phạm vi dự án

- Đây là đồ án tốt nghiệp (`Do_An_Tot_Nghiep`), chưa scale production thật
- Một số quirks/đặc thù:
  - 2 service `edit_session_service` và `mascot_video_service` xuất hiện trong `render.yaml` nhưng **đã bị xóa khỏi source** — bỏ qua khi sửa code
  - Folder `frontend/` (Vite) là **legacy**, không active — mọi feature mới làm trong `frontend-nextjs/`
  - `inference_service/` mới scaffold, chưa có business logic
  - `ai_service/` không phải HTTP service mà là **CLI script** chạy ad-hoc để generate quiz
