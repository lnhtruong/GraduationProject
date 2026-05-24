# Documentation Index

> **Mục đích**: File này là entry point. Khi nhận task code, Claude **đọc file này TRƯỚC**, sau đó đọc `10-task-playbook.md` để chọn đường đi, rồi mới mở docs cụ thể.

## Cấu trúc dự án ngắn gọn

`GraduationProject` là nền tảng học trực tuyến (LMS) với kiến trúc microservices Node.js + 1 frontend Next.js, kèm các tính năng đặc thù: AI quiz generation, video editor + mascot overlay, newsfeed short-video, payment qua PayOS.

- **Frontend chính**: `frontend-nextjs/` (Next.js 16 + React 19 + Tailwind + Radix UI + TanStack Query + Zustand + Socket.IO client)
- **Frontend legacy**: `frontend/` (Vite + React 19) — không active, chỉ document tối thiểu
- **Backend**: `backend_services/` chứa 9 microservice (NestJS hoặc Express)
- **DB**: MySQL 8 + Redis 7, migrations bằng Knex ở `database/`
- **Deploy**: `docker-compose.yml` cho local, `render.yaml` cho prod (Render.com)

## Mục lục docs

| File | Mô tả |
|------|-------|
| [`01-overview.md`](./01-overview.md) | Mục đích dự án, business domain, user role, tech stack |
| [`02-architecture.md`](./02-architecture.md) | Sơ đồ kiến trúc, data flow, cách các service giao tiếp |
| [`03-folder-structure.md`](./03-folder-structure.md) | Cây thư mục với chú thích từng folder/file quan trọng |
| [`04-modules/`](./04-modules/) | Mỗi service/module một file riêng — xem `04-modules/README.md` |
| [`05-data-model.md`](./05-data-model.md) | Schema DB, ERD, mapping bảng ↔ Sequelize model ↔ service sở hữu |
| [`06-api.md`](./06-api.md) | Toàn bộ endpoint qua API Gateway, kèm method/access/handler |
| [`07-conventions.md`](./07-conventions.md) | Coding style, naming, pattern, cách viết test |
| [`08-workflows.md`](./08-workflows.md) | Setup local, build, test, deploy, debug |
| [`09-glossary.md`](./09-glossary.md) | Thuật ngữ domain + viết tắt dùng trong code |
| [`10-task-playbook.md`](./10-task-playbook.md) | **QUAN TRỌNG** — Hướng dẫn Claude xử lý task mới |

## Module index nhanh (04-modules/)

| File | Service / Module | Ngôn ngữ / Framework |
|------|------------------|----------------------|
| [`api-gateway.md`](./04-modules/api-gateway.md) | API Gateway (entry public) | Express + TypeScript |
| [`auth-service.md`](./04-modules/auth-service.md) | Auth, JWT, OTP, forgot password | NestJS + Sequelize + Redis |
| [`user-service.md`](./04-modules/user-service.md) | User profile, role | NestJS + Sequelize |
| [`course-service.md`](./04-modules/course-service.md) | Courses, lessons, quizzes, roadmaps, carts, enrolls, feedback, reports | NestJS + Sequelize |
| [`media-service.md`](./04-modules/media-service.md) | Videos, projects, mascot overlays, feed (shorts), notifications, SSE, websocket | NestJS + Sequelize + Socket.IO |
| [`payment-service.md`](./04-modules/payment-service.md) | PayOS integration, transactions, Redis events | Express + JS |
| [`mail-service.md`](./04-modules/mail-service.md) | Nodemailer, OTP send | Express + JS |
| [`ai-service.md`](./04-modules/ai-service.md) | OpenAI quiz generation (offline tool) | Node.js + OpenAI |
| [`inference-service.md`](./04-modules/inference-service.md) | Orchestrator forward request inference đến pool Colab (ngrok), round-robin + health check, lưu jobId→worker vào Redis | NestJS + ioredis |
| [`frontend-nextjs.md`](./04-modules/frontend-nextjs.md) | Web app chính | Next.js 16 + React 19 |
| [`database.md`](./04-modules/database.md) | Knex migrations, schema | Knex + MySQL |

## Quy tắc cập nhật docs

- Sửa code → **bắt buộc** update doc tương ứng (xem [`10-task-playbook.md`](./10-task-playbook.md) phần "Khi sửa code phải update doc nào")
- Khi thấy chỗ `TODO: xác minh` trong doc → mở code verify và update khi có dịp
- Mọi đường dẫn dùng relative path từ root repo (`backend_services/...`, `frontend-nextjs/...`)
