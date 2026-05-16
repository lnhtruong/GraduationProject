# Frontend Next.js

## Mục đích
Web app chính cho 3 user role (student / lecturer / admin). Next.js 16 App Router, React 19, Tailwind v4 + Radix UI shadcn-style. Real-time qua Socket.IO + SSE.

## Tech stack chi tiết
- **Framework**: Next.js 16 (App Router, Turbopack)
- **React**: 19
- **Styling**: Tailwind CSS v4 + `@tailwindcss/postcss`, custom utility ở `app/globals.css`
- **UI primitives**: Radix UI (accordion, dialog, dropdown, popover, select, tabs, …) — gói gọn trong `components/ui/` theo shadcn pattern
- **Icons**: `lucide-react`
- **Animations**: `framer-motion`, `embla-carousel-react`
- **Forms**: `react-hook-form` v7 + `zod` v4 + `@hookform/resolvers`
- **Server state**: `@tanstack/react-query` v5 (+ devtools)
- **Client state**: `zustand` v5
- **Rich text**: TipTap v2 (preferred) + CKEditor 5 (legacy)
- **Drag-drop**: `@dnd-kit/core` + `sortable` + `modifiers` + `utilities`
- **Date**: `date-fns` v4 + `react-day-picker` v9
- **Charts**: `recharts`
- **Toast**: `sonner`
- **Theme**: `next-themes`
- **Video**: `tus-js-client` (resumable upload Bunny), HTML5 video tag
- **Realtime**: `socket.io-client` v4, native EventSource cho SSE

## Folder structure (chi tiết)

```
frontend-nextjs/
├── app/                     # Next.js App Router
│   ├── layout.tsx           # Root layout: <html><body> + QueryProvider + AuthProvider + theme + Toaster
│   ├── globals.css          # Tailwind + custom CSS variables (theme)
│   ├── (app)/               # Route group: app chính có nav bar
│   │   ├── layout.tsx       # Layout có Header
│   │   ├── page.tsx         # Home page
│   │   ├── courses/         # Browse courses
│   │   ├── library/         # Khóa học đã mua
│   │   ├── profile/         # Profile user
│   │   ├── upload/          # Upload video (cho lecturer / mascot editor)
│   │   ├── workspace/       # ?
│   │   ├── unauthorized/
│   │   └── components/SseTestClient.tsx
│   ├── (auth)/              # Route group: signin/signup (no nav)
│   │   ├── layout.tsx
│   │   ├── signin/page.tsx, signup/page.tsx
│   │   ├── forgot-password/page.tsx, reset-password/page.tsx
│   ├── (instructor)/instructor/   # Dashboard lecturer
│   │   ├── layout.tsx, page.tsx, dashboard/page.tsx
│   │   ├── courses/[courseId]/{lessons,feed}/...
│   │   ├── roadmaps/[roadmapId]/page.tsx
│   │   ├── analytics/, shorts/, qa/
│   ├── (admin)/admin/       # Dashboard admin
│   │   ├── layout.tsx
│   │   └── courses/page.tsx
│   ├── cart/page.tsx
│   ├── editor/page.tsx      # Video editor (mascot overlay)
│   └── newsfeed/page.tsx
│
├── features/                # ← MÃ LOGIC CHÍNH (organize by domain)
│   ├── auth/
│   │   └── components/SignInForm.tsx
│   ├── upload/              # Upload video (lesson/mascot)
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   ├── hooks/useUpload.tsx
│   │   ├── components/{UploadDropzone, ProcessingStatus}.tsx
│   │   └── api/upload.websocket.ts          # Subscribe Socket.IO progress
│   ├── video/
│   │   ├── types.ts
│   │   ├── api/video.api.ts                 # Axios calls /api/media/videos
│   │   └── upload/{useLessonVideoUpload.ts, lesson-video-upload.manager.ts}
│   ├── newsfeed/            # Feed UI
│   │   ├── index.tsx, types.ts
│   │   ├── api/{newsfeed.api,newsfeed.hooks}.ts
│   │   ├── hooks/useNewsfeedVideoFeed.ts
│   │   └── components/Newsfeed{Page,VideoCard,VideoFeed,Header,Sidebar,CoursePanel,OptionBox,ShareDialog,CommentsPanel}.tsx
│   ├── courses/
│   │   ├── detail/{index.tsx, components/{ReviewsSection,WriteReviewForm}.tsx}
│   │   └── learn/components/LessonVideoCard.tsx
│   ├── cart/components/Cart*.tsx
│   ├── editor/components/EditorMediaDropzone.tsx
│   ├── home/component/CourseCard.tsx
│   ├── instructor/
│   │   ├── components/courses/{CoursesPage, CourseManageCard}.tsx
│   │   ├── components/analytics/{AnalyticsPage, CourseStatsSection, FeedStatsSection, TrendingFeedSection}.tsx
│   │   ├── components/dashboard/DashboardPage.tsx
│   │   ├── course-management/
│   │   │   ├── CourseOverviewPage.tsx, CourseFormPage.tsx, LessonFormPage.tsx
│   │   │   ├── CourseFeedManagementPage.tsx, CourseFeedCreatePage.tsx, CourseFeedEditPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── LessonForm.tsx, LessonForm/{LessonMetadataForm, VideoSelectionSection, VideoPreview, ActivitiesDisplay, OutsideQuizEditorDialog}.tsx
│   │   │   │   ├── CourseForm.tsx, CourseManagementHeader.tsx
│   │   │   │   ├── ActivityCreationDialog.tsx + sub: {QuizModeSection, InvalidVideoWarning, ActivityDialogFooter, AssignmentForm}
│   │   │   │   ├── ActivityQuizForm.tsx
│   │   │   │   ├── ManagementPageShell.tsx
│   │   │   │   ├── QuizEditor.tsx, QuizEditor/{QuestionEditor, QuestionList, QuizMetadataForm}.tsx
│   │   │   └── utils/quiz-editor-page.utils.ts
│   │   └── roadmap-management/
│   │       ├── RoadmapList.tsx, RoadmapCreate.tsx, RoadmapDetail.tsx
│   │       ├── components/RoadmapCourseCard.tsx
│   │       └── components/roadmap-detail/{RoadmapInfoForm, RoadmapCourseSection, RoadmapDialogs, useRoadmapDetailEditor.ts}
│   ├── admin/components/{AdminShell, AdminSidebar, CourseStatusBadge}.tsx
│   │             courses/{AdminCoursesPage, AdminCourseTable, AdminCourseReviewModal}.tsx
│   ├── roadmap/api/{roadmap.api, roadmap.hooks}.ts
│   └── lessons/{types.ts, api/lesson.api.ts}
│
├── components/              # Shared cross-feature
│   ├── Header.tsx           # Navigation chính
│   ├── ProtectedRoute.tsx   # Wrap page yêu cầu auth
│   ├── ScrollToTopButton.tsx
│   ├── RichTextBoxCKE.tsx, RichTextBoxTiptap.tsx
│   ├── providers/
│   │   ├── AuthProvider.tsx     # Context: user, login, logout, refresh
│   │   └── QueryProvider.tsx    # QueryClient + devtools
│   └── ui/                  # shadcn primitives (button, dialog, ...)
├── lib/                     # Util chung (axios instance, helpers) — TODO: xác minh có folder này không
├── public/                  # Static assets
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Pattern feature folder

Mỗi feature ở `features/<domain>/`:

```
features/<domain>/
├── index.tsx              # Page component (export default)
├── types.ts               # TypeScript types cho feature
├── api/
│   ├── <domain>.api.ts    # Axios functions (fetch/mutate)
│   └── <domain>.hooks.ts  # TanStack Query wrapper (useXxxQuery, useXxxMutation)
├── hooks/                 # Custom React hooks không gắn data fetching
└── components/            # UI components scoped feature
```

## Data fetching pattern

`features/<domain>/api/<domain>.api.ts`:
```ts
import { api } from '@/lib/api';  // Axios instance with interceptor

