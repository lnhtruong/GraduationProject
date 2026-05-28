# CLAUDE.md — GraduationProject

Hướng dẫn cho Claude Code khi làm việc trong repo này.

---

## Phân công trách nhiệm

- **Người phụ trách:** ThuyUyen — chịu trách nhiệm toàn bộ frontend (`frontend-nextjs/`).
- **Có thể sửa trực tiếp:** `frontend-nextjs/` và `backend_services/api_gateway/src/middleware/access-policy.ts`.
- **Không sửa trực tiếp** các service backend khác (`auth_service`, `course_service`, v.v.). Thay vào đó:
  - Đọc code backend để hiểu API contract.
  - Ưu tiên điều chỉnh frontend cho phù hợp với API hiện có.
  - Nếu phát hiện bug hoặc điểm bất hợp lý ở backend → **đề xuất rõ ràng trước**, không tự ý sửa.
- **Bổ sung yêu cầu API mới** → ghi vào `README.md` ở thư mục gốc (section `## API Requirements`), không tự gọi API chưa tồn tại.

---

## Quy tắc quan trọng

### Chất lượng — Đồ án tốt nghiệp, không được phép để lỗi tiềm ẩn

- **Không làm tạm bợ.** Ví dụ: không tự sort/filter ở client từ dữ liệu full trả về, phải yêu cầu backend hỗ trợ query params (`?sort=`, `?filter=`, `?page=`, `?limit=`).
- Khi có nhiều hướng giải quyết, luôn phân tích trade-off rõ ràng trước khi code.
- Không để lại `TODO`, `console.log`, mock data cứng trong code production.
- Xử lý loading state, error state, empty state đầy đủ — không bỏ sót UX edge case.
- Type-safe tuyệt đối: không dùng `any`, không bỏ qua TypeScript error.

### Trước khi code — Luôn lên plan và trình bày trade-off

Với mọi task không trivial (thêm tính năng, refactor, tích hợp API mới):
1. Trình bày hướng tiếp cận và các lựa chọn thay thế.
2. Nêu trade-off của từng hướng (performance, complexity, maintainability, UX).
3. Đề xuất hướng tốt nhất và lý do.
4. Chờ xác nhận trước khi bắt đầu code.

---

## Cấu trúc dự án

```
GraduationProject/
├── frontend-nextjs/          # Next.js 16 + App Router (PHỤ TRÁCH CHÍNH)
├── backend_services/
│   ├── api_gateway/          # Entry point + access-policy.ts (được sửa)
│   ├── auth_service/         # JWT, sessions (chỉ đọc tham khảo)
│   ├── user_service/         # User profiles (chỉ đọc tham khảo)
│   ├── course_service/       # Courses, lessons, quizzes (chỉ đọc tham khảo)
│   ├── media_service/        # Upload, video, feed (chỉ đọc tham khảo)
│   ├── payment_service/      # Thanh toán (chỉ đọc tham khảo)
│   ├── inference_service/    # AI/ML (chỉ đọc tham khảo)
│   └── ...
├── database/                 # Migrations, schema
├── docs/                     # Tài liệu kiến trúc chi tiết
└── README.md                 # Ghi API requirements mới vào đây
```

### Frontend (`frontend-nextjs/`)

```
frontend-nextjs/
├── app/                      # Next.js App Router pages
│   ├── (app)/               # Authenticated routes
│   ├── (auth)/              # Public auth routes
│   ├── (admin)/             # Admin panel
│   ├── (instructor)/        # Instructor dashboard
│   ├── editor/              # Video editor
│   └── newsfeed/            # Public newsfeed
├── features/                 # Feature modules (source of truth)
│   ├── _shared/             # Shared factories, utils
│   ├── auth/
│   ├── courses/
│   ├── admin/
│   ├── instructor/
│   ├── videoEditor/
│   └── ...
├── components/
│   └── ui/                  # Radix UI + Tailwind components (shadcn pattern)
├── lib/                     # http.ts, queryClient, auth-session, utils
├── store/                   # Zustand stores
└── hooks/                   # Global hooks
```

---

## Tech stack frontend

| Concern | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 (utility-first, không dùng CSS modules) |
| UI Primitives | Radix UI + shadcn/ui pattern |
| State | Zustand (persist cho auth) |
| Data Fetching | TanStack React Query v5 |
| HTTP | Axios (`lib/http.ts`) với interceptor auto-refresh token |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |
| Animations | Framer Motion |
| Real-time | Socket.io-client |
| Drag & Drop | dnd-kit |
| Rich Text | Tiptap (primary), CKEditor (fallback) |

---

