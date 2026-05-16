# 05 — Data Model

> Source-of-truth schema: `database/migrations/initial_schema.sql` + `database/knex_migrations/*.js`. Sequelize models trong từng service phản chiếu lại schema này — phải đồng bộ thủ công.

## ERD tổng quát (text)

```
                       ┌────────┐
                       │ roles  │  (ADMIN=1, STUDENT=2, LECTURER=3)
                       └───┬────┘
                           │ 1:N
                           ▼
   ┌─────────┐  1:N   ┌─────────┐  1:N   ┌──────────────┐
   │  users  ├───────►│ videos  ├────────│ projects     │ (1 user → N project)
   │         │        │         │        │ (edit session│
   └────┬────┘        └────┬────┘        │  với mascot) │
        │                  │             └──┬───────────┘
        │ 1:N              │ 1:N            │
        │                  │                ▼ 1:N
        │                  │           ┌──────────────────┐
        │                  │           │ mascot_overlays  │
        │                  │           │ (overlay trên    │
        │                  │           │  edit session)   │
        │                  │           └──┬───────────────┘
        │                  │              │ N:1
        │                  ▼              ▼
        │           ┌──────────┐    ┌──────────────┐
        │           │ lessons  │    │ mascot_images│
        │           │ (video|  │    └──┬───────────┘
        │           │  text|   │       │ N:1
        │           │  quiz)   │       │
        │           └────┬─────┘       └→ users
        │                │
        │                │ 1:N
        │                ▼
        │         ┌─────────────────┐
        │         │ lesson_activities│
        │         │ (quiz/assign)   │
        │         └────┬────────────┘
        │              │ 1:1
        │              ▼
        │         ┌──────────┐   1:N    ┌──────────────┐  1:N   ┌────────────┐
        │         │ quizzes  ├─────────►│quiz_questions├───────►│quiz_options│
        │         └──────────┘          └──────────────┘        └────────────┘
        │
        │ 1:N
        ▼
   ┌──────────┐
   │ courses  │  (status: draft/pending/approved/rejected/publish/banned)
   │          │
   │ video_id │ FK → videos (intro video)
   └────┬─────┘
        │
        ├──── 1:N ────► lessons (course_id)
        ├──── 1:N ────► enrolls (course_id, user_id) M:N với users
        ├──── 1:N ────► course_feedback (user_id, rating, comment)
        ├──── 1:N ────► cart_items (course_id, cart_id)
        └──── M:N ────► roadmaps (qua roadmap_courses, order_index)

   ┌──────────────┐ 1:N   ┌──────────────────────────┐
   │course_feedback├─────►│course_feedback_reactions │ (like/dislike)
   └──────────────┘       └──────────────────────────┘

   ┌──────────┐ 1:N   ┌──────────────┐
   │  carts   ├──────►│  cart_items  │
   │ (1 user  │       │ (1 course/   │
   │  1 cart) │       │  cart)       │
   └──────────┘       └──────────────┘

   ┌──────────────┐ 1:N   ┌────────────────────┐
   │ transactions ├──────►│ transaction_items  │
   │  (PayOS)     │       │ (price snapshot)   │
   └──────────────┘       └────────────────────┘

   ┌──────────────────┐
   │ highlight_feed   │  (short video, 1 video_id, course_id)
   │                  │
   │ - title          │
   │ - caption        │
   │ - hashtags       │
   │ - status         │
   └────┬─────────────┘
        ├── 1:N ──► feed_comments (origin_cmt for reply)
        ├── 1:N ──► feed_interactions (like/save/share)
        └── 1:N ──► feed_views (watch_duration, completed)

   ┌──────────────────┐
   │  notifications   │  (user_id, type, data, is_read)
   └──────────────────┘

   ┌──────────────────┐
   │     reports      │  (target_type: course | feedback | feed_comment, target_id, reporter_id, status)
   └──────────────────┘

   ┌──────────────────┐
   │ lesson_progress  │  (user_id, lesson_id, video_completed_status, …)
   └──────────────────┘
```

