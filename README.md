# GraduationProject

## API Requirements

Các endpoint frontend cần mà backend chưa cung cấp. Mỗi mục có phân tích tình hình hiện tại và lý do không thể workaround ở frontend.

---

### [Dashboard] Số câu hỏi chưa trả lời của instructor — 2026-06-02

- **Endpoint đề xuất:** `GET /api/course/instructor/stats/unanswered-qa`
- **Service:** course_service
- **Mô tả:** Trả về tổng số discussion chưa được trả lời (`isAnswered = false`) trên tất cả khoá học của instructor hiện tại.
- **Tại sao không workaround được:** API hiện tại `GET /course/courses/:courseId/discussions?status=unanswered` chỉ query theo từng course. Để lấy tổng cần gọi N request song song (N = số khoá học), gây tải không cần thiết và tăng độ trễ. Không phù hợp cho dashboard widget.
- **Response mong muốn:**
  ```json
  { "unansweredCount": 5 }
  ```
- **Headers cần:** `x-user-id`, `x-user-role`

---

### [Dashboard] Danh sách Q&A gần đây (recent unanswered discussions) — 2026-06-02

- **Endpoint đề xuất:** `GET /api/course/instructor/discussions/recent?limit=5&status=unanswered`
- **Service:** course_service
- **Mô tả:** Trả về N discussion gần nhất chưa được trả lời trên **tất cả** khoá học của instructor, kèm thông tin user, tên khoá học.
- **Tại sao không workaround được:** Tương tự trên — phải gọi N request rồi merge+sort ở client, không hợp lý.
- **Response mong muốn:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "content": "Câu hỏi của học viên...",
        "createdAt": "2026-06-01T10:00:00Z",
        "isAnswered": false,
        "courseName": "Lập trình Web cơ bản",
        "courseId": 12,
        "user": { "id": 5, "firstName": "Minh", "lastName": "Tuấn", "avatarUrl": null }
      }
    ]
  }
  ```
- **Headers cần:** `x-user-id`, `x-user-role`

---

### [QA Page] Danh sách quiz theo instructor (có filter) — 2026-06-02

- **Endpoint hiện có:** `GET /api/course/quizzes?lessonActivityId=...`
- **Vấn đề:** Endpoint không filter theo instructor — trả về **toàn bộ quiz của hệ thống**. Instructor chỉ nên thấy quiz thuộc khoá học của mình.
- **Đề xuất:** Thêm middleware xác thực `x-user-id` và `x-user-role` vào `GET /course/quizzes`, tự động filter kết quả theo instructor khi role = LECTURER (3). Hoặc thêm endpoint riêng:
  - `GET /api/course/instructor/quizzes`
- **Response mong muốn:** Giữ nguyên shape hiện tại, chỉ cần filter đúng owner.
- **Headers cần:** `x-user-id`, `x-user-role`

---

### [QA Page] Stats tổng hợp quiz của instructor — 2026-06-02

- **Endpoint đề xuất:** `GET /api/course/instructor/quiz-stats`
- **Service:** course_service
- **Mô tả:** Trả về aggregate stats trên tất cả quiz của instructor: tổng số quiz, tổng câu hỏi, tổng lượt hoàn thành, điểm trung bình.
- **Tại sao không workaround được:** `GET /quiz-submissions/stats/quiz/:quizId` chỉ trả về stats per-quiz. Để tính aggregate phải gọi M request (M = số quiz), không hợp lý. Hiện tại trang hiển thị `—` cho 2 chỉ số này.
- **Response mong muốn:**
  ```json
  {
    "totalQuizzes": 4,
    "totalQuestions": 26,
    "totalCompletions": 413,
    "avgScore": 84.2
  }
  ```
- **Headers cần:** `x-user-id`, `x-user-role`

---

### [Dashboard / QA Page] Tên khoá học và thumbnail trên quiz — 2026-06-02

- **Vấn đề:** `GET /course/quizzes` trả về `Quiz` có `lessonActivityId` nhưng **không include** tên khoá học hay thumbnail. Instructor cần biết quiz thuộc khoá học nào để quản lý.
- **Đề xuất:** Include thêm thông tin khoá học vào response của `GET /course/quizzes`:
  ```json
  {
    "id": 1,
    "name": "Quiz HTML Basics",
    "lessonActivityId": 5,
    "courseName": "Lập trình Web cơ bản",
    "courseId": 12
  }
  ```
- **Service:** course_service — join thêm `LessonActivity → Lesson → Course`

---

### [Follow] Thống kê và trạng thái follow của instructor — 2026-06-02

- **Endpoint:** `GET /api/instructors/:id/stats`
- **Service:** user_service hoặc course_service
- **Mô tả:** Trả về số lượng follower và trạng thái isFollowing của user hiện tại với instructor đó.
- **Response mong muốn:**
  ```json
  { "followerCount": 1234, "isFollowing": true }
  ```
- **Headers cần:** `x-user-id` (optional — nếu không login thì `isFollowing: false`)

---

### [Follow] Follow instructor — 2026-06-02

- **Endpoint:** `POST /api/instructors/:id/follow`
- **Service:** user_service
- **Mô tả:** Đăng ký theo dõi một instructor. Idempotent (follow lần 2 không lỗi).
- **Auth:** Bắt buộc (Bearer token)
- **Response mong muốn:** `204 No Content`

---

### [Follow] Unfollow instructor — 2026-06-02

- **Endpoint:** `DELETE /api/instructors/:id/follow`
- **Service:** user_service
- **Mô tả:** Hủy theo dõi một instructor.
- **Auth:** Bắt buộc (Bearer token)
- **Response mong muốn:** `204 No Content`

---

### [Follow] Danh sách instructor đang theo dõi — 2026-06-02

- **Endpoint:** `GET /api/users/following`
- **Service:** user_service
- **Mô tả:** Danh sách các instructor mà user hiện tại đang follow.
- **Auth:** Bắt buộc (Bearer token)
- **Response mong muốn:**
  ```json
  [
    { "id": 5, "firstName": "Nguyen", "lastName": "Van A", "avatarUrl": "...", "title": "Senior Engineer" }
  ]
  ```
