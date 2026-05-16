# 07 — Coding Conventions

## Tổ chức code

### Backend (NestJS services)
- 1 feature = 1 folder ngang trong `src/`: `<feature>.module.ts`, `<feature>.controller.ts`, `<feature>.service.ts`, `dto/`, models trong `models/` (course_service) hoặc nằm cạnh (auth_service, media_service)
- Folder naming: kebab-case hoặc snake_case không nhất quán giữa services. Ưu tiên **giữ nguyên** convention của service đang sửa.
  - `course_service/src/lessonProgress/` (camelCase)
  - `course_service/src/lesson-activities/` (kebab) — KHÔNG có (thực ra là `lessonActivities/` camelCase)
  - `media_service/src/images_mascot/` (snake_case)
- `models/` tập trung tất cả Sequelize model ở `course_service`; phân tán theo feature ở `media_service`, `auth_service`, `user_service`

### Backend (Express services - payment, mail)
- MVC pattern: `controllers/`, `services/`, `models/`, `routes/`, `middlewares/`, `utils/`, `configs/`
- Mỗi folder có `index.js` re-export
- Naming: kebab-case file, camelCase function

### Frontend (frontend-nextjs)
- App Router routes ở `app/`
- Business logic ở `features/<domain>/`
- Mỗi feature có: `index.tsx` (page), `types.ts`, `api/*.api.ts` + `*.hooks.ts`, `hooks/`, `components/`
- Component naming: PascalCase, 1 component / 1 file
- Hook naming: `useXxx`
- File naming: PascalCase cho component, camelCase cho non-component (.ts files)

## Naming convention

### Database (MySQL)
- Bảng: `snake_case`, số nhiều (`users`, `courses`, `lesson_progress`)
- Cột: hỗn hợp:
  - Bảng cũ: `camelCase` (`firstName`, `createdAt`, `updatedAt` — xem `users`)
  - Bảng mới: `snake_case` (`user_id`, `course_id`, `created_at`, `updated_at` — xem `videos`, `projects`)
- FK: `<reference_singular>_id` (vd `course_id`, `user_id`)
- Index name: `idx_<table>_<columns>` (vd `idx_videos_user_type`)
- Unique index: `uq_<table>_<column>`
- Foreign key constraint: `fk_<table>_<column>`

### Sequelize models
- Class name: PascalCase singular (`Course`, `LessonProgress`)
- File name: kebab-case (`course.model.ts`, `lesson-progress.model.ts`) hoặc snake_case
- `@Table({ tableName: '...', timestamps, createdAt, updatedAt })` — tableName explicit, không dùng auto-pluralize
- Field: TypeScript `declare` keyword (vd `declare id: number`) — để TS recognize Sequelize getters

### REST endpoints
- Path: lowercase + kebab-case, plural noun (`/courses`, `/lesson-activities`)
- HTTP method theo CRUD: GET (read), POST (create), PATCH (partial update), DELETE
- **Inconsistency hiện tại** giữ nguyên: một số endpoint dùng singular (`/enroll` thay vì `/enrolls`)

### Headers
- Custom: `x-user-id`, `x-user-role`, `x-user-email` — lowercase, gateway inject
- Auth: `Authorization: Bearer <token>` (chuẩn)

## Auth pattern trong controller

### Pattern 1: Tin tưởng gateway (mặc định)
```ts
@Controller('items')
export class ItemsController {
  @Get()
  list(@Headers('x-user-id') userIdHeader?: string) {
    const userId = parseInt(userIdHeader!, 10);
    if (!userId || isNaN(userId)) throw new UnauthorizedException();
    return this.service.findByUser(userId);
  }
}
```

### Pattern 2: Có helper parse
```ts
private parseRequiredUserId(header?: string): number {
  const id = Number(header);
  if (!Number.isInteger(id) || id <= 0) throw new UnauthorizedException();
  return id;
}
```

Helper này được copy giữa controllers — cần refactor thành shared util nhưng hiện tại chấp nhận duplication.