## Bảng chi tiết

### `roles`
- Cột: `id` PK, `name` (`ADMIN`/`STUDENT`/`LECTURER`), `createdAt`, `updatedAt`
- Seed: 3 row cố định trong `initial_schema.sql` lines 18-22
- Model: chỉ `auth_service` join trực tiếp (ít dùng)

### `users` (`backend_services/auth_service/src/users/user.model.ts`, `user_service/src/users/user.model.ts`)
- `id` PK, `email` UNIQUE, `password` (bcrypt), `firstName`, `lastName`, `role` FK → roles
- `avatar_url` (migration 019)
- Service đọc/ghi: `auth_service` (register/login), `user_service` (profile)
- Service mirror (read): `course_service/src/users/user.model.ts`, `media_service/src/models/user.model.ts`

### `videos` (`media_service/src/videos/video.model.ts`)
- `id` PK, `user_id` FK, `mascot_image_id` FK, `type` ENUM(`highlight`,`mascot`,`long`)
- `name`, `url` TEXT, `duration` DOUBLE, `thumbnail`, `srt_raw_url` TEXT
- `bunny_video_guid` UNIQUE (Bunny ID)
- `job_id` UNIQUE (AI model job ID)
- Indexes: `(user_id, type)`, partial `(user_id WHERE type='highlight')`, etc.
- Service mirror: `course_service/src/models/video.model.ts` (read-only)

### `projects` (`media_service/src/projects/project.model.ts`)
- `edit_id` PK, `user_id`, `video_id` FK
- `session_name`, `status` ENUM(`draft`,`saved`,`finalized`)
- FK CASCADE từ users; SET NULL từ videos

### `mascot_images` (`media_service/src/images_mascot/images.model.ts`)
- `image_id` PK, `user_id`, `url`
- Library ảnh nhân vật user đã upload

### `mascot_overlays` (`media_service/src/mascot_overlays/mascot_overlay.model.ts`)
- `mascot_overlay_id` PK, `edit_id` FK → projects, `image_id` FK → mascot_images
- `position_x`, `position_y`, `scale`, `start_time`, `end_time`, `layer_index`
- Mô tả 1 overlay trong project editor

### `courses` (`course_service/src/models/course.model.ts`)
- `id` PK, `name`, `description` TEXT, `categories` JSON, `level` ENUM(`Beginner`,`Intermediate`,`Advanced`)
- `duration` TIME(3), `language`, `price` DOUBLE, `user_id` (creator)
- `video_id` FK → videos (intro)
- `status` ENUM(`draft`,`pending`,`approved`,`rejected`,`publish`,`banned`)
- `banned` (migration 020)

### `lessons`
- `id` PK, `course_id` FK, `title`, `contentType` ENUM(`video`,`text`,`quiz`)
- `content` JSON, `duration` TIME(3), `status` ENUM(`active`,`removed`,`blocked`)
- `description`, `video_id` FK → videos

### `lesson_activities`
- `id` PK, `lesson_id` FK, `activity_type` ENUM(`quiz`,`assignment`)
- `title`, `description`, `order_index`, `max_attempts`
- `status` ENUM(`draft`,`public`,`archived`,`removed`), `created_by`

### `quizzes`
- `id` PK, `lesson_activity_id` FK (CASCADE)
- `name`, `shuffle_question`, `shuffle_option`, `passing_score`, `time_limit_minutes`
- `is_in_video` BOOLEAN — quiz pop trong video hay sau video

### `quiz_questions`
- `id` PK, `quiz_id` FK (CASCADE)
- `ques_type` ENUM(`short_text`,`mcq`,`true/false`)
- `ques_text`, `point` DECIMAL, `correct_ans`, `order_index`
- `video_timestamp` TIME(3) — chỉ dùng khi `quiz.is_in_video=true`

