# 10 — Task Playbook (cho Claude)

> **File này là TIM của bộ docs.** Mỗi khi nhận task code, Claude đọc file này NGAY SAU `INDEX.md`.

## Checklist xử lý task chuẩn

```
┌────────────────────────────────────────────────────────────────┐
│  1. Đọc docs/INDEX.md                                          │
│  2. Đọc docs/10-task-playbook.md (file này)                    │
│  3. Phân loại task → xác định module liên quan (xem bảng dưới) │
│  4. Đọc docs/04-modules/<module>.md cho từng module liên quan  │
│  5. Đọc docs/06-api.md hoặc docs/05-data-model.md nếu cần      │
│  6. MỞ FILE CODE CỤ THỂ (đã liệt kê trong module doc)          │
│  7. Đọc + hiểu → mới sửa                                       │
│  8. Sau khi sửa: update doc tương ứng (xem bảng "Khi sửa gì    │
│     thì update doc nào")                                       │
└────────────────────────────────────────────────────────────────┘
```

**Tuyệt đối không** mò mẫm grep toàn bộ source. Mọi đường dẫn đã có trong docs.

## Bảng tra cứu: Task loại nào → đọc docs nào → đụng folder nào

### Auth / login / register / token / OTP
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/auth-service.md`, `docs/04-modules/api-gateway.md`, `docs/04-modules/mail-service.md` |
| Code chính | `backend_services/auth_service/src/auth/auth.controller.ts` + `auth.service.ts` |
| Access rule | `backend_services/api_gateway/src/middleware/access-policy.ts` |
| Update | `auth-service.md` nếu thêm endpoint; `06-api.md` |

### User profile / role / permission
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/user-service.md`, `docs/04-modules/api-gateway.md`, `docs/05-data-model.md` (table `users`) |
| Code | `backend_services/user_service/src/users/users.controller.ts` + `users.service.ts` |
| Model | `backend_services/user_service/src/users/user.model.ts` + sync sang `auth_service/src/users/user.model.ts` |
| Migration | `database/knex_migrations/0XX_users_*.js` mới |
| Update | `user-service.md`, `05-data-model.md`, `06-api.md` |

### Course / Lesson / Quiz / Roadmap / Cart / Enroll / Feedback / Report
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/course-service.md` |
| Code | `backend_services/course_service/src/<feature>/` (course/lessons/quizzes/roadmaps/carts/enrolls/feedbacks/reports) |
| Models | `backend_services/course_service/src/models/<name>.model.ts` |
| AI quiz gen | `backend_services/course_service/src/quizzes/helper/quiz.gen.ts` + `resolve-srt.ts` |
| Access rule | `backend_services/api_gateway/src/middleware/access-policy.ts` (search `/api/course/<feature>`) |
| Update | `course-service.md`, `05-data-model.md`, `06-api.md` |

### Video / Project (editor) / Mascot overlay / Bunny / Cloudinary
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/media-service.md` |
| Code | `backend_services/media_service/src/<feature>/` (videos/projects/mascot_overlays/images_mascot/bunny/cloudinary/webhook) |
| Models | `backend_services/media_service/src/models/` hoặc `<feature>/<name>.model.ts` |
| Access rule | `api_gateway/src/middleware/access-policy.ts` (search `/api/media/`) |
| Update | `media-service.md`, `05-data-model.md`, `06-api.md` |

