# Course Change Requests — Lesson edits trên khóa học đã publish

> Service: `course_service`. Cập nhật: 2026-06-07.

Tái sử dụng bảng `course_change_requests` cho cả thao tác lesson trên khóa học **đã
publish**, thay vì chặn. Bảng có thêm 2 cột (migration `046`):

- `kind`: `course.update` | `lesson.create` | `lesson.update` | `lesson.delete`
  (default `course.update` để row cũ giữ nguyên hành vi course-level).
- `target_id`: id lesson đích cho `lesson.update` / `lesson.delete` (null với
  `course.update` và `lesson.create`).

## Phân quyền

- **Giảng viên (LECTURER):** sửa khóa học/lesson **đã publish** → tạo change request
  `pending` chờ admin duyệt; nội dung live không đổi cho tới khi approve.
- **Admin (ADMIN):** **toàn quyền** — thêm/sửa/xóa khóa học & lesson áp dụng **trực tiếp**,
  không qua change request (kể cả khi khóa học đã publish; khóa học giữ nguyên `publish`).
- Khóa học **chưa publish:** mọi role áp dụng trực tiếp như cũ.

## Endpoints lesson

`POST /api/course/lessons`, `PATCH /api/course/lessons/:id`, `DELETE /api/course/lessons/:id`

- **Header bắt buộc khi tạo change request:** `x-user-id` (ghi `requested_by`),
  `x-user-role` (quyết định admin có bypass hay không). Thiếu `x-user-id` mà cần tạo
  request → `400`.
- **Response (giảng viên, khóa đã publish):** trả về bản ghi change request thay vì
  lesson/`204`:

```json
{
  "id": 12,
  "courseId": 7,
  "kind": "lesson.update",
  "targetId": 100,
  "payload": { "title": "Bài 1 (mới)" },
  "prevData": { "title": "Bài 1" },
  "status": "pending",
  "requestedBy": 9
}
```

- `lesson.create` luôn tạo request mới. `lesson.update` / `lesson.delete` **ghi đè**
  request `pending` cùng `(kind, targetId)` nếu đã có — tối đa 1 pending mỗi thao tác
  trên cùng một lesson, tránh admin áp dụng lặp lại cùng một thay đổi.

## Duyệt (admin)

`PATCH /api/course/courses/change-requests/:requestId/review`

- **`approved`:** áp thay đổi vào bảng `lessons` (trong transaction) → đồng bộ `duration`
  của course và tiến độ (`progress`) của mọi enrollee → response trả course đã refresh.
- **`rejected`:** course không đổi.
- Danh sách: `GET /api/course/courses/change-requests` nay trả cả lesson change requests;
  FE lọc theo `kind`, với lesson dùng `targetId` để resolve chi tiết.

## Audit log + Notification (best-effort, qua media_service, SSE `notify:created`)

- **Approve:** audit `course.change_request.approve`; noti +SSE tới:
  - Giảng viên (người yêu cầu + chủ khóa học): event `course.change_request.approved`.
  - Học viên đã enroll: event `course.updated` (message tùy `kind`).
- **Reject:** audit `course.change_request.reject`; noti +SSE event
  `course.change_request.rejected` cho giảng viên (kèm lý do nếu có). Học viên không báo.
- Lỗi media_service không làm hỏng luồng review.

## Soft delete & dọn request đang chờ duyệt

- **Course & lesson đều soft delete:** course dùng `paranoid` (`deleted_at`) — `destroy()`
  set `deleted_at`, mọi query tự loại trừ; lesson dùng `status = removed`.
- **KHÔNG cascade** change request khi xóa (giữ lịch sử approved/rejected để còn tra cứu).
  Chỉ xóa các request **đang `pending`** liên quan vì không còn ý nghĩa gửi admin duyệt:
  - Xóa course → xóa các change request `pending` của course đó (mọi `kind`).
  - Xóa lesson (trực tiếp, hoặc khi approve `lesson.delete`) → xóa các request `pending`
    `lesson.update`/`lesson.delete` trỏ tới lesson đó (chừa request đang được duyệt).