export const fetchCourses = (params) => api.get('/api/course/courses', { params }).then(r => r.data);
export const createCourse = (data) => api.post('/api/course/courses', data).then(r => r.data);
```

`features/<domain>/api/<domain>.hooks.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './<domain>.api';

export const useCourses = (params) => useQuery({
  queryKey: ['courses', params],
  queryFn: () => api.fetchCourses(params),
});

export const useCreateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
};
```

> **TODO: xác minh** — Axios instance file (`lib/api.ts`?) có thực sự tồn tại không. Nếu không, mỗi file `*.api.ts` import axios trực tiếp.

## Auth flow client side

`components/providers/AuthProvider.tsx`:
- Context cung cấp `{ user, accessToken, login, logout, refresh }`
- Lưu `accessToken` trong memory (Zustand store?) — không localStorage để tránh XSS
- Refresh token tự động qua cookie (HttpOnly) khi access hết hạn
- Axios interceptor catch 401 → gọi `/api/auth/refresh` → retry

`components/ProtectedRoute.tsx`:
- Wrap component, check `useAuth().user`, redirect tới `/signin` nếu chưa auth
- Có thể check role để redirect tới `/unauthorized`

## Routing

- App Router theo file system, route groups `(app)`, `(auth)`, `(instructor)`, `(admin)` không ảnh hưởng URL nhưng chia layout
- Dynamic: `[courseId]`, `[lessonId]`, `[roadmapId]`, `[feedId]`, `[id]`
- Public routes: `/`, `/courses`, `/courses/[id]`, `/newsfeed`, `/signin`, `/signup`
- Protected: tất cả trong `(app)/`, `(instructor)/`, `(admin)/`

## State management

- **TanStack Query**: server state (courses, lessons, feed, etc.)
- **Zustand**: client state cuộc đời session (auth token, UI state, upload progress)
- **React Hook Form**: form state local
- **URL state**: filters/search dùng query params + `useSearchParams`

## Realtime

- **Socket.IO** (`socket.io-client`): video upload progress, video processing events
  - Connect: `io(NEXT_PUBLIC_API_URL, { auth: { token } })`
  - Subscribe events: `video:processing:progress`, `video:ready`
- **SSE**: notifications stream — `new EventSource('/api/media/sse/users/<userId>/events')`

## Quirks

- Có 2 rich text editor: TipTap (mới) + CKEditor 5 (legacy) — ưu tiên TipTap khi viết feature mới
- Upload trực tiếp lên Bunny qua TUS (resumable), không qua Next.js server
- `frontend/` (Vite) legacy không sync — đừng đụng
- Tailwind v4 syntax: dùng `@theme` trong CSS, không cần `tailwind.config.ts`
- Path alias `@/` thường trỏ `frontend-nextjs/` root (TODO: xác minh ở `tsconfig.json`)

## Env

`.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000      # Gateway URL
NEXT_PUBLIC_BUNNY_LIBRARY_ID=...
NEXT_PUBLIC_BUNNY_STREAM_URL=...
```

## Cách chạy local

```bash
cd frontend-nextjs
npm install   # or yarn
npm run dev   # port 3000 (Next default) — clash với gateway! Cần đổi gateway port hoặc Next port
npm run build && npm start
npm run lint
```

> **TODO: xác minh** — Default cả gateway và Next đều port 3000. Phải set 1 trong 2 sang port khác. Thường gateway giữ 3000, Next dev port 3001.
