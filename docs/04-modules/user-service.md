# User Service

## Mục đích
- Quản lý thông tin profile của user (sau khi đã auth)
- Cho phép user tự sửa profile của mình, admin sửa của bất kỳ ai
- Reset user (vd reset role/status) — chỉ admin

## File / Folder

| Path | Mô tả |
|------|-------|
| `backend_services/user_service/src/main.ts` | NestJS bootstrap |
| `backend_services/user_service/src/app.module.ts` | Import `DatabaseModule`, `UsersModule` |
| `backend_services/user_service/src/app.controller.ts` | `/` health |
| `backend_services/user_service/src/users/users.module.ts` | Wire controller + service + Sequelize model |
| `backend_services/user_service/src/users/users.controller.ts` | 5 endpoints (xem dưới) |
| `backend_services/user_service/src/users/users.service.ts` | `getUserProfile`, `getUserById`, `getAllUsers`, `updateUserById`, `resetUserById` |
| `backend_services/user_service/src/users/user.model.ts` | Sequelize model bảng `users` (cùng schema với auth_service) |
| `backend_services/user_service/src/users/dto/update-user.dto.ts` | Fields cho phép update (firstName, lastName, ...) |
| `backend_services/user_service/src/users/guards/jwt-auth.guard.ts` | Guard — **HIỆN COMMENT, không enable** (tin tưởng gateway đã verify) |
| `backend_services/user_service/src/database/database.module.ts` | Sequelize bootstrap |
| `backend_services/user_service/src/config/{database,jwt}.config.ts` | Env config |

## Endpoints

`@Controller('users')` → local `/users/*`, qua gateway `/api/users/*`.

| Method | Path | Body / Header | Mô tả |
|--------|------|---------------|-------|
| GET | `/users/profile` | header `x-user-id` | Trả profile của user hiện tại |
| GET | `/users/:id` | (any auth) | Profile user khác (chỉ thông tin public) |
| GET | `/users` | (admin via gateway) | List tất cả user |
| PATCH | `/users/:id` | `UpdateUserDto`, header `x-user-id`, `x-user-role` | Update user. Self-update OK; non-admin sửa user khác → 403 (logic check ở gateway `authorization.middleware.ts`) |
| PATCH | `/users/reset/:id` | (admin via gateway) | Reset user (cụ thể là gì — TODO: xác minh xem có reset password / role hay không) |

## Authorization model
- Gateway đã verify JWT và inject `x-user-id`, `x-user-role` headers
- Controller chỉ đọc header, không tự verify JWT
- Self-update protection: ở `api_gateway/authorization.middleware.ts` lines 36-52 (regex match `/api/users/:id` PATCH, đảm bảo `currentUser.userId === targetId` hoặc role ADMIN)

## Sequelize model `users`

(Xem `backend_services/user_service/src/users/user.model.ts` và `database/migrations/initial_schema.sql` lines 24-35 + migration `019_users_add_avatar_url.js`)

```
users:
  id          INT AUTO_INCREMENT PK
  email       VARCHAR(100) UNIQUE NOT NULL
  password    VARCHAR(255) NOT NULL    (bcrypt hash, không trả về client)
  firstName   VARCHAR(100)
  lastName    VARCHAR(100)
  role        INT FK → roles(id)
  avatar_url  VARCHAR(...)  (thêm sau qua 019)
  createdAt, updatedAt DATETIME
```

## Quirks

- Guard `JwtAuthGuard` được import sẵn nhưng **comment trong controller** — không enforce ở service level. Mọi auth dựa vào gateway.
- Endpoint `GET /users` (list all) thực ra cũng không tự check admin trong controller — chỉ rule ở gateway.
- `UpdateUserDto` (`dto/update-user.dto.ts`) định nghĩa các field được phép update — khi muốn thêm field user tự sửa, sửa file này.

## Dependencies

- Cùng DB `users` table với `auth_service` (cả 2 đều có `user.model.ts`)
- Không gọi service khác qua HTTP

## Cách chạy local

```bash
cd backend_services/user_service
cp .env.example .env  # DB_*, JWT_SECRET
yarn install
yarn start:dev        # port 8002 (default)
```
