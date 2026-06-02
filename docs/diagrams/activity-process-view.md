# Activity Diagrams — Process View

> UML 4+1 Process View. Eight key runtime flows, verified against service controllers.
> Each flow uses swimlane subgraphs (actor / service / external). Generated 2026-06-02.

---

## 1. Authentication (register → login → JWT → refresh)

```mermaid
flowchart TD
    A0([Start]) --> A1["User submits register form"]
    A1 --> A2{"Email already used?"}
    A2 -->|yes| A3["Return 409 error"] --> AE([End])
    A2 -->|no| A4["auth_service: hash password (bcrypt), create user"]
    A4 --> A5["User submits login"]
    A5 --> A6{"Credentials valid?"}
    A6 -->|no| A7["Return 401"] --> AE
    A6 -->|yes| A8["Issue accessToken (15m) + refreshToken (7d)"]
    A8 --> A9["Set refreshToken HttpOnly cookie, store in Redis"]
    A9 --> A10["Client calls APIs with Bearer accessToken"]
    A10 --> A11{"accessToken expired?"}
    A11 -->|no| A12["Gateway verifies, injects x-user-* headers"] --> AE
    A11 -->|yes| A13["POST /api/auth/refresh (cookie sent)"]
    A13 --> A14{"refreshToken valid in Redis?"}
    A14 -->|yes| A8
    A14 -->|no| A15["Force re-login"] --> AE
```

---

## 2. Forgot-password OTP

```mermaid
flowchart TD
    B0([Start]) --> B1["User: POST /api/auth/forgot-password {email}"]
    B1 --> B2["auth_service: generate 6-digit OTP"]
    B2 --> B3["Store OTP in Redis (MAIL_OTP:email, TTL 5m)"]
    B3 --> B4["auth_service to mail_service (HTTP)"]
    B4 --> B5["mail_service: send OTP email via Nodemailer to SMTP"]
    B5 --> B6["User enters OTP + new password"]
    B6 --> B7["POST /api/auth/check-otp {email, otp, newPassword}"]
    B7 --> B8{"OTP matches Redis & not expired?"}
    B8 -->|no| B9["Return error / rate-limited"] --> BE([End])
    B8 -->|yes| B10["Update password (bcrypt), invalidate OTP"]
    B10 --> BE
```

---

## 3. Course lifecycle (create → submit → review → publish)

```mermaid
flowchart TD
    C0([Start]) --> C1["Instructor: POST /api/course/courses, status=draft"]
    C1 --> C2["Add lessons, activities, quizzes, intro video"]
    C2 --> C3["POST /courses/:id/submit-for-review, status=pending"]
    C3 --> C4["Admin: review pending courses"]
    C4 --> C5["POST /courses/:id/review (decision)"]
    C5 --> C6{"Approved?"}
    C6 -->|rejected| C7["status=rejected (+ note), notify instructor"] --> CE([End])
    C6 -->|approved| C8["status=approved"]
    C8 --> C9["POST /courses/:id/publish, status=publish"]
    C9 --> C10["Course visible publicly; may be banned later by admin"]
    C10 --> CE
```

---

## 4. Enrollment + Payment (cart → PayOS → webhook → enroll)

```mermaid
flowchart TD
    D0([Start]) --> D1["Student: POST /api/course/carts/items (add courses)"]
    D1 --> D2["POST /api/payment/create-payment (or /buy-now)"]
    D2 --> D3["payment_service: create transaction (pending) + PayOS order"]
    D3 --> D4["Return checkout URL, student pays on PayOS"]
    D4 --> D5["PayOS to POST /api/payment/payos-callback (webhook)"]
    D5 --> D6{"HMAC signature valid?"}
    D6 -->|no| D7["Reject webhook"] --> DE([End])
    D6 -->|yes| D8["Dedup via webhook_events; mark transaction=paid"]
    D8 --> D9["Publish Redis payment:success {orderCode}"]
    D9 --> D10["course_service subscriber creates enrolls rows"]
    D10 --> D11["Student gains access; clear cart items"]
    D11 --> DE
```

---

## 5. Video upload (TUS → Bunny → webhook → SSE/WS)

```mermaid
flowchart TD
    E0([Start]) --> E1["Instructor: POST /api/media/bunny/videos/init-upload"]
    E1 --> E2["media_service: create Bunny video, return TUS upload URL"]
    E2 --> E3["Client uploads file directly to Bunny via tus-js-client"]
    E3 --> E4["Bunny transcodes video"]
    E4 --> E5["Bunny to POST /api/media/webhooks/bunny-stream"]
    E5 --> E6{"HMAC valid & event new?"}
    E6 -->|no| E7["Ignore / dedup"] --> EE([End])
    E6 -->|yes| E8["Update videos row (bunny_video_guid, status)"]
    E8 --> E9["Emit progress via WebSocket + SSE"]
    E9 --> E10["Client UI updates; video ready to attach to lesson"]
    E10 --> EE
```

---

## 6. AI quiz generation (SRT → OpenAI → persist)

```mermaid
flowchart TD
    F0([Start]) --> F1["Instructor selects lesson with video + SRT"]
    F1 --> F2["POST /api/course/quizzes/ai {lessonActivityId, ...}"]
    F2 --> F3["course_service: resolve SRT raw (resolve-srt)"]
    F3 --> F4{"SRT available?"}
    F4 -->|no| F5["Return error"] --> FE([End])
    F4 -->|yes| F6["Call OpenAI (quiz.gen helper) with transcript"]
    F6 --> F7["Map response to quiz rows"]
    F7 --> F8["Persist quizzes + quiz_questions + quiz_options"]
    F8 --> F9["Return generated quiz to instructor for review/edit"]
    F9 --> FE
```

---

## 7. Newsfeed (scroll → view → interact)

```mermaid
flowchart TD
    G0([Start]) --> G1["Instructor: POST /api/media/feed (highlight from course video)"]
    G1 --> G2["Student: GET /api/media/feed?cursor&mode=recommended"]
    G2 --> G3["feed.service: cursor-paginated, Redis reco cache"]
    G3 --> G4["Student watches a clip"]
    G4 --> G5["POST /feed/:id/view {watch_duration, completed} to feed_views"]
    G5 --> G6{"Interaction?"}
    G6 -->|like/save/share| G7["POST /feed/:id/interact to feed_interactions"]
    G6 -->|comment| G8["POST /feed/:id/comments (origin_cmt for reply) to feed_comments"]
    G6 -->|none| G9["Scroll to next clip"]
    G7 --> G9
    G8 --> G9
    G9 --> G2
```

---

## 8. Lecturer upgrade request → admin review

```mermaid
flowchart TD
    H0([Start]) --> H1["Student: POST /api/users/lecturer-requests {confirm}"]
    H1 --> H2["user_service: create lecturer_upgrade_requests (pending)"]
    H2 --> H3["Admin: GET /api/users/lecturer-requests"]
    H3 --> H4["PATCH /api/users/lecturer-requests/:id/review"]
    H4 --> H5{"Approved?"}
    H5 -->|rejected| H6["status=rejected (+ note)"]
    H5 -->|approved| H7["status=approved; update user.role = LECTURER (3)"]
    H6 --> H8["Create notification for requester"]
    H7 --> H8
    H8 --> HE([End])
```

## Notes

- Flows 4 and 5 both rely on `webhook_events` for idempotency (provider + event_id unique).
- Flow 4 enrollment grant is asynchronous via Redis Pub/Sub (`payment:success`).
- Flows 1, 2, 8 cross service boundaries: auth to mail (HTTP), user to media (notification).
- Activity decisions (diamonds) reflect real guard conditions in the controllers/services.
