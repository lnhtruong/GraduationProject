# 09 — Glossary

## Domain terms

| Term | Vietnamese | Mô tả |
|------|------------|------|
| **Course** | Khóa học | Đơn vị học chính, do lecturer tạo. Status flow: draft → pending → approved/rejected → publish |
| **Lesson** | Bài học | Đơn vị trong course. Type: video / text / quiz |
| **Lesson Activity** | Hoạt động bài học | Quiz hoặc assignment gắn vào lesson (1 lesson có nhiều activity) |
| **Quiz** | Bài quiz | Bộ câu hỏi gắn vào lesson_activity. 2 kiểu: in-video (pop-up trong khi xem) và after-video |
| **In-video quiz** | Quiz trong video | Quiz xuất hiện tại 1 thời điểm trong video (`quizzes.is_in_video=true`, `quiz_questions.video_timestamp`) |
| **Enroll** | Đăng ký học | Liên kết 1 student với 1 course (sau khi mua hoặc free) |
| **Lesson Progress** | Tiến độ học | Tracking 1 user đã hoàn thành lesson nào, video % bao nhiêu, điểm quiz |
| **Roadmap** | Lộ trình | 1 chuỗi nhiều course có thứ tự (M:N với courses qua `roadmap_courses`) |
| **Cart** | Giỏ hàng | 1 user 1 cart, chứa nhiều `cart_items` (course chưa mua) |
| **Feedback** | Đánh giá khóa học | Rating + comment của student cho course đã enroll |
| **Feedback Reaction** | Phản ứng đánh giá | Like/dislike một feedback |
| **Report** | Báo cáo | User report content (course / feedback / feed / comment) cho admin xử lý |
| **Highlight feed / Feed** | Newsfeed short video | Short video TikTok-like (`highlight_feed` table). Lecturer/admin highlight 1 video lên feed |
| **Project (editor)** | Phiên chỉnh sửa | 1 edit session video có thể có nhiều mascot overlay (`projects` table, key = `edit_id`) |
| **Mascot** | Nhân vật | Hình ảnh nhân vật user upload để overlay lên video |
| **Mascot Overlay** | Lớp nhân vật | Vị trí + thời gian + scale của 1 mascot image lên 1 project |
| **Mascot Video** | Video nhân vật | Video gen từ ảnh + lời thoại (qua model JoyVASA ở `deploy-model/`) |
| **SRT** | Subtitle file | File phụ đề video; dùng làm input cho AI gen quiz |
| **Bunny GUID** | Bunny video ID | UUID Bunny Stream gán cho mỗi video sau upload |

## User roles

| Role | ID | Tiếng Việt | Quyền chính |
|------|-----|-----------|------------|
| ADMIN | 1 | Quản trị | Review course, ban content, xem mọi analytics, manage user |
| STUDENT | 2 | Học viên | Enroll, mua course, làm quiz, comment/like feed, report |
| LECTURER | 3 | Giảng viên | CRUD course/lesson/quiz/roadmap của mình, xem creator analytics, post feed |

## Status enums

### Course status (`courses.status`)
- `draft` — Lecturer đang soạn
- `pending` — Đã submit cho admin review
- `approved` — Admin chấp nhận
- `rejected` — Admin từ chối
- `publish` — Đã publish (student xem được)
- `banned` — Đã bị ban (sau khi report được xác nhận)

### Project status (`projects.status`)
- `draft` / `saved` / `finalized`

### Lesson status (`lessons.status`)
- `active` / `removed` / `blocked`

### Lesson Activity status
- `draft` / `public` / `archived` / `removed`

### Transaction status (`transactions.status`)
- `pending` / `paid` / `cancelled` / `failed`

### Report status (`reports.status`)
- `pending` / `accepted` / `rejected`

### Report target type (`reports.target_type`)
- `course` / `feedback` / `feed` / `feed_comment` — TODO: xác minh đầy đủ enum

### Video type (`videos.type`)
- `highlight` — Short video lên feed
- `mascot` — Video gen từ mascot editor
- `long` — Video bài giảng (lesson)