## Conventions — Phải tuân thủ đúng phong cách codebase

### Pattern phân lớp (feature module)

```
features/<tên>/
├── api/
│   ├── <tên>.api.ts        # Axios calls, normalize snake_case → camelCase
│   └── <tên>.hooks.ts      # React Query hooks (useQuery, useMutation)
├── components/             # UI components của feature
├── types.ts                # TypeScript interfaces/types
├── schemas.ts              # Zod validation schemas (nếu có form)
└── index.tsx               # Entry component (optional)
```

### API layer (`*.api.ts`)

- Dùng `createApi()` factory từ `features/_shared/api-factories.ts`.
- Dùng `apiHttpClient` (từ `lib/http.ts`) — không import `axios` trực tiếp.
- Normalize response về camelCase trước khi trả ra.
- Không đặt logic UI hay side effect trong API layer.

```ts
// Ví dụ đúng
import { createApi, apiHttpClient } from "@/features/_shared/api-factories";

export const courseApi = createApi({
  getCourses: async (params: GetCoursesParams) => {
    const { data } = await apiHttpClient.get("/api/course/courses", { params });
    return data;
  },
});
```

### React Query hooks (`*.hooks.ts`)

- Dùng `queryKeys` từ `lib/queryKeys.ts` để đặt tên cache key.
- Wrap `useQuery` / `useMutation` — không gọi API trực tiếp trong component.
- Tên hook: `use<Resource>`, `use<Resource>Query`, `use<Action>Mutation`.

### Component

- Pages (`app/`) chỉ là wrapper mỏng — không đặt data fetching, logic ở đây.
- Logic và data fetching nằm trong feature components.
- Props interface đặt ngay trên component, không file riêng (trừ khi share).
- Không dùng default export cho components chia sẻ — dùng named export.

### Styling

- **Chỉ dùng Tailwind utility classes** — không viết CSS thủ công hay inline style (trừ dynamic value không thể dùng Tailwind).
- **Màu sắc và design tokens** lấy từ CSS variables định nghĩa trong `globals.css` — không hardcode hex color.
- Dùng component `ui/` (`Button`, `Card`, `Dialog`, `Input`, v.v.) thay vì tự dựng HTML.
- Dark mode support bắt buộc — dùng Tailwind dark variant theo pattern hiện có.
- **Đồng nhất**: trước khi thêm UI mới, xem các trang/component tương tự đã có để match style.

### TypeScript

- `strict: true` — bắt buộc.
- Không dùng `any`. Nếu type phức tạp, dùng `unknown` + type guard hoặc tạo interface.
- Định nghĩa type/interface trong `types.ts` của feature tương ứng.
- Path alias: dùng `@/` thay vì relative path dài.

---

## Access policy

File `backend_services/api_gateway/src/middleware/access-policy.ts` định nghĩa quyền truy cập từng endpoint.

Roles: `ADMIN = 1`, `STUDENT = 2`, `LECTURER = 3`.

Khi thêm route mới vào backend (theo yêu cầu API), cần bổ sung rule tương ứng vào `ACCESS_RULES` trong file này. Luôn đặt rule cụ thể hơn (path cụ thể hơn) **trước** rule tổng quát hơn vì matching theo thứ tự first-match.

---

## Ghi yêu cầu API mới vào README.md

Khi frontend cần API chưa có ở backend, bổ sung vào section `## API Requirements` trong `README.md` ở thư mục gốc theo format:

```markdown
### [Tên tính năng] — <ngày đề xuất>
- **Endpoint:** `GET /api/course/courses?page=1&limit=20&sort=createdAt&order=desc`
- **Service:** course_service
- **Mô tả:** Danh sách khóa học hỗ trợ phân trang và sort phía server
- **Lý do:** Hiện tại API trả về toàn bộ data, frontend không nên tự sort/filter
- **Response mong muốn:**
  ```json
  { "data": [...], "total": 100, "page": 1, "limit": 20 }
  ```
```

---

## Checklist trước khi báo hoàn thành

- [ ] TypeScript compile không có lỗi (`tsc --noEmit`)
- [ ] Không còn `console.log`, `TODO`, mock data cứng
- [ ] Loading state, error state, empty state đều được xử lý
- [ ] Màu sắc, spacing, typography đồng nhất với thiết kế hiện có
- [ ] Dark mode hiển thị đúng
- [ ] Mobile responsive (nếu liên quan đến layout)
- [ ] Không tự sort/filter full data ở client — phải dùng API params
- [ ] Nếu có API mới cần → đã ghi vào `README.md`
- [ ] Nếu phát hiện bug backend → đã đề xuất trước khi code workaround
