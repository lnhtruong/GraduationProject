# API — Update Course (Change Request Flow)

**Ngày:** 2026-06-06 · **Service:** `course_service` · **Trạng thái:** ✅ Đã implement & test (21 unit test pass)

---

## Quy tắc

- **Course CHƯA publish** (`DRAFT` / `PENDING` / `APPROVED` / `REJECTED`) → owner (hoặc admin) sửa **trực tiếp**, course bị đưa về `DRAFT` (hành vi cũ).
- **Course ĐÃ `PUBLISH`** → KHÔNG sửa trực tiếp. Mọi chỉnh sửa được gói thành **change request** `pending` chờ admin duyệt. Course giữ nguyên `PUBLISH` và nội dung live.
  - Admin **approve** → apply payload vào course (vẫn `PUBLISH`) + ghi audit log.
  - Admin **reject** → course không đổi.
- Tối đa **1 request `pending` / course**: gọi update lần nữa khi đang có pending → **ghi đè payload** của request đó (không tạo mới). Ràng buộc đảm bảo ở tầng service (MySQL không hỗ trợ partial unique index).
- Quyền sửa: chỉ **owner** của course hoặc **admin**; người khác → `403 Forbidden`.

**Không có endpoint submit riêng** — tái dùng chính `PATCH /api/course/courses/:id`:
- Course chưa publish → trả về **Course** đã update.
- Course đã publish → trả về **CourseChangeRequest** (`pending`) thay vì course.

---

## Table mới: `course_change_requests`

Migration: `database/knex_migrations/044_course_change_requests.js`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | INT PK auto | |
| `course_id` | INT NOT NULL | FK → `courses.id` `ON DELETE CASCADE` |
| `requested_by` | INT NOT NULL | userId instructor gửi yêu cầu |
| `payload` | JSON NOT NULL | `UpdateCourseDto` đã normalize camelCase (field muốn đổi) |
| `status` | ENUM(`pending`,`approved`,`rejected`) | DEFAULT `pending` |
| `reviewed_by` | INT NULL | userId admin đã duyệt |
| `review_note` | TEXT NULL | ghi chú khi duyệt (tùy chọn) |
| `created_at` / `updated_at` | DATETIME | |

Index: `idx_course_change_requests_course (course_id)`, `idx_course_change_requests_status (status)`.

---

## Endpoints

### 1. Cập nhật course (entry point của flow)
- **Endpoint:** `PATCH /api/course/courses/:id`
- **Role:** LECTURER, ADMIN (chỉ owner hoặc admin)
- **Body:** `UpdateCourseDto` (các field muốn đổi: `name`, `description`, `thumbnailUrl`, `categories`, `level`, `language`, `price`, `videoId`)
- **Response:**
  - Course chưa publish → `Course` (status về `DRAFT`)
  - Course đã publish → `CourseChangeRequest` (`status: "pending"`)
- **Lỗi:** `403` nếu không phải owner/admin · `404` nếu course không tồn tại

### 2. Danh sách change request (admin)
- **Endpoint:** `GET /api/course/courses/change-requests?status=pending&page=1&limit=20`
- **Role:** ADMIN
- **Query:** `status` (optional: `pending`/`approved`/`rejected`), `page` (default 1), `limit` (default 20, max 100)
- **Response:**
  ```json
  { "data": [ /* CourseChangeRequest[] */ ], "total": 100, "page": 1, "limit": 20 }
  ```

### 3. Duyệt change request (admin)
- **Endpoint:** `PATCH /api/course/courses/change-requests/:requestId/review`
- **Role:** ADMIN
- **Body:**
  ```json
  { "decision": "approved", "note": "tùy chọn, tối đa 1000 ký tự" }
  ```
  `decision` ∈ `"approved" | "rejected"` (bắt buộc); `note` optional.
- **Response:**
  ```json
  { "changeRequest": { /* ... */ }, "course": { /* Course sau apply, hoặc null nếu rejected */ } }
  ```
- **Lỗi:** `404` nếu request không tồn tại · `409 Conflict` nếu request không còn `pending`
- **Side-effect:** approve → ghi audit log `course.change_request.approve`.

---

## Access policy (`access-policy.ts`)

Đã thêm vào `ACCESS_RULES` — rule cụ thể đặt **trước** rule `:id` tổng quát (first-match):

```
GET    /api/course/courses/change-requests                      -> [ADMIN]   (trước GET /:id)
PATCH  /api/course/courses/change-requests/:requestId/review    -> [ADMIN]   (trước PATCH /:id)
```

> ⚠️ Lưu ý thứ tự: controller cũng khai báo route `change-requests` TRƯỚC route `:id`
> để tránh `ParseIntPipe` của `:id` bắt nhầm chuỗi `"change-requests"`.

---

## Coverage test (`src/course/course.service.spec.ts`)

| Nhóm | Case |
|---|---|
| update — chưa publish | owner sửa DRAFT → update trực tiếp; admin sửa course người khác → OK; non-owner/non-admin → `403` |
| update — đã publish | chưa có pending → tạo request mới; đã có pending → ghi đè payload; tìm đúng `courseId` + `pending` |
| listChangeRequests | filter status + phân trang; default page/limit khi thiếu |
| reviewChangeRequest | `404` không tồn tại; `409` không còn pending; reject → không đụng course; approve → apply payload + giữ PUBLISH + audit log |