### Quiz question type (`quiz_questions.ques_type`)
- `short_text` / `mcq` / `true/false`

### Feed interaction type (`FeedInteractionType` enum trong `media_service/src/models/feed_interactions.model.ts`)
- `like` / `save` / `share` (TODO: xác minh exact values)

## Tech acronyms

| Term | Mô tả |
|------|------|
| **JWT** | JSON Web Token — access (15m) + refresh (7d) |
| **HMAC** | Hash-based Message Authentication Code — dùng verify webhook (PayOS, Bunny) |
| **SSE** | Server-Sent Events — one-way streaming HTTP cho notifications |
| **TUS** | Resumable upload protocol — dùng cho Bunny Stream |
| **HLS** | HTTP Live Streaming — Bunny serve video qua HLS |
| **CDN** | Content Delivery Network — Cloudinary (image), Bunny (video) |
| **ORM** | Sequelize (mapping JS object ↔ SQL table) |
| **DTO** | Data Transfer Object — class validate request body (`class-validator`) |
| **SPA** | Single Page Application — Next.js app |
| **App Router** | Next.js 13+ routing style (file-based, supports layouts/groups) |
| **Route Group** | Next.js folder bọc `()` không ảnh hưởng URL nhưng share layout (vd `(app)/`, `(auth)/`) |

## External services / providers

| Service | Mô tả |
|---------|------|
| **PayOS** | Cổng thanh toán Việt Nam (QR code, banking) |
| **Bunny Stream** | Video CDN + transcoding (alternative Cloudflare Stream / Mux) |
| **Cloudinary** | Image CDN + transformation |
| **OpenAI** | LLM cho quiz generation (gpt-4 / gpt-3.5) |
| **Render.com** | PaaS deploy (alternative Heroku) |
| **Railway** | Managed MySQL prod |
| **JoyVASA** | Model AI tạo talking-head video từ ảnh + audio (deploy ở `deploy-model/`) |

## Database terms

| Term | Mô tả |
|------|------|
| **Knex migration** | File `.js` ở `database/knex_migrations/` với `up`/`down` để alter schema |
| **`knex_migrations` table** | Bảng tracking migration nào đã chạy |
| **Sequelize model mirror** | Khi nhiều service đọc cùng bảng → mỗi service có 1 model riêng phản chiếu schema |
| **`x-user-id` / `x-user-role` / `x-user-email`** | Custom headers gateway inject cho downstream service đọc identity |

## Codebase-specific keywords

| Keyword | Mô tả |
|---------|------|
| **`graduation_db`** | Tên database MySQL (`docker-compose.yml`) |
| **`graduation_user` / `graduation_password`** | DB credentials local |
| **`fivetoneu2026`** | JWT secret hardcoded trong `render.yaml` — **bảo mật yếu, đổi cho prod** |
| **`access-policy.ts`** | File định nghĩa toàn bộ access rule cho gateway |
| **`x-user-id` header** | Identity injected — controller mọi service đọc từ đây thay vì verify JWT lại |
| **`COOKIE_CONFIG`** | Constants cookie refresh token trong `auth_service/src/auth/constants/cookie.constant.ts` |
| **`event.publisher.js` / `event.subscriber.js`** | Redis pub/sub helper trong payment_service |
| **`origin_cmt`** | Cột trong `feed_comments` chỉ comment cha (cho reply nested) |
| **`bunny_video_guid`** | Bunny Stream video ID, UNIQUE trong `videos` |
| **`job_id`** | AI model job ID, UNIQUE trong `videos` |
| **`edit_id`** | PK của `projects` (= edit session) |
| **`session_name`** | Tên project editor (`projects.session_name`) |
| **`is_in_video`** | Boolean trong `quizzes` — quiz pop-up trong khi xem video hay sau |
| **`shorts`** | Synonym với "feed" / "highlight feed" trong UI lecturer (`instructor/shorts/page.tsx`) |
