# Database & Migrations

## Mục đích
- Tập trung schema MySQL + migration ở 1 nơi (`database/`)
- Backend services connect chung DB nhưng **không** chứa migration của riêng mình
- Dùng Knex CLI để chạy migration; mỗi bảng mới = 1 file `0XX_*.js`

## File / Folder

| Path | Mô tả |
|------|------|
| `database/package.json` | Knex CLI scripts |
| `database/knexfile.js` | Config 2 env: `development` (local), `railway` (prod) |
| `database/README.md` | Hướng dẫn |
| `database/.env.example` | Template env |
| `database/knex_migrations/` | **Nguồn migration chính** — tên `0XX_descriptive.js` |
| `database/migrations/initial_schema.sql` | Schema gộp (baseline), được chạy bởi migration `001_initial_schema.js` nếu DB trống |
| `database/migrations/transaction_tables.sql` | SQL reference (legacy) |
| `database/helpers/_legacy_sql.js` | Helper chạy multi-statement SQL |
| `database/db_dump.sql` | Snapshot DB (manual export) |
| `database/db_dump.dbml` | DBML schema diagram source (mở bằng dbdiagram.io) |

## Knex env config

`database/knexfile.js`:

```js
development: {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'graduation_user',
    password: process.env.DB_PASSWORD || 'graduation_password',
    database: process.env.DB_NAME || 'graduation_db',
    multipleStatements: true,  // cần thiết cho initial_schema.sql
  },
  migrations: { directory: './knex_migrations', tableName: 'knex_migrations' },
}
railway: { ...same, default host 'gondola.proxy.rlwy.net' ... }
```

## Lệnh thường dùng

```bash
cd database
yarn install
yarn migrate              # = knex migrate:latest --env development
yarn migrate:railway      # prod
yarn migrate:rollback     # rollback batch cuối
yarn migrate:status       # current version
yarn migrate:list         # liệt kê đã chạy + pending
```

## Quy trình thêm bảng / column mới

1. Trong `database/knex_migrations/`, tạo file `0XX_<descriptive>.js` (XX = số tiếp theo)
2. Implement `exports.up = (knex) => { ... }` và `exports.down = (knex) => { ... }`
3. Test local: `yarn migrate` (rollback test bằng `yarn migrate:rollback`)
4. **Update Sequelize model** ở service tương ứng (vd `course_service/src/models/<name>.model.ts`)
5. Nếu nhiều service cùng đọc bảng → cập nhật model ở mọi service đó (vd `course_service/src/models/course.model.ts` + `media_service/src/models/course.model.ts` + `payment_service/src/models/course.model.js`)
6. Update `docs/05-data-model.md`
7. Update `docs/03-folder-structure.md` (chỉ khi tên migration đáng chú ý)

## Quirks

- **File trùng số `012_*` và `019_*`**: `012_feed_comments_table.js` + `012_modify_lessons_duration_time3.js`; `019_users_add_avatar_url.js` + `019_notifications_table.js`. Knex chạy theo alphabet → OK nhưng đừng add file 012/019 nữa.
- `initial_schema.sql` chỉ chạy 1 lần ban đầu — **đừng sửa**. Nếu cần thay đổi schema gốc → tạo migration mới.
- `multipleStatements: true` để chạy được file SQL có nhiều `CREATE TABLE` cách bởi `;`.
- Charset toàn DB: `utf8mb4_unicode_ci`.
- Migration tracking: bảng `knex_migrations` trong DB.

## Danh sách migration hiện tại

| # | File | Action |
|---|------|--------|
| 001 | `001_initial_schema.js` | Chạy `initial_schema.sql` nếu DB trống (tạo `users`, `roles`, `videos`, `projects`, `mascot_images`, `mascot_overlays`, `lessons`, `lesson_activities`, `quizzes`, `quiz_questions`, `quiz_options`) |
| 002 | `002_videos_job_id_unique.js` | Add unique index `videos.job_id` |
| 003 | `003_courses_table.js` | Create `courses` |
| 004 | `004_transaction_tables.js` | Create `transactions`, `transaction_items` |
| 005 | `005_roadmaps_tables.js` | Create `roadmaps`, `roadmap_courses` |
| 006 | `006_enrolls_and_lesson_progress.js` | Create `enrolls`, `lesson_progress` |
| 007 | `007_quiz_video_columns.js` | Add `is_in_video` to `quizzes`, video link tới quiz |
| 008 | `008_course_feedback_tables.js` | Create `course_feedback`, `course_feedback_reactions` |
| 009 | `009_highlight_feed_tables.js` | Create `highlight_feed`, `feed_views`, `feed_interactions` |
| 010 | `010_cart_and_cart_item.js` | Create `carts`, `cart_items` |
| 011 | `011_modify_quiz-question_video-timestamp.js` | Add `video_timestamp` cho `quiz_questions` |
| 012a | `012_feed_comments_table.js` | Create `feed_comments` |
| 012b | `012_modify_lessons_duration_time3.js` | Change `lessons.duration` to `TIME(3)` |
| 013 | `013_videos_long_bunny_guid.js` | Add `bunny_video_guid` cho videos type=long |
| 014 | `014_lesson_progress_add_video_completed_status.js` | Add `video_completed_status` cho `lesson_progress` |
| 015 | `015_feed_comments_add_origin_cmt.js` | Add `origin_cmt` cho reply comment |
| 016 | `016_courses_description_to_text.js` | Change `courses.description` VARCHAR → TEXT |
| 017 | `017_courses_add_video_id.js` | Add `courses.video_id` (intro video) |
| 018 | `018_highlight_feed_add_caption.js` | Add `caption` cho `highlight_feed` |
| 019a | `019_notifications_table.js` | Create `notifications` |
| 019b | `019_users_add_avatar_url.js` | Add `users.avatar_url` |
| 020 | `020_reports_and_ban_columns.js` | Create `reports`, add `banned` columns |