### Newsfeed (short video, comments, interactions)
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/media-service.md` phần `feed/` |
| Code | `backend_services/media_service/src/feed/feed.controller.ts` + `feed.service.ts` + `feed-recommendation.worker.ts` |
| Models | `media_service/src/models/highlight_feed.model.ts`, `feed_comments.model.ts`, `feed_interactions.model.ts`, `feed_views.model.ts` |
| Access rule | Tìm `/api/media/feed` trong `access-policy.ts` |
| Frontend | `frontend-nextjs/features/newsfeed/` |
| Update | `media-service.md`, `06-api.md`, `frontend-nextjs.md` nếu UI |

### Notification / SSE / WebSocket
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/media-service.md` phần `notifications/`, `sse/`, `websocket/` |
| Code | `backend_services/media_service/src/notifications/`, `src/sse/sse.controller.ts`, `src/websocket/websocket.gateway.ts` |
| Gateway WS proxy | `backend_services/api_gateway/src/index.ts` (lines `wsProxy`, `mediaWebSocketProxy`) |
| Frontend | `frontend-nextjs/features/upload/api/upload.websocket.ts`, `app/(app)/components/SseTestClient.tsx` |
| Debug | `WEBSOCKET_DEBUG.md`, `media_service/src/websocket/README.md` |

### Payment / PayOS / Transaction
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/payment-service.md` + `backend_services/payment_service/REDIS_EVENTS.md` |
| Code | `backend_services/payment_service/src/controllers/payment.controller.js` + `services/payment.service.js` |
| Events | `payment_service/src/services/event.publisher.js`, consume bằng `utils/event.subscriber.js` |
| Webhook | `POST /api/payment/payos-callback` |
| Update | `payment-service.md`, `REDIS_EVENTS.md` nếu thêm event channel |

### Email / OTP send
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/mail-service.md` |
| Code | `backend_services/mail_service/src/controllers/mail.controller.js`, `services/mail.service.js`, `templates/mail.template.js` |

### Database / Migration / Schema change
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/database.md`, `docs/05-data-model.md` |
| Migration | Tạo `database/knex_migrations/0XX_<descriptive>.js` (XX = số tiếp theo, hiện max là 020) |
| Update Sequelize | Mọi service có model bảng đó (xem mapping ở `05-data-model.md` cuối file) |
| Test | `cd database && yarn migrate && yarn migrate:rollback` để verify up/down |
| Update | `database.md` (thêm row vào bảng migration), `05-data-model.md` (cập nhật bảng nếu schema đổi) |

### Frontend (UI / page / component / form / state)
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/frontend-nextjs.md` |
| Page mới | Tạo `frontend-nextjs/app/<group>/<route>/page.tsx` |
| Feature logic | `frontend-nextjs/features/<domain>/` với `index.tsx`, `types.ts`, `api/`, `components/` |
| Form | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Data fetch | TanStack Query — viết hook ở `features/<domain>/api/<domain>.hooks.ts` |
| Component shared | `frontend-nextjs/components/` |
| UI primitive | `frontend-nextjs/components/ui/` (shadcn) |
| Update | `frontend-nextjs.md` nếu thêm feature folder mới |

### API Gateway (route mới, access rule, rate limit)
| Bước | Hành động |
|------|-----------|
| Đọc | `docs/04-modules/api-gateway.md` |
| Add endpoint mới | Thêm rule vào `backend_services/api_gateway/src/middleware/access-policy.ts` |
| Add route file | `backend_services/api_gateway/src/routes/<service>.routes.ts` nếu service mới |
| Add service URL | `backend_services/api_gateway/src/config/index.ts` |
| Update | `api-gateway.md`, `06-api.md` |

## Quy tắc: Khi sửa gì thì update doc nào

| Code change | Doc phải update |
|-------------|----------------|
| Thêm/xóa endpoint | `06-api.md` + `04-modules/<service>.md` |
| Thêm bảng / cột DB | `05-data-model.md` + `04-modules/database.md` + `04-modules/<service>.md` |
| Thay đổi flow giữa service | `02-architecture.md` (sơ đồ data flow) |
| Thêm/xóa service | `INDEX.md` + `01-overview.md` + `02-architecture.md` + `03-folder-structure.md` + tạo file mới `04-modules/<service>.md` |
| Thêm folder feature trong service | `03-folder-structure.md` + `04-modules/<service>.md` |
| Thêm role hoặc enum giá trị mới | `09-glossary.md` |
| Thay đổi pattern coding | `07-conventions.md` |
| Thay đổi script setup / deploy | `08-workflows.md` |
| Thêm external integration | `01-overview.md` + `02-architecture.md` + `04-modules/<service>.md` |

