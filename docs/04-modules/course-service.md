# Course Service

## Mục đích
Service trung tâm của LMS, quản lý toàn bộ "lớp học":
- Course (khóa học) + workflow review/publish
- Lesson (bài học, có thể là video/text/quiz)
- Lesson Activity (quiz/assignment gắn vào lesson)
- Quiz / Question / Option (manual + AI generation)
- Enroll (student vào course)
- Lesson Progress (tiến độ học)
- Cart + cart items (giỏ hàng — student)
- Feedback + Feedback Reaction (review course + like review)
- Roadmap (lộ trình gồm nhiều course có thứ tự)
- Report (báo cáo content cho admin)

Đây là service to nhất (97 file `.ts`).

## File / Folder

### Bootstrap & infra

| Path | Mô tả |
|------|-------|
| `backend_services/course_service/src/main.ts` | NestJS bootstrap |
| `backend_services/course_service/src/app.module.ts` | Root — import tất cả feature module (xem dưới) |
| `backend_services/course_service/src/app.controller.ts` | `/` health |
| `backend_services/course_service/src/database/database.module.ts` | SequelizeModule.forRootAsync |
| `backend_services/course_service/src/config/database.config.ts` | DB env |
| `backend_services/course_service/src/config/jwt.config.ts` | JWT env (chưa dùng — gateway verify rồi) |

### Models (gom trong `src/models/`)

| File | Bảng |
|------|------|
| `models/course.model.ts` | `courses` (có enum `CourseLevel`, `CourseStatus`) |
| `models/lesson.model.ts` | `lessons` |
| `models/lesson-activity.model.ts` | `lesson_activities` |
| `models/lesson-progress.model.ts` | `lesson_progress` |
| `models/quiz.model.ts` | `quizzes` |
| `models/quiz-question.model.ts` | `quiz_questions` |
| `models/quiz-option.model.ts` | `quiz_options` |
| `models/enroll.model.ts` | `enrolls` |
| `models/feedback.model.ts` | `course_feedback` (xem `008_course_feedback_tables.js`) |
| `models/feedback-reaction.model.ts` | `course_feedback_reactions` |
| `models/cart.model.ts` | `carts` |
| `models/cart-item.model.ts` | `cart_items` |
| `models/roadmap.model.ts` | `roadmaps` |
| `models/roadmap-course.model.ts` | `roadmap_courses` (M:N table có order) |
| `models/report.model.ts` | `reports` (có enum `ReportStatus`, `ReportTargetType`) |
| `models/video.model.ts` | `videos` — **read-only mirror**, source-of-truth ở `media_service` |
| `models/images.model.ts` | (TODO: xác minh dùng làm gì) |
| `models/pagination.dto.ts` | DTO chung `{ page, limit }` |

### Feature modules

Cấu trúc nhất quán: mỗi feature có `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/*.dto.ts`.

#### `course/`
| File | Mô tả |
|------|------|
| `course/course.module.ts` | Import models Course, Video |
| `course/course.controller.ts` | `@Controller('courses')` — 11 endpoints |
| `course/course.service.ts` | Business: CRUD + lifecycle (`submit-for-review`, `review`, `publish`) + stats |
| `course/dto/create-course.dto.ts` | `{ name, description?, categories, level, duration?, language, price, video_id? }` |
| `course/dto/update-course.dto.ts` | PartialType |

Endpoints (`/courses` local, `/api/course/courses` qua gateway):
- `POST /` — create (LECTURER/ADMIN); inject `user_id` từ header
- `GET /` — public list (filter status, paginate) — `findAllPublic`
- `GET /mine` — list của user hiện tại (LECTURER xem courses của mình)
- `GET /:id` — detail
- `GET /stats/overview` — total stats cho lecturer/admin
- `GET /:id/stats/overview` — stats cho 1 course (ownership check trong service)
- `PATCH /:id` — update
- `DELETE /:id` — admin only
- `POST /:id/submit-for-review` — Lecturer chuyển status DRAFT → PENDING
- `POST /:id/review` — Admin set ACCEPTED/REJECTED
- `POST /:id/publish` — Admin set PUBLISH

Workflow status: `draft → pending → approved/rejected → publish | banned`

#### `lessons/`
| File | Mô tả |
|------|------|
| `lessons/lesson.controller.ts` | `@Controller('lessons')` — 5 endpoints |
| `lessons/lesson.service.ts` | Tạo lesson, tìm theo `course_id`, paginate |
| `lessons/dto/create-lesson.dto.ts` | `{ course_id, title, contentType, content?, duration?, description?, video_id? }` |
| `lessons/dto/update-lesson.dto.ts` | PartialType |
| `lessons/dto/get-lessons-query.dto.ts` | `{ course_id, page?, limit? }` |

Endpoints (`/lessons`):
- `POST /` — create
- `GET /course` — list by `course_id` (query) — **note: không phải `/course/:id`**
- `GET /:id` — detail
- `PATCH /:id` — update
- `DELETE /:id` — remove

#### `lessonActivities/`
- `@Controller('lesson-activities')` — quiz/assignment activities gắn vào lesson
- Endpoint: CRUD + `GET /user` (authenticated)
- Status enum: `draft / public / archived / removed`

