# Media Service

## Mục đích
Trung tâm xử lý media + realtime + newsfeed:
- Video CRUD + Bunny Stream upload/transcoding integration
- Project editor (video chỉnh sửa với mascot overlay)
- Mascot images library + mascot overlays (vị trí, scale, thời gian) trên video
- Cloudinary signed upload (cho ảnh)
- Highlight feed (short-video TikTok-like) + interactions + comments + recommendations
- Notifications (in-app)
- Real-time: Socket.IO gateway + SSE controller
- Webhooks từ Bunny, Cloudinary, AI model

## File / Folder

### Bootstrap & infra

| Path | Mô tả |
|------|-------|
| `backend_services/media_service/src/main.ts` | NestJS bootstrap (kèm Socket.IO adapter) |
| `backend_services/media_service/src/app.module.ts` | Root — import 12 feature module + ScheduleModule |
| `backend_services/media_service/src/app.controller.ts` | `/` health |
| `backend_services/media_service/src/database/database.module.ts` | Sequelize bootstrap |
| `backend_services/media_service/src/config/{database,jwt,redis}.config.ts` | Env configs |
| `backend_services/media_service/src/redis/redis.module.ts` | ioredis module |
| `backend_services/media_service/src/redis/redis.service.ts` | Cache wrapper (feed recommendation) |

### Models

`src/models/`:

| File | Bảng | Mô tả |
|------|------|------|
| `models/notification.model.ts` | `notifications` | In-app notification (migration 019) |
| `models/highlight_feed.model.ts` | `highlight_feed` | Short video feed entries |
| `models/feed_comments.model.ts` | `feed_comments` | Comments + replies (có `origin_cmt`) |
| `models/feed_interactions.model.ts` | `feed_interactions` | Like/save/share — `enum FeedInteractionType` |
| `models/feed_views.model.ts` | `feed_views` | Track view + watch duration |
| `models/course.model.ts` | `courses` | Read-only mirror để JOIN |
| `models/user.model.ts` | `users` | Read-only mirror |

`src/videos/video.model.ts`, `src/projects/project.model.ts`, `src/mascot_overlays/mascot_overlay.model.ts`, `src/images_mascot/images.model.ts` — models thuộc feature đó.

### Feature modules

#### `videos/` — `@Controller('videos')`
| File | Mô tả |
|------|------|
| `videos/video.controller.ts` | CRUD video |
| `videos/video.service.ts` | Business |
| `videos/video.model.ts` | Bảng `videos` (type: `highlight | mascot | long`) |

Endpoints:
- `POST /videos` — create
- `GET /videos/user/:type` — list by user + type
- `GET /videos/:id`
- `PATCH /videos/:id`
- `DELETE /videos/:id`

#### `projects/` — `@Controller('projects')` — Editor session
| File | Mô tả |
|------|------|
| `projects/project.controller.ts` | CRUD project |
| `projects/project.service.ts` | |
| `projects/project.model.ts` | Bảng `projects` (= 1 edit session) — `status: draft | saved | finalized` |

Endpoints:
- `POST /projects`
- `GET /projects/user`
- `GET /projects/:id`, `PATCH /:id`, `DELETE /:id`

#### `mascot_overlays/` — `@Controller('mascot_overlays')`
Overlay nhân vật mascot lên video (vị trí x/y, scale, start_time/end_time, layer_index).
- `mascot_overlay.controller.ts`, `mascot_overlay.service.ts`, `mascot_overlay.model.ts`
- Liên kết: `edit_id` → `projects(edit_id)`, `image_id` → `mascot_images(image_id)`

#### `images_mascot/` — `@Controller('mascot_images')`
Library mascot images do user upload:
- `image_mascot.controller.ts`, `image_mascot.service.ts`, `images.model.ts`
- Endpoint: `POST /`, `GET /user`, `GET /:id` (public), `PATCH /:id`, `DELETE /:id`