### `quiz_options`
- `id` PK, `question_id` FK (CASCADE)
- `option_text`, `is_correct`, `order_index`

### `enrolls`
- `id` PK, `user_id`, `course_id`
- Tracking student enrolled vào course (sau payment hoặc free)

### `lesson_progress`
- `user_id`, `lesson_id`, `video_completed_status`, `completed_at`, `score`
- 1 user 1 lesson 1 row

### `roadmaps`
- `id` PK, `name`, `description`, `user_id` (creator)

### `roadmap_courses` (M:N table)
- `roadmap_id`, `course_id`, `order_index`, `is_required`?

### `course_feedback`
- `id` PK, `user_id`, `course_id`, `rating` (1-5), `comment`, `created_at`
- 1 user 1 feedback / 1 course

### `course_feedback_reactions`
- `feedback_id`, `user_id`, `reaction_type`

### `carts`
- `id` PK, `user_id` UNIQUE (1 cart / user)

### `cart_items`
- `cart_id` FK, `course_id` FK, `added_at`

### `transactions` (`payment_service/src/models/transaction.model.js`)
- `id` PK, `user_id`, `order_code` UNIQUE (PayOS), `amount`, `status` (`pending`/`paid`/`cancelled`/`failed`)
- `payment_link`, `created_at`

### `transaction_items` (`payment_service/src/models/transaction_item.model.js`)
- `transaction_id` FK, `course_id`, `price` (snapshot)

### `highlight_feed` (`media_service/src/models/highlight_feed.model.ts`)
- `id` PK, `user_id`, `video_id`, `course_id`
- `title`, `caption`, `hashtags` JSON, `status`

### `feed_comments` (`media_service/src/models/feed_comments.model.ts`)
- `id` PK, `feed_id`, `user_id`, `content`
- `origin_cmt` (nullable) — id của comment cha (cho reply)

### `feed_interactions` (`media_service/src/models/feed_interactions.model.ts`)
- `feed_id`, `user_id`, `type` ENUM (xem `FeedInteractionType`)

### `feed_views` (`media_service/src/models/feed_views.model.ts`)
- `feed_id`, `user_id`, `watch_duration`, `completed`

### `notifications` (`media_service/src/models/notification.model.ts`)
- `id` PK, `user_id`, `type`, `data` JSON, `is_read` BOOLEAN, `created_at`

### `reports` (`course_service/src/models/report.model.ts`)
- `id` PK, `reporter_id`, `target_type` (`course`/`feedback`/`feed`/`feed_comment`), `target_id`
- `reason`, `status` (`pending`/`accepted`/`rejected`), `reviewed_by`, `reviewed_at`

## Mapping bảng ↔ Service sở hữu

| Bảng | Service sở hữu (write) | Service mirror (read) |
|------|------------------------|----------------------|
| `users`, `roles` | auth_service, user_service | course_service, media_service |
| `videos`, `projects`, `mascot_images`, `mascot_overlays` | media_service | course_service (videos), payment_service (none) |
| `courses`, `lessons`, `lesson_activities`, `quizzes`, `quiz_questions`, `quiz_options`, `enrolls`, `lesson_progress`, `roadmaps`, `roadmap_courses`, `course_feedback`, `course_feedback_reactions`, `carts`, `cart_items`, `reports` | course_service | payment_service (courses), media_service (courses) |
| `transactions`, `transaction_items` | payment_service | – |
| `highlight_feed`, `feed_comments`, `feed_interactions`, `feed_views`, `notifications` | media_service | – |

## Quy tắc khi thêm/sửa bảng

1. Tạo migration mới ở `database/knex_migrations/0XX_*.js`
2. Update DBML diagram `database/db_dump.dbml` (optional)
3. Update Sequelize model **ở mọi service** có động đến bảng đó
4. Update `docs/05-data-model.md` (file này)
5. Nếu bảng chứa FK liên service → check business logic của service liên quan
