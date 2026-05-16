# 03 — Folder Structure

> Đường dẫn relative từ root repo `GraduationProject/`. Folder nào không liệt kê = không có gì đặc biệt hoặc auto-gen (node_modules, dist, .next, coverage…).

## Root level

```
GraduationProject/
├── docs/                       # ← Documentation (file này)
├── README.md                   # 1 dòng "GraduationProject" (chưa dùng)
├── README_SETUP.md             # Setup guide local cho 3 service đầu — outdated
├── WEBSOCKET_DEBUG.md          # Note debug websocket (rời rạc)
├── docker-compose.yml          # MySQL + Redis cho local dev
├── render.yaml                 # Render.com deploy config (đa service)
├── database/                   # Knex migrations + schema dump
├── backend_services/           # 9 microservices Node.js
├── frontend-nextjs/            # Frontend chính (Next.js 16)
├── frontend/                   # Frontend legacy (Vite + React) — không active
└── deploy-model/               # Script deploy AI model (joyvasa) ngoài
```

## `database/`

```
database/
├── package.json               # Knex CLI scripts (yarn migrate / migrate:status)
├── knexfile.js                # Config 2 env: development (local MySQL) + railway (prod)
├── README.md                  # Hướng dẫn migration
├── .env.example               # Template DB_HOST/PORT/USER/PASSWORD/NAME
├── knex_migrations/           # ← NGUỒN MIGRATION CHÍNH (chạy theo thứ tự số)
│   ├── 001_initial_schema.js  # Chạy file SQL gộp (initial_schema.sql) nếu DB trống
│   ├── 002_videos_job_id_unique.js
│   ├── 003_courses_table.js
│   ├── 004_transaction_tables.js
│   ├── 005_roadmaps_tables.js
│   ├── 006_enrolls_and_lesson_progress.js
│   ├── 007_quiz_video_columns.js
│   ├── 008_course_feedback_tables.js
│   ├── 009_highlight_feed_tables.js
│   ├── 010_cart_and_cart_item.js
│   ├── 011_modify_quiz-question_video-timestamp.js
│   ├── 012_feed_comments_table.js
│   ├── 012_modify_lessons_duration_time3.js     # ⚠ trùng số 012
│   ├── 013_videos_long_bunny_guid.js
│   ├── 014_lesson_progress_add_video_completed_status.js
│   ├── 015_feed_comments_add_origin_cmt.js
│   ├── 016_courses_description_to_text.js
│   ├── 017_courses_add_video_id.js
│   ├── 018_highlight_feed_add_caption.js
│   ├── 019_notifications_table.js               # ⚠ trùng số 019
│   ├── 019_users_add_avatar_url.js
│   └── 020_reports_and_ban_columns.js
├── migrations/                # SQL legacy (reference)
│   ├── initial_schema.sql     # Gộp toàn bộ baseline (001-008 cũ)
│   └── transaction_tables.sql
├── helpers/
│   └── _legacy_sql.js         # Helper chạy multiple-statement SQL
├── db_dump.sql                # Full snapshot DB (manual dump)
└── db_dump.dbml               # DBML schema diagram source
```

**Quirks**:
- File `012_*` và `019_*` bị trùng số — Knex chạy theo alphabetical so kiểm theo tên đầy đủ. Không sửa số cũ nữa.
- Khi thêm bảng/column mới → tạo file `0XX_descriptive_name.js` trong `knex_migrations/`, **không** sửa `initial_schema.sql`.

## `backend_services/`

