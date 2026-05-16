# 06 — API Reference

> **Single source-of-truth cho access**: `backend_services/api_gateway/src/middleware/access-policy.ts`. File này tổng hợp dạng bảng để tra cứu nhanh.

Tất cả endpoint **đều phải qua gateway** (port 3000 local). Prefix `/api/<service>/...`.

## Convention

- `Auth` column:
  - `public` — không cần token
  - `auth` — cần Bearer token (mọi role)
  - `[ADMIN]` / `[STUDENT]` / `[LECTURER]` — chỉ role đó
  - `[ADMIN|LECTURER]` — bất kỳ role nào trong list
- Header authentication: `Authorization: Bearer <accessToken>`
- Cookie: `refreshToken` (HttpOnly) auto gửi
- Gateway inject: `x-user-id`, `x-user-role`, `x-user-email` headers vào downstream

## `/api/auth/*` → `auth_service`

| Method | Path | Auth | Body | Handler |
|--------|------|------|------|---------|
| POST | `/api/auth/register` | public | `{email, password, firstName, lastName}` | `auth_service/src/auth/auth.controller.ts.register()` |
| POST | `/api/auth/login` | public | `{email, password}` | `…login()` |
| POST | `/api/auth/refresh` | public (cookie) | – | `…refreshToken()` |
| POST | `/api/auth/logout` | auth | – | `…logout()` |
| POST | `/api/auth/validate` | auth | `ValidateTokenDto` | `…validateCredential()` |
| POST | `/api/auth/issue-token` | `[ADMIN]` | `{userId, email, role}` | `…issueToken()` |
| POST | `/api/auth/forgot-password` | public | `{email}` | `…forgotPassword()` |
| POST | `/api/auth/check-otp` | public | `{email, otp, newPassword}` | `…checkOtp()` |