#### `quizzes/`
| File | Mô tả |
|------|------|
| `quizzes/quizzes.controller.ts` | `@Controller('quizzes')` |
| `quizzes/quizzes.service.ts` | `createOne`, `createMany`, `createOneByAI`, `createManyByAI`, CRUD |
| `quizzes/quiz-payload.mapper.ts` | Map giữa nested DTO (quiz+question+option) và rows |
| `quizzes/resolve-srt.ts` | Fetch URL SRT từ `video.srt_raw_url`, parse thành text chunks cho AI |
| `quizzes/helper/quiz.gen.ts` | Gọi OpenAI Chat Completion để gen quiz từ transcript |
| `quizzes/helper/index.quiz_gen.ts` | Re-export |
| `quizzes/dto/create-quiz.dto.ts` | `{ lessonActivityId, name, shuffle_question?, shuffle_option?, passing_score?, time_limit_minutes?, is_in_video, questions: [...] }` |
| `quizzes/dto/create-quiz-ai.dto.ts` | DTO cho AI gen (số question, level...) |
| `quizzes/dto/update-quiz.dto.ts` | Partial |

Endpoints (`/quizzes`):
- `POST /` — body có thể là 1 object hoặc array (createMany)
- `POST /ai` — gọi AI, body 1 object hoặc array
- `GET /?lessonActivityId=...` — list filter
- `GET /lesson/:lessonId?type=in_video|after_video` — lookup theo lesson, lọc theo loại quiz
- `GET /:id`, `PATCH /:id`, `DELETE /:id`

Quiz có 2 loại logic:
- **in-video quiz**: `is_in_video=true`, có `video_timestamp` ở mỗi question (xem migration `007_quiz_video_columns.js`, `011_modify_quiz-question_video-timestamp.js`)
- **after-video quiz**: làm sau khi xem xong lesson

#### `enrolls/`
- `@Controller('enroll')` (số ít, **không phải** `enrolls`)
- `POST /`, `GET /`, `GET /check-mine-exists?courseId=...`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- Logic enroll thường được trigger từ payment webhook (qua Redis event) hoặc trực tiếp khi free course

#### `lessonProgress/`
- `@Controller('lesson-progress')`
- Track student progress: completed lessons, video watch %, quiz score
- Field `video_completed_status` thêm sau (migration 014)

#### `feedbacks/`
- `@Controller('feedbacks')`
- `POST /`, `GET /check/:courseId`, `GET /:courseId`, `PATCH /:id` (admin), `DELETE /:id` (admin)
- Constant `ADMIN_ROLE = 1` hardcoded trong `feedbacks.controller.ts`

#### `feedback-reactions/`
- `@Controller('feedback-reactions')`
- Like/dislike feedback. Endpoint `POST /`, `DELETE /feedback/:id`

#### `carts/`
- `@Controller('carts')`
- `GET /` — cart của user hiện tại (theo `x-user-id`)
- `POST /items { courseId }` — add
- `DELETE /items/:courseId` — remove
- `DELETE /` — clear all
- Chỉ STUDENT (rule ở gateway)

#### `roadmaps/`
- `@Controller('roadmaps')`
- CRUD roadmap + manage courses bên trong:
  - `POST /:id/courses` — add 1 course
  - `POST /:id/courses/bulk` — add nhiều
  - `PATCH /:id/courses/reorder` — đổi thứ tự
  - `PATCH /:id/courses/:courseId` — update entry (vd note, required)
  - `DELETE /:id/courses/:courseId`
- `roadmap_courses` table có `order_index`

#### `reports/`
- `@Controller('reports')`
- Báo cáo course/feedback/feed cho admin xử lý
- Endpoints: `POST /`, `GET /mine`, `GET /` (admin), `GET /:id` (admin), `PATCH /:id/review` (admin)
- Enum `ReportTargetType`, `ReportStatus` ở `models/report.model.ts`
- Migration tạo: `020_reports_and_ban_columns.js` (cũng thêm column `banned` cho course/feedback)

#### `users/`
- Mirror users table (read-only) để JOIN trong query
- `users.module.ts`, `users.controller.ts`, `users.service.ts`, `user.model.ts`
- Có thể đã được sử dụng bởi feedback/course để hiển thị tên author — nhưng cũng có thể chỉ là dead code (gateway đã reverse-proxy `user_service`)
- **TODO: xác minh** xem thực sự có endpoint nào trong course_service `/users` được expose qua gateway hay không

## Pattern chung

1. **Controller đọc header `x-user-id`, `x-user-role`** — không tự verify JWT
2. Convert sang `number` rồi pass xuống service
3. Service dùng Sequelize, return raw model hoặc plain object
4. DTO validate bằng `class-validator` (chưa thấy global pipe — **TODO: xác minh** main.ts có `ValidationPipe` chưa)
5. Error throw `BadRequestException`, `UnauthorizedException`, `ForbiddenException` — NestJS tự format response

## Quirks

- Path style không nhất quán: `/courses` (plural), `/lessons` (plural), `/quizzes` (plural), nhưng `/enroll` (singular), `/lesson-progress`, `/lesson-activities` (kebab)
- `courses.controller.ts` tự define `parseRequiredUserId`, `parseRequiredRole` — repeat code (mỗi controller copy lại)
- `ADMIN_ROLE = 1` hardcode ở `feedbacks.controller.ts` và `reports.controller.ts` — nên rút thành enum
- `quizzes.controller.ts` chấp nhận body vừa là object vừa là array — duy nhất pattern này trong codebase

## Dependencies

- Gọi OpenAI (qua `quizzes/helper/quiz.gen.ts`, env `OPENAI_API_KEY`)
- Fetch SRT từ URL (`resolve-srt.ts`) — URL nằm trong `videos.srt_raw_url`, do `media_service` upload
- Không gọi service nội bộ qua HTTP

## Cách chạy local

```bash
cd backend_services/course_service
cp .env.example .env  # DB_*, JWT_SECRET, OPENAI_API_KEY
yarn install
yarn start:dev        # port 8008 (default)
```