## Anti-patterns cần tránh

- ❌ **Không grep toàn bộ source khi đã có doc**: tra `06-api.md` hoặc `04-modules/` trước
- ❌ **Không tạo endpoint mới mà quên thêm rule ở gateway**: sẽ trả 403 "Endpoint access is not configured"
- ❌ **Không sửa schema mà quên sync Sequelize model ở các service mirror**: tra bảng mapping cuối `05-data-model.md`
- ❌ **Không sửa `database/migrations/initial_schema.sql`**: chỉ tạo migration mới
- ❌ **Không trùng số migration**: dùng 021, 022, ... (hiện max 020)
- ❌ **Không touch `frontend/` (Vite legacy)**: feature mới làm ở `frontend-nextjs/`
- ❌ **Không touch `edit_session_service` hay `mascot_video_service`**: đã xóa, chỉ còn refer trong `render.yaml`
- ❌ **Không đoán mò**: chỗ nào không chắc → grep cụ thể hoặc hỏi user; chỗ chưa biết trong doc đã đánh `TODO: xác minh`

## Lookup nhanh "muốn sửa X thì mở file nào?"

| Muốn sửa... | Mở file |
|-------------|---------|
| Logic login | `backend_services/auth_service/src/auth/auth.service.ts` |
| Cookie refresh token | `backend_services/auth_service/src/auth/constants/cookie.constant.ts` |
| Role-based access | `backend_services/api_gateway/src/middleware/access-policy.ts` |
| JWT verify gateway | `backend_services/api_gateway/src/middleware/auth.middleware.ts` |
| OpenAI quiz prompt | `backend_services/course_service/src/quizzes/helper/quiz.gen.ts` |
| Parse SRT cho AI | `backend_services/course_service/src/quizzes/resolve-srt.ts` |
| Course publish flow | `backend_services/course_service/src/course/course.service.ts` |
| Bunny upload init | `backend_services/media_service/src/bunny/bunny.service.ts` |
| Bunny webhook handler | `backend_services/media_service/src/webhook/webhook.service.ts` |
| Feed recommendation | `backend_services/media_service/src/feed/feed.service.ts` + `feed-recommendation.worker.ts` |
| Comment reply (origin_cmt) | `backend_services/media_service/src/feed/feed.controller.ts` `createComment()` |
| Push notification logic | `backend_services/media_service/src/notifications/notification.service.ts` |
| SSE stream | `backend_services/media_service/src/sse/sse.service.ts` |
| Socket.IO gateway | `backend_services/media_service/src/websocket/websocket.gateway.ts` |
| PayOS payment link | `backend_services/payment_service/src/services/payment.service.js` `createPaymentLink()` |
| PayOS webhook | `backend_services/payment_service/src/controllers/payment.controller.js` `payosCallback()` |
| Send OTP email | `backend_services/mail_service/src/controllers/mail.controller.js` |
| DB migration | `database/knex_migrations/0XX_*.js` |
| Knex config | `database/knexfile.js` |
| Home page UI | `frontend-nextjs/app/(app)/page.tsx` |
| Login form | `frontend-nextjs/features/auth/components/SignInForm.tsx` |
| Course form (instructor) | `frontend-nextjs/features/instructor/course-management/CourseFormPage.tsx` |
| Lesson form | `frontend-nextjs/features/instructor/course-management/LessonFormPage.tsx` |
| Quiz editor | `frontend-nextjs/features/instructor/course-management/components/QuizEditor.tsx` |
| Newsfeed UI | `frontend-nextjs/features/newsfeed/components/NewsfeedPage.tsx` |
| Upload component | `frontend-nextjs/features/upload/components/UploadDropzone.tsx` |
| Auth provider client | `frontend-nextjs/components/providers/AuthProvider.tsx` |
| Header navigation | `frontend-nextjs/components/Header.tsx` |
| Admin course review | `frontend-nextjs/features/admin/components/courses/AdminCourseReviewModal.tsx` |