```
backend_services/
├── api_gateway/               # Express + TS — entry public
│   ├── src/
│   │   ├── index.ts           # Bootstrap, mount routes
│   │   ├── config/index.ts    # Env + service URLs
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts          # JWT verify, decode payload → req.user
│   │   │   ├── authorization.middleware.ts # Check rule từ access-policy
│   │   │   ├── access-policy.ts            # ← BẢNG RULE LỚN (700 dòng) tất cả endpoint
│   │   │   ├── rate-limit.middleware.ts    # 2 limiter: auth-mutating + media-mutating
│   │   │   └── logging.middleware.ts
│   │   └── routes/                          # Mỗi prefix một file proxy
│   │       ├── auth.routes.ts
│   │       ├── user.routes.ts
│   │       ├── course.routes.ts
│   │       ├── media.routes.ts
│   │       ├── payment.routes.ts
│   │       ├── feed.routes.ts
│   │       └── mascot_colab_routes.ts
│   ├── package.json           # express, http-proxy-middleware, jwt
│   └── tsconfig.json
│
├── auth_service/              # NestJS — auth + JWT + OTP
│   ├── src/
│   │   ├── main.ts            # Bootstrap NestJS
│   │   ├── app.module.ts      # Root module
│   │   ├── app.controller.ts  # /health
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts          # 8 endpoint: register/login/refresh/logout/validate/issue-token/forgot-password/check-otp
│   │   │   ├── auth.service.ts             # Business logic
│   │   │   ├── auth.service.spec.ts
│   │   │   ├── auth.controller.spec.ts
│   │   │   ├── constants/cookie.constant.ts # COOKIE_CONFIG (refresh token cookie)
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   ├── validate-token.dto.ts
│   │   │   │   ├── forgot-password.dto.ts
│   │   │   │   └── check-otp.dto.ts
│   │   │   ├── jwt/                        # Custom JWT module + guard
│   │   │   │   ├── jwt.module.ts
│   │   │   │   ├── jwt.service.ts
│   │   │   │   └── jwt.guard.ts
│   │   │   └── logger/logger.middleware.ts
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── redis.config.ts
│   │   ├── database/database.module.ts     # SequelizeModule.forRootAsync
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts             # ioredis wrapper (cache refresh, OTP)
│   │   └── users/
│   │       ├── users.module.ts
│   │       └── user.model.ts                # Sequelize model (mirror users table)
│   ├── package.json
│   └── nest-cli.json
│
├── user_service/              # NestJS — quản lý profile, role
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/{database,jwt}.config.ts
│   │   ├── database/database.module.ts
│   │   └── users/
│   │       ├── users.module.ts
│   │       ├── users.controller.ts          # /profile, /:id, /, PATCH /:id, PATCH /reset/:id
│   │       ├── users.service.ts
│   │       ├── user.model.ts
│   │       ├── dto/update-user.dto.ts
│   │       └── guards/jwt-auth.guard.ts     # (chưa enable — comment trong controller)
│
├── course_service/            # NestJS — module lớn nhất
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/{database,jwt}.config.ts
│   │   ├── database/database.module.ts
│   │   ├── models/                          # ← TẤT CẢ Sequelize model gom ở đây
│   │   │   ├── course.model.ts
│   │   │   ├── lesson.model.ts
│   │   │   ├── lesson-activity.model.ts
│   │   │   ├── lesson-progress.model.ts
│   │   │   ├── quiz.model.ts
│   │   │   ├── quiz-question.model.ts
│   │   │   ├── quiz-option.model.ts
│   │   │   ├── enroll.model.ts
│   │   │   ├── feedback.model.ts
│   │   │   ├── feedback-reaction.model.ts
│   │   │   ├── cart.model.ts
│   │   │   ├── cart-item.model.ts
│   │   │   ├── roadmap.model.ts
│   │   │   ├── roadmap-course.model.ts
│   │   │   ├── report.model.ts
│   │   │   ├── video.model.ts                # Read-only ở service này (videos thuộc media_service)
│   │   │   ├── images.model.ts
│   │   │   └── pagination.dto.ts             # DTO common
│   │   ├── users/                           # Read-only user (mirror cho query join)
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── user.model.ts
│   │   │   └── guards/jwt-auth.guard.ts
│   │   ├── course/                          # Feature: courses
│   │   │   ├── course.module.ts
│   │   │   ├── course.controller.ts          # CRUD + submit-for-review + review + publish + stats
│   │   │   ├── course.service.ts
│   │   │   └── dto/{create-course,update-course}.dto.ts
│   │   ├── lessons/
│   │   │   ├── lesson.module.ts
│   │   │   ├── lesson.controller.ts
│   │   │   ├── lesson.service.ts
│   │   │   └── dto/{create,update,get-lessons-query}.dto.ts
│   │   ├── lessonActivities/                # Activity = quiz/assignment gắn lesson
│   │   ├── lessonProgress/                  # Theo dõi student progress qua lesson
│   │   ├── quizzes/
│   │   │   ├── quizzes.module.ts
│   │   │   ├── quizzes.controller.ts         # Bao gồm POST /ai cho quiz AI
│   │   │   ├── quizzes.service.ts
│   │   │   ├── quiz-payload.mapper.ts        # Transform DTO ↔ models
│   │   │   ├── resolve-srt.ts                # Fetch + parse SRT từ video.srt_raw_url
│   │   │   ├── helper/
│   │   │   │   ├── quiz.gen.ts               # Gọi OpenAI để gen quiz
│   │   │   │   └── index.quiz_gen.ts
│   │   │   └── dto/{create-quiz,update-quiz,create-quiz-ai}.dto.ts
│   │   ├── enrolls/                         # Enroll student vào course
│   │   ├── feedbacks/                       # Review/rating course
│   │   ├── feedback-reactions/              # Like feedback
│   │   ├── carts/                           # Shopping cart (1 user 1 cart)
│   │   ├── roadmaps/                        # Lộ trình gồm nhiều course
│   │   └── reports/                         # Báo cáo course/feedback/feed cho admin
│   ├── test/jest-e2e.json
│   └── package.json
│
├── media_service/             # NestJS — video, mascot, feed, realtime
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── config/{database,jwt,redis}.config.ts
│   │   ├── database/database.module.ts
│   │   ├── redis/
│   │   │   ├── redis.module.ts
│   │   │   └── redis.service.ts              # Cache feed recommendation
│   │   ├── models/                          # Mirror các bảng (course, user, etc.)
│   │   │   ├── notification.model.ts
│   │   │   ├── highlight_feed.model.ts
│   │   │   ├── feed_comments.model.ts
│   │   │   ├── feed_interactions.model.ts
│   │   │   ├── feed_views.model.ts
│   │   │   ├── course.model.ts
│   │   │   └── user.model.ts
│   │   ├── dto/                             # DTO chung cho video/project/mascot
│   │   │   ├── create-video.dto.ts
│   │   │   ├── update-video.dto.ts
│   │   │   ├── create-project.dto.ts
│   │   │   ├── update-project.dto.ts
│   │   │   ├── create-mascot-image.dto.ts
│   │   │   ├── update-mascot-image.dto.ts
│   │   │   ├── create-mascot-overlay.dto.ts
│   │   │   └── update-mascot-overlay.dto.ts
│   │   ├── videos/                          # CRUD videos
│   │   │   ├── video.module.ts
│   │   │   ├── video.controller.ts
│   │   │   ├── video.service.ts
│   │   │   └── video.model.ts                # ⚠ trùng tên với models/ — model thực sự ở đây
│   │   ├── projects/                        # Editor project (mascot overlay)
│   │   │   ├── project.module.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   └── project.model.ts
│   │   ├── mascot_overlays/                 # Overlay nhân vật trên video (position/scale/time)
│   │   ├── images_mascot/                   # Mascot image library
│   │   ├── bunny/                           # Bunny Stream integration (init-upload, status, play-data)
│   │   │   ├── bunny.module.ts
│   │   │   ├── bunny.controller.ts
│   │   │   └── bunny.service.ts
│   │   ├── cloudinary/                      # Upload signed Cloudinary
│   │   ├── webhook/                         # Webhook nhận từ Cloudinary, Bunny, AI model
│   │   │   ├── webhook.module.ts
│   │   │   ├── webhook.controller.ts
│   │   │   └── webhook.service.ts
│   │   ├── feed/                            # Newsfeed short-video
│   │   │   ├── feed.module.ts
│   │   │   ├── feed.controller.ts
│   │   │   ├── feed.service.ts
│   │   │   └── feed-recommendation.worker.ts  # Cron job tính recommendation
│   │   ├── notifications/                   # Push notification (in-app)
│   │   ├── sse/                             # Server-Sent Events cho notifications
│   │   ├── websocket/                       # Socket.IO gateway (video processing progress)
│   │   │   ├── websocket.module.ts
│   │   │   ├── websocket.service.ts
│   │   │   └── websocket.gateway.ts
│   │   └── validators/is-ater.validator.ts   # Custom class-validator
│   └── package.json
│
├── payment_service/           # Express + JS — PayOS
│   ├── src/
│   │   ├── app.js                            # Express bootstrap
│   │   ├── server.js                         # Listen + Redis init
│   │   ├── configs/{db,redis}.config.js
│   │   ├── models/
│   │   │   ├── index.js                      # Sequelize associations
│   │   │   ├── transaction.model.js
│   │   │   ├── transaction_item.model.js
│   │   │   └── course.model.js               # Read-only mirror
│   │   ├── controllers/payment.controller.js  # createPaymentLink, buyNow, getTransactions, payosCallback
│   │   ├── routes/payment.route.js
│   │   ├── services/
│   │   │   ├── payment.service.js
│   │   │   └── event.publisher.js            # Publish Redis events
│   │   ├── utils/event.subscriber.js         # Generic subscriber (dùng từ service khác)
│   │   ├── middlewares/error.middleware.js
│   │   └── views/{payment_success,payment_cancel}.html
│   ├── package.json
│   └── REDIS_EVENTS.md                       # ← Tài liệu pub/sub
│
├── mail_service/              # Express + JS — Nodemailer
│   ├── src/
│   │   ├── app.js, server.js
│   │   ├── configs/{mail,redis}.config.js
│   │   ├── controllers/mail.controller.js    # sendOTP, sendForgotPassword, sendCustom
│   │   ├── routes/mail.route.js
│   │   ├── services/mail.service.js          # Wrap nodemailer transporter
│   │   ├── templates/mail.template.js
│   │   ├── utils/otp.util.js                 # generateOTP() — 6 digit
│   │   └── middlewares/{validate,error}.middleware.js
│
├── ai_service/                # JS CLI — KHÔNG phải HTTP service
│   ├── index.js                              # Entry chạy bằng node
│   ├── quiz.js                               # Logic gen quiz qua OpenAI
│   ├── package.json                          # Chỉ openai + dotenv
│   └── output/                               # Sample output (quiz_1.json, output_2.json…)
│
└── inference_service/         # NestJS scaffold — chưa có business logic
    ├── src/
    │   ├── main.ts, app.module.ts, app.controller.ts, app.service.ts
    │   └── config/database.config.ts
    └── package.json
```