#### `bunny/` — `@Controller('bunny')` — Bunny Stream
| Endpoint | Mô tả |
|----------|------|
| `POST /bunny/videos/init-upload` | Tạo placeholder video trên Bunny, trả TUS upload URL + auth signature |
| `GET /bunny/videos/:bunnyVideoId/status` | Poll status (encoding/ready/failed) |
| `GET /bunny/videos/:bunnyVideoId/play-data` | HLS URL, thumbnail, captions |

Frontend gọi `init-upload` → upload thẳng lên Bunny qua `tus-js-client` → khi xong, Bunny gọi webhook `/api/media/webhooks/bunny-stream` (xem `webhook/`).

#### `cloudinary/` — `@Controller('cloudinary')`
- `POST /cloudinary/sign` — Server-side sign upload params
- `POST /cloudinary/upload` — (proxy upload trực tiếp?)

#### `webhook/` — `@Controller('webhooks')`
Public endpoints (không auth — verify HMAC trong service):
- `POST /webhooks/cloudinary/upload` — callback Cloudinary
- `POST /webhooks/bunny-stream` — callback Bunny (verify HMAC)
- `POST /webhooks/ai-model/result` — callback từ `deploy-model/` (mascot video gen)

`webhook/webhook.service.ts` xử lý: update `videos.status`, `videos.bunny_video_guid`, `videos.url`, push notification + emit Socket.IO event.

#### `feed/` — `@Controller('feed')` — Newsfeed
File: `feed/feed.controller.ts` (16 endpoints — đây là module có nhiều endpoint nhất).

| Method | Path | Mô tả |
|--------|------|------|
| POST | `/feed` | Lecturer/admin highlight video lên feed |
| GET | `/feed` | Cursor-paginated feed (`mode=recommended|search`, sessionId for personalization) |
| GET | `/feed/viewed` | Feeds user đã xem |
| GET | `/feed/saved` | Feeds user đã save |
| GET | `/feed/trending` | Public trending |
| GET | `/feed/stats/creator` | Creator analytics (lecturer/admin) |
| GET | `/feed/stats/trending` | Trending analytics (admin) |
| GET | `/feed/:id/stats` | Stats cho 1 feed (owner/admin) |
| POST | `/feed/:id/interact` | Like/save/share — body `{ type: FeedInteractionType }` |
| POST | `/feed/:id/view` | Log view: `{ watch_duration, completed }` |
| PUT | `/feed/:id` | Update title/caption/hashtags/status |
| POST | `/feed/:id/comments` | Tạo comment (có thể là reply, set `origin_cmt`) |
| GET | `/feed/:id/comments` | List comments (cursor) |
| GET | `/feed/:id/comment/detail` | List replies của 1 comment (`origin_cmt` query) |
| PATCH | `/feed/:id/comments/:commentId` | Update comment content |
| DELETE | `/feed/:id/comments/:commentId` | Delete comment |

Helper:
- `feed/feed-recommendation.worker.ts` — 2 cron job (qua `@nestjs/schedule`) giữ ấm cache trong Redis. Mỗi cron tick có 1 cờ "in-flight" local + Redis lock trong service nên không bị overlap giữa nhiều replica.
  - `handlePrecompute()` — `EVERY_MINUTE` (1 phút/lần). Lấy danh sách user trong set `feed:rec:interacted-users`, gọi `feedService.precomputeRecommendedForActiveUsers({ concurrency: 8, maxBatch: 500 })`. Tái sử dụng `sessionId` hiện tại nếu còn hợp lệ thay vì tạo mới mỗi lần.
  - `handleTrendingRefresh()` — `EVERY_5_MINUTES`. Gọi `feedService.refreshTrendingCache()` để cập nhật key `feed:trending:1h`.

### Thuật toán Recommendation (`feed.service.ts → computeRankedCandidates`)

Pipeline 5 bước, chấm theo công thức linear:

```
score = W_GLOBAL * globalScore
      + W_PERSONAL * personalScore
      + W_FRESHNESS * freshness
      + 0.3 * viewBoost
      − repeatedViewPenalty
```

Các tham số tuning đặt trong constants ở đầu `FeedService` (dễ A/B test):