### Pattern 3: Role check thủ công
```ts
const ADMIN_ROLE = 1;
private assertAdmin(roleHeader?: string) {
  const role = Number(roleHeader);
  if (role !== ADMIN_ROLE) throw new UnauthorizedException('Admin permission required');
}
```

Lưu ý: role check chính nằm ở gateway `access-policy.ts`. Service self-check chỉ là defense-in-depth khi gateway có thể bị bypass.

## DTO + Validation

- Dùng `class-validator` decorators trong DTO
- Mỗi feature có folder `dto/`: `create-<entity>.dto.ts`, `update-<entity>.dto.ts`
- `UpdateDto` thường extends `PartialType(CreateDto)` từ `@nestjs/mapped-types`
- **TODO: xác minh** — main.ts có `app.useGlobalPipes(new ValidationPipe(...))` không. Nếu không, decorator validator KHÔNG hiệu lực.

## Error handling

### NestJS
- Throw exception class chuẩn:
  - `BadRequestException` (400)
  - `UnauthorizedException` (401)
  - `ForbiddenException` (403)
  - `NotFoundException` (404)
- NestJS tự convert sang HTTP response `{ statusCode, message, error }`
- Service throw, controller không cần wrap try/catch

### Express services (payment, mail)
- Service throw `Error` với optional `.status` field
- Controller wrap `try/catch`, gọi `res.status(err.status || 500).json({ error: err.message })`
- Hoặc dùng `next(err)` → `error.middleware.js` xử lý

## Response format

**Không** có standardized envelope chung. Quan sát:
- NestJS controller: trả raw object hoặc Sequelize model (NestJS serialize JSON)
- Express controller (payment): `res.json({ data: ..., error?: ... })` hoặc raw
- Gateway: error response `{ success: false, message: string }`

**Suggested khi viết mới**:
- Success: trả raw object hoặc array
- Error: throw exception (NestJS) hoặc `{ error: message }` (Express)

## Logging

- Console.log/console.error là chính (chưa có logger lib structured)
- API Gateway dùng `morgan` HTTP log + custom logging middleware
- Auth service có `LoggerMiddleware` riêng (`auth/logger/logger.middleware.ts`)
- Nhiều `console.log('check2')`, `console.log('check userid:', userId)` — **debug residue**, nên dọn

## Testing

- Tất cả NestJS service đều có `package.json` scripts: `test`, `test:watch`, `test:cov`, `test:e2e`
- Test file: `<name>.spec.ts` cạnh source (vd `auth.service.spec.ts`)
- Framework: Jest
- E2E config: `test/jest-e2e.json`
- Express services (payment, mail): **chưa có test** (`"test": "echo 'no test specified'"`)
- Frontend: chưa có test infra

## Environment variables

- File `.env` (gitignore) + `.env.example` (committed) trong mỗi service folder
- Convention env naming: `UPPER_SNAKE_CASE`
- Cần biến chung giữa services: `JWT_SECRET`, `DB_HOST`, `REDIS_HOST` (giá trị KHÁC NHAU nhưng tên giống nhau)
- Production secrets: set ở Render dashboard (xem `render.yaml` `sync: false`)

## Git / Commit

- TODO: xác minh có convention không. Hiện tại commit message không structured.
- File `.gitignore` mỗi service riêng + root

## TypeScript

- Service NestJS: TS strict (xem `tsconfig.json`)
- API Gateway: TS strict
- Payment/Mail: JS thuần (CommonJS), không TypeScript
- Frontend: TS strict, alias `@/` cho root

## Comment & Docs

- Code comment đa số bằng tiếng Việt
- Function/class JSDoc thưa thớt
- README ở cấp service mô tả setup nhưng outdated với một số service

## Patterns NÊN tránh khi viết code mới

- Hardcode role number — dùng enum nếu có (vd `UserRole.ADMIN`)
- `console.log` debug residue — dùng logger có level
- Tự copy `parseRequiredUserId` helper — extract vào shared util
- Mirror model duplicate giữa services — chấp nhận vì microservice, nhưng đảm bảo sync khi schema đổi
- Trùng số migration (`012_*`, `019_*`) — dùng số tiếp theo (021+)