## `frontend-nextjs/`

```
frontend-nextjs/
├── package.json                # Next 16, React 19, TanStack Query, Zustand, Radix, Tailwind, TipTap, CKEditor, tus-js-client, socket.io-client
├── tsconfig.json
├── next.config.ts
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (QueryProvider, AuthProvider, theme)
│   ├── globals.css
│   ├── (app)/                  # Route group: app chính (nav bar)
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Home
│   │   ├── courses/page.tsx, [id]/page.tsx, [id]/learn/page.tsx
│   │   ├── library/page.tsx    # Khóa học đã mua
│   │   ├── profile/page.tsx
│   │   ├── upload/page.tsx
│   │   ├── workspace/page.tsx
│   │   ├── unauthorized/page.tsx
│   │   └── components/SseTestClient.tsx
│   ├── (auth)/                 # Auth pages (no nav)
│   │   ├── layout.tsx
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (instructor)/instructor/  # Dashboard lecturer
│   │   ├── layout.tsx, page.tsx, dashboard/page.tsx
│   │   ├── courses/                # CRUD course
│   │   │   ├── page.tsx, new/page.tsx
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx, edit/page.tsx
│   │   │       ├── lessons/page.tsx, new/page.tsx, [lessonId]/edit/page.tsx
│   │   │       └── feed/page.tsx, new/page.tsx, [feedId]/edit/page.tsx
│   │   ├── roadmaps/page.tsx, new/page.tsx, [roadmapId]/page.tsx
│   │   ├── analytics/page.tsx, shorts/page.tsx, qa/page.tsx
│   ├── (admin)/admin/          # Dashboard admin
│   │   ├── layout.tsx
│   │   └── courses/page.tsx    # Review pending courses
│   ├── cart/page.tsx
│   ├── editor/page.tsx         # Video editor (mascot overlay)
│   └── newsfeed/page.tsx
├── features/                   # ← Source code chính tổ chức theo feature
│   ├── auth/components/SignInForm.tsx
│   ├── upload/                 # Upload video + xử lý
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── hooks/useUpload.tsx
│   │   ├── components/{UploadDropzone,ProcessingStatus}.tsx
│   │   └── api/upload.websocket.ts
│   ├── video/
│   │   ├── types.ts, api/video.api.ts
│   │   └── upload/{useLessonVideoUpload.ts, lesson-video-upload.manager.ts}
│   ├── newsfeed/               # Short-video feed UI
│   │   ├── index.tsx, types.ts
│   │   ├── api/{newsfeed.api,newsfeed.hooks}.ts
│   │   ├── hooks/useNewsfeedVideoFeed.ts
│   │   └── components/Newsfeed*.tsx
│   ├── courses/
│   │   ├── detail/{index.tsx, components/ReviewsSection, WriteReviewForm}.tsx
│   │   └── learn/components/LessonVideoCard.tsx
│   ├── cart/components/Cart*.tsx
│   ├── editor/components/EditorMediaDropzone.tsx
│   ├── home/component/CourseCard.tsx
│   ├── instructor/
│   │   ├── components/{courses,dashboard,analytics}/...
│   │   ├── course-management/    # CRUD course/lesson/feed cho lecturer
│   │   │   ├── CourseOverviewPage.tsx, CourseFormPage.tsx, LessonFormPage.tsx
│   │   │   ├── CourseFeedManagementPage.tsx, CourseFeedCreate/Edit
│   │   │   └── components/{LessonForm,QuizEditor,ActivityCreationDialog,...}
│   │   └── roadmap-management/
│   ├── admin/components/courses/AdminCourses*.tsx
│   ├── roadmap/api/{roadmap.api,roadmap.hooks}.ts
│   └── lessons/{types.ts, api/lesson.api.ts}
├── components/                 # Shared components
│   ├── Header.tsx
│   ├── ProtectedRoute.tsx
│   ├── ScrollToTopButton.tsx
│   ├── RichTextBoxCKE.tsx, RichTextBoxTiptap.tsx
│   ├── providers/{AuthProvider,QueryProvider}.tsx
│   └── ui/                     # shadcn-style (Radix wrapper)
├── lib/                        # (nếu tồn tại) utility helpers
└── public/                     # static assets
```

## `frontend/` (legacy)

Cấu trúc Vite + React Router + Tailwind. Không document chi tiết. Chỉ giữ làm reference. Khi cần feature → dùng `frontend-nextjs/`.

## `deploy-model/`

```
deploy-model/
├── readme.md
├── main.py                     # API entry (FastAPI?)
├── joyvasa_wrapper.py          # Wrap JoyVASA model (image-to-talking-video)
├── setup.sh, setup_full.sh, setup_api_only.sh, setup_joyvasa_fast.sh
```

Service AI deploy riêng (Python), tương tác từ `media_service` qua HTTP (`MASCOT_VIDEO_SERVICE_URL` env). Không phải Node service.