| Hằng | Mặc định | Vai trò |
|------|----------|---------|
| `FRESHNESS_HALF_LIFE_HOURS` | 36 | Half-life cho time-decay |
| `W_GLOBAL / W_PERSONAL / W_FRESHNESS` | 1.0 / 1.5 / 1.2 | Trọng số 3 nhóm tín hiệu |
| `REPEAT_VIEW_PENALTY` | 0.8 | Trừ điểm mỗi lần đã xem |
| `REPEAT_VIEW_PENALTY_CAP` | 3 | Giới hạn tối đa phạt lặp |
| `EXPLORATION_RATIO` | 0.15 | Tỉ lệ "epsilon-greedy" — chèn item fresh ngoài top |
| `MAX_SAME_COURSE_RUN` | 2 | Số item tối đa liên tiếp cùng course/lecturer |
| `GLOBAL_ENGAGEMENT_WINDOW_HOURS` | 168 (7 ngày) | Cửa sổ tính popularity |

Chi tiết từng signal:

1. **Global score** (popularity):
   - Wilson-smoothed engagement rate: `(positives + 1) / (views + 50)` với `positives = likes + saves*1.5 + shares*2 + comments*1.2`.
   - Completion rate `completedViews / views` (signal cực mạnh với short-video).
   - Popularity log-scaled: `log10(1 + views + likes*2 + saves*3 + shares*4)` — tránh viral item áp đảo mãi.
   - Tổng: `engagement*5 + completionRate*3 + popularity`.
   - **Window**: chỉ tính các interaction trong `GLOBAL_ENGAGEMENT_WINDOW_HOURS` qua bảng `feed_interactions / feed_views / feed_comments`.

2. **Personal score** (matching profile):
   - `courseAffinity[course_id]` và `hashtagAffinity[tag]` được build từ history (200 view gần nhất + update khi like/save).
   - Behavior weight khi view: `(completed ? 2 : 1) + min(watch_duration/30, 2)`. Like = 1.2, Save = 2.
   - Normalise về `[0..1]` theo max của user → user mới và user lâu năm có thang điểm so sánh được.
   - Tổng: `courseScore*0.7 + tagScore*0.3`.

3. **Freshness**: half-life decay `0.5 ^ (ageHours / 36)`.

4. **View boost** nhẹ: `log10(1+views) / log10(1+maxViews)` — boost item đã có chút traction.

5. **Repeat view penalty**: `min(viewCount * 0.8, 3)`.

Sau khi sort theo điểm:

- **`injectExploration`**: lấy ~50% top, sau đó cứ mỗi `1/EXPLORATION_RATIO ≈ 7` slot lại chèn 1 item từ nửa dưới (sorted theo `explorationScore = fresh*2 − personalScore`). Mục đích: phá filter-bubble.
- **`diversifyByCourse`**: greedy re-rank để không có hơn `MAX_SAME_COURSE_RUN` item liên tiếp cùng course.

### Trending — `computeTrendingFeedIds` (vẫn giữ công thức cũ, dùng cho trang Trending public)

```
score = likes*3 + saves*4 + shares*5 + comments*2 + views*0.5
```

Window: `TRENDING_WINDOW_MS = 1h`. Cache key `feed:trending:1h`, TTL 300s, được refresh bởi cron `handleTrendingRefresh` thay vì lazy như trước.

### Redis schema

| Key pattern | Type | TTL | Mô tả |
|-------------|------|-----|------|
| `feed:rec:session:<userId>` | string | 600s | sessionId hiện tại của user (pointer) |
| `feed:rec:list:<userId>:<sessionId>:<courseId|0>` | string (JSON array) | 600s | Danh sách feed_id đã rank cho session đó |
| `feed:rec:profile:<userId>` | string (JSON) | 24h | `{ courseAffinity, hashtagAffinity }` |
| `feed:rec:seen:<userId>` | sorted set | n/a (auto-trim) | feed_id đã xem trong 6h (score = timestamp) |
| `feed:rec:interacted-users` | set | n/a | User cần precompute lại (queue cron) |
| `feed:trending:1h` | string (JSON array) | 300s | Cached trending list |
| `feed:rec:precompute:lock` | string | 60s | Distributed lock cho cron precompute |
| `feed:trending:refresh:lock` | string | 30s | Distributed lock cho cron trending |