## `/api/users/*` → `user_service`

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/api/users/profile` | auth | `user_service/src/users/users.controller.ts.getProfile()` |
| GET | `/api/users/:id` | auth | `…getUserById()` |
| GET | `/api/users` | `[ADMIN]` | `…getAllUsers()` |
| PATCH | `/api/users/:id` | auth (self or admin) | `…updateUser()` |
| PATCH | `/api/users/reset/:id` | `[ADMIN]` | `…resetUser()` |

## `/api/course/*` → `course_service`

### Courses
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/courses` | `[LECTURER|ADMIN]` | `course/course.controller.ts.create()` |
| GET | `/api/course/courses` | `[ADMIN|STUDENT]` | `…findAll()` |
| GET | `/api/course/courses/mine` | auth | `…findAllMine()` |
| GET | `/api/course/courses/:id` | public | `…findOne()` |
| GET | `/api/course/courses/stats/overview` | `[ADMIN|LECTURER]` | `…getOverviewStats()` |
| GET | `/api/course/courses/:id/stats/overview` | `[ADMIN|LECTURER]` | `…getCourseStats()` |
| PATCH | `/api/course/courses/:id` | `[LECTURER|ADMIN]` | `…update()` |
| DELETE | `/api/course/courses/:id` | `[ADMIN]` | `…remove()` |
| POST | `/api/course/courses/:id/submit-for-review` | `[LECTURER]` | `…submitForReview()` |
| POST | `/api/course/courses/:id/review` | `[ADMIN]` | `…review()` |
| POST | `/api/course/courses/:id/publish` | `[ADMIN]` | `…publish()` |

### Lessons
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/lessons` | `[LECTURER|ADMIN]` | `lessons/lesson.controller.ts.create()` |
| GET | `/api/course/lessons/course` | public (`?course_id=...`) | `…findAllByCourseId()` |
| GET | `/api/course/lessons/:id` | public | `…findOne()` |
| PATCH | `/api/course/lessons/:id` | `[LECTURER|ADMIN]` | `…update()` |
| DELETE | `/api/course/lessons/:id` | `[LECTURER|ADMIN]` | `…remove()` |

### Lesson activities
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/api/course/lesson-activities` | auth | `lessonActivities/lesson.activities.controller.ts` |
| GET | `/api/course/lesson-activities/:id` | auth | … |
| GET | `/api/course/lesson-activities/user` | auth | … |
| POST | `/api/course/lesson-activities` | `[LECTURER|ADMIN]` | … |
| PATCH | `/api/course/lesson-activities/:id` | `[LECTURER|ADMIN]` | … |
| DELETE | `/api/course/lesson-activities/:id` | `[LECTURER|ADMIN]` | … |

### Quizzes
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/quizzes` | `[LECTURER|ADMIN]` | `quizzes/quizzes.controller.ts.create()` |
| POST | `/api/course/quizzes/ai` | `[LECTURER|ADMIN]` | `…createAI()` (AI generation) |
| GET | `/api/course/quizzes` | public (`?lessonActivityId`) | `…findAll()` |
| GET | `/api/course/quizzes/lesson/:lessonId` | auth (`?type=in_video|after_video`) | `…findAllByLessonId()` |
| GET | `/api/course/quizzes/:id` | auth | `…findOne()` |
| PATCH | `/api/course/quizzes/:id` | `[LECTURER|ADMIN]` | `…update()` |
| DELETE | `/api/course/quizzes/:id` | `[LECTURER|ADMIN]` | `…remove()` |

### Enrolls
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/enroll` | `[STUDENT|LECTURER|ADMIN]` | `enrolls/enrolls.controller.ts.create()` |
| GET | `/api/course/enroll` | auth | `…findAll()` |
| GET | `/api/course/enroll/check-mine-exists?courseId=...` | auth | `…checkMineExists()` |
| GET | `/api/course/enroll/:id` | auth | `…findOne()` |
| PATCH | `/api/course/enroll/:id` | `[LECTURER|ADMIN]` | `…update()` |
| DELETE | `/api/course/enroll/:id` | `[ADMIN]` | `…remove()` |

### Lesson progress
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/lesson-progress` | `[ADMIN|LECTURER]` | `lessonProgress/lesson-progress.controller.ts` |
| GET | `/api/course/lesson-progress` | auth | … |
| GET | `/api/course/lesson-progress/:id` | auth | … |
| PATCH | `/api/course/lesson-progress/:id` | `[ADMIN|LECTURER]` | … |
| DELETE | `/api/course/lesson-progress/:id` | `[ADMIN|LECTURER]` | … |

### Carts (chỉ STUDENT)
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/api/course/carts` | `[STUDENT]` | `carts/carts.controller.ts.getCart()` |
| POST | `/api/course/carts/items` | `[STUDENT]` | `…addItem()` body `{courseId}` |
| DELETE | `/api/course/carts/items/:courseId` | `[STUDENT]` | `…removeItem()` |
| DELETE | `/api/course/carts` | `[STUDENT]` | `…clearCart()` |

### Feedbacks
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/feedbacks` | `[STUDENT|LECTURER|ADMIN]` | `feedbacks/feedbacks.controller.ts.create()` |
| GET | `/api/course/feedbacks/check/:courseId` | public | `…hasUserReviewedCourse()` |
| GET | `/api/course/feedbacks/:courseId` | public | `…listByCourse()` |
| PATCH | `/api/course/feedbacks/:id` | `[ADMIN]` | `…updateByAdmin()` |
| DELETE | `/api/course/feedbacks/:id` | `[ADMIN]` | `…removeByAdmin()` |

### Feedback reactions
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/feedback-reactions` | `[STUDENT|LECTURER|ADMIN]` | `feedback-reactions/feedback-reactions.controller.ts` |
| DELETE | `/api/course/feedback-reactions/feedback/:id` | `[STUDENT|LECTURER|ADMIN]` | … |
| GET | `/api/course/feedback-reactions/**` | public | … |

### Roadmaps
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/roadmaps` | `[LECTURER|ADMIN]` | `roadmaps/roadmaps.controller.ts.create()` |
| GET | `/api/course/roadmaps` | public | `…findAll()` |
| GET | `/api/course/roadmaps/:id` | public | `…findOne()` |
| PATCH | `/api/course/roadmaps/:id` | `[LECTURER|ADMIN]` | `…update()` |
| DELETE | `/api/course/roadmaps/:id` | `[LECTURER|ADMIN]` | `…remove()` |
| POST | `/api/course/roadmaps/:id/courses` | `[LECTURER|ADMIN]` | `…addCourse()` |
| POST | `/api/course/roadmaps/:id/courses/bulk` | `[LECTURER|ADMIN]` | `…addCoursesBulk()` |
| PATCH | `/api/course/roadmaps/:id/courses/reorder` | `[LECTURER|ADMIN]` | `…reorderCourses()` |
| PATCH | `/api/course/roadmaps/:id/courses/:courseId` | `[LECTURER|ADMIN]` | `…updateCourse()` |
| DELETE | `/api/course/roadmaps/:id/courses/:courseId` | `[LECTURER|ADMIN]` | `…removeCourse()` |

### Reports
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/course/reports` | `[STUDENT|LECTURER|ADMIN]` | `reports/reports.controller.ts.create()` |
| GET | `/api/course/reports/mine` | auth | `…listMine()` |
| GET | `/api/course/reports` | `[ADMIN]` | `…listAll()` |
| GET | `/api/course/reports/:id` | `[ADMIN]` | `…getById()` |
| PATCH | `/api/course/reports/:id/review` | `[ADMIN]` | `…review()` |

## `/api/media/*` → `media_service`

### Videos
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/videos` | auth | `videos/video.controller.ts.create()` |
| GET | `/api/media/videos/user/:type` | auth | `…findAll()` |
| GET | `/api/media/videos/:id` | auth | `…findOne()` |
| PATCH | `/api/media/videos/:id` | auth | `…update()` |
| DELETE | `/api/media/videos/:id` | auth | `…remove()` |

### Projects (editor)
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/projects` | auth | `projects/project.controller.ts.create()` |
| GET | `/api/media/projects/user` | auth | `…findAllByUser()` |
| GET | `/api/media/projects/:id` | auth | `…findOne()` |
| PATCH | `/api/media/projects/:id` | auth | `…update()` |
| DELETE | `/api/media/projects/:id` | auth | `…remove()` |

### Mascot images
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/mascot_images` | auth | `images_mascot/image_mascot.controller.ts` |
| GET | `/api/media/mascot_images/user` | auth | … |
| GET | `/api/media/mascot_images/:id` | public | … |
| PATCH | `/api/media/mascot_images/:id` | auth | … |
| DELETE | `/api/media/mascot_images/:id` | auth | … |

### Mascot overlays
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| `*` | `/api/media/mascot_overlays/**` | auth | `mascot_overlays/mascot_overlay.controller.ts` |

### Bunny Stream
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/bunny/videos/init-upload` | auth | `bunny/bunny.controller.ts.initUpload()` |
| GET | `/api/media/bunny/videos/:bunnyVideoId/status` | auth | `…getStatus()` |
| GET | `/api/media/bunny/videos/:bunnyVideoId/play-data` | auth | `…getPlayData()` |

### Cloudinary
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/cloudinary/sign` | auth | `cloudinary/cloudinary.controller.ts` |
| POST | `/api/media/cloudinary/upload` | auth | … |

### Webhooks (public)
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/webhooks/cloudinary/upload` | public | `webhook/webhook.controller.ts` |
| POST | `/api/media/webhooks/bunny-stream` | public | … |
| POST | `/api/media/webhooks/ai-model/result` | public | … |

### Notifications
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/api/media/notifications` | auth | `notifications/notification.controller.ts.list()` |
| PUT | `/api/media/notifications/bulk` | auth | `…bulkUpdate()` |
| GET | `/api/media/notifications/:id` | auth | `…getOne()` |
| PATCH | `/api/media/notifications/:id` | auth | `…patchOne()` |

### SSE
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| GET | `/api/media/sse/users/:userId/events` | public | `sse/sse.controller.ts.streamByUser()` |

### Feed
| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/media/feed` | `[LECTURER|ADMIN]` | `feed/feed.controller.ts.addToFeed()` |
| GET | `/api/media/feed?cursor&limit&mode&search&sessionId` | auth | `…getFeed()` |
| GET | `/api/media/feed/viewed` | auth | `…getViewedFeeds()` |
| GET | `/api/media/feed/saved` | auth | `…getSavedFeeds()` |
| GET | `/api/media/feed/mine?page&pageSize&courseId&status&sortBy&order` | `[ADMIN\|LECTURER]` | `…getMyFeeds()` |
| GET | `/api/media/feed/trending` | public | `…getPublicTrending()` |
| GET | `/api/media/feed/stats/creator` | `[ADMIN|LECTURER]` | `…getCreatorStats()` |
| GET | `/api/media/feed/stats/trending` | `[ADMIN|LECTURER]` | `…getTrendingStats()` |
| GET | `/api/media/feed/:id/stats` | `[ADMIN|LECTURER]` | `…getFeedDetailStats()` |
| POST | `/api/media/feed/:id/interact` | auth | `…interact()` |
| POST | `/api/media/feed/:id/view` | auth | `…recordView()` |
| PUT | `/api/media/feed/:id` | `[LECTURER|ADMIN]` (catch-all rule) | `…updateFeed()` |
| POST | `/api/media/feed/:feedId/comments` | auth | `…createComment()` |
| GET | `/api/media/feed/:id/comments` | auth | `…getComments()` |
| GET | `/api/media/feed/:id/comment/detail?origin_cmt=` | auth | `…getCommentDetail()` |
| PATCH | `/api/media/feed/:id/comments/:commentId` | auth (catch-all role check) | `…updateComment()` |
| DELETE | `/api/media/feed/:id/comments/:commentId` | auth (catch-all role check) | `…deleteComment()` |

## `/api/payment/*` → `payment_service`

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/payment/create-payment` | auth | `payment.controller.js.createPaymentLink()` |
| POST | `/api/payment/buy-now` | auth | `…buyNow()` |
| GET | `/api/payment/transactions` | auth | `…getTransactionsByUser()` |
| GET | `/api/payment/transactions/:id` | auth | `…getTransactionById()` |
| GET | `/api/payment/order-status/:orderCode` | public | `…getOrderStatus()` |
| POST | `/api/payment/payos-callback` | public (HMAC) | `…payosCallback()` |
| GET | `/api/payment/return` | public | HTML success |
| GET | `/api/payment/cancel` | public | HTML cancel |

## `/api/mascot_colab/*` → mascot AI model service (deploy-model)

| Method | Path | Auth |
|--------|------|------|
| `*` | `/api/mascot_colab/**` | auth |

> Service đích là Python (FastAPI?) ở `deploy-model/`. Endpoint chi tiết xem `deploy-model/main.py`.

## WebSocket / Socket.IO

- Endpoint: `<gateway>/socket.io/...` → forward sang `media_service`
- Client connect: `io(NEXT_PUBLIC_API_URL, { auth: { token } })`
- Events: TODO: xác minh trong `media_service/src/websocket/websocket.gateway.ts`
- Handshake/polling/websocket transport đều support

## Health endpoints
- `GET /health` (gateway) — public
- `GET /` (mỗi service `app.controller.ts`) — chỉ truy cập được nội bộ