Khi user like/save/view, `invalidateRecommendCache` xóa cả `feed:rec:session:*` lẫn các key `feed:rec:list:<userId>:*` (SCAN-based) để lần tiếp theo user gọi `GET /feed?mode=recommended` sẽ rebuild — fix bug "đã like rồi mà feed không đổi".

Helper trong `RedisService` cho feed: `zReplace`, `zRevRange`, `scanKeys`, `delMany`, `acquireLock/releaseLock`, `incrementBy`.

#### `notifications/` — `@Controller('notifications')`
- `GET /notifications?cursor&limit&is_read` — list của user
- `GET /notifications/:id` — detail
- `PATCH /notifications/:id` — mark read
- `PUT /notifications/bulk` — `{ all?: boolean, ids?: number[], is_read: true }` mark multiple

Tạo notification: internal — vd khi có comment trên feed của user, khi video upload xong, etc. Tạo bằng `notification.service.ts` rồi push qua SSE/WebSocket.

#### `sse/` — `@Controller('sse')`
- `Sse('users/:userId/events')` — stream events cho user qua SSE
- Service: `sse/sse.service.ts` quản lý subject RxJS theo userId

#### `websocket/`
- `websocket.gateway.ts` — `@WebSocketGateway` (Socket.IO)
- Namespace / events: TODO: xác minh chi tiết
- Có file note `src/websocket/README.md` (debug log) và `WEBSOCKET_DEBUG.md` ở root

### DTOs

Gom ở `src/dto/`:
- `create-video.dto.ts`, `update-video.dto.ts`
- `create-project.dto.ts`, `update-project.dto.ts`
- `create-mascot-image.dto.ts`, `update-mascot-image.dto.ts`
- `create-mascot-overlay.dto.ts`, `update-mascot-overlay.dto.ts`

(Feed/notification/comments có DTO riêng trong feature folder.)

### Validators
- `src/validators/is-ater.validator.ts` — custom `class-validator` (TODO: xác minh tên + logic — có thể là typo của "is-after" cho compare 2 timestamps)

## Pattern chung
- Controller đọc header `x-user-id`, `x-user-role` (giống các service khác)
- `feed.controller.ts` có 2 helper `parseRequiredUserId`, `parseAnalyticsRole` — repeat code
- Mọi response trả raw object hoặc Sequelize model
- Webhook endpoints để PUBLIC ở gateway (`access-policy.ts` đã set `public`)

## Dependencies ngoài

| Service | Env | Use |
|---------|-----|-----|
| Bunny Stream | `BUNNY_API_KEY`, `BUNNY_LIBRARY_ID`, `BUNNY_STREAM_URL`, `BUNNY_WEBHOOK_SECRET` | Video upload, transcoding, HLS |
| Cloudinary | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image upload |
| Mascot AI model | `MASCOT_VIDEO_SERVICE_URL` / `MASCOT_COLAB_SERVICE_URL` | Gen talking-head video |
| Redis | `REDIS_*` | Feed recommendation cache, real-time pub/sub |

## Quirks

- 2 file `video.model.ts` (root `models/` và `videos/`) — model thực sự dùng là `videos/video.model.ts`. Cái ở `models/` có thể là dead code — **TODO: xác minh** (`models/` không thấy `video.model.ts` thực tế trong scan đầu)
- `ScheduleModule.forRoot()` được import ở `app.module.ts` line 30 — cho cron worker `feed-recommendation.worker.ts`
- `JwtModule.register({ global: true })` được comment trong `app.module.ts` — không enable
- Project status enum: `draft | saved | finalized`
- Video type enum: `highlight | mascot | long` — `highlight` = short video lên feed, `long` = lesson video, `mascot` = video editor sản phẩm

## Cách chạy local

```bash
cd backend_services/media_service
cp .env.example .env  # DB_*, REDIS_*, BUNNY_*, CLOUDINARY_*
yarn install
yarn start:dev        # port 8003 (default)
```
