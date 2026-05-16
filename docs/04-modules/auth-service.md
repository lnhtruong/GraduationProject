# Auth Service

## Mục đích
- Authentication: register, login, refresh, logout
- JWT issue + validate
- Forgot password + OTP flow (phối hợp với mail_service)
- Internal `issue-token` cho admin (impersonation hoặc service-to-service)

## File / Folder

| Path | Mô tả |
|------|-------|
| `backend_services/auth_service/src/main.ts` | NestJS bootstrap, `cookie-parser`, CORS, listen port |
| `backend_services/auth_service/src/app.module.ts` | Root: import `DatabaseModule`, `AuthModule`, configs |
| `backend_services/auth_service/src/app.controller.ts` | `/` health endpoint |
| `backend_services/auth_service/src/auth/auth.module.ts` | Wire controller + service + JWT module |
| `backend_services/auth_service/src/auth/auth.controller.ts` | 8 endpoints (xem bảng dưới) |
| `backend_services/auth_service/src/auth/auth.service.ts` | Business logic: hash bcrypt, query user, tạo JWT, gọi mail_service |
| `backend_services/auth_service/src/auth/auth.service.spec.ts` | Unit test service |
| `backend_services/auth_service/src/auth/auth.controller.spec.ts` | Unit test controller |
| `backend_services/auth_service/src/auth/constants/cookie.constant.ts` | `COOKIE_CONFIG` — tên cookie refresh token + options (HttpOnly, SameSite, MaxAge) |
| `backend_services/auth_service/src/auth/jwt/jwt.module.ts` | Custom JWT module (wrap `@nestjs/jwt`) |
| `backend_services/auth_service/src/auth/jwt/jwt.service.ts` | Sign / verify token |
| `backend_services/auth_service/src/auth/jwt/jwt.guard.ts` | `JwtAuthGuard` — decode token từ header, set `req.user` |
| `backend_services/auth_service/src/auth/jwt/jwt.guard.spec.ts` | Unit test guard |
| `backend_services/auth_service/src/auth/logger/logger.middleware.ts` | Log request middleware |
| `backend_services/auth_service/src/auth/dto/login.dto.ts` | `{ email, password }` |
| `backend_services/auth_service/src/auth/dto/register.dto.ts` | `{ email, password, firstName, lastName, otp? }` |
| `backend_services/auth_service/src/auth/dto/refresh-token.dto.ts` | `{ refreshToken }` (legacy — hiện cookie-based) |
| `backend_services/auth_service/src/auth/dto/validate-token.dto.ts` | DTO cho `/validate` |
| `backend_services/auth_service/src/auth/dto/forgot-password.dto.ts` | `{ email }` |
| `backend_services/auth_service/src/auth/dto/check-otp.dto.ts` | `{ email, otp, newPassword }` |
| `backend_services/auth_service/src/redis/redis.module.ts` | ioredis module |
| `backend_services/auth_service/src/redis/redis.service.ts` | Wrapper get/set/del — cache refresh token, blacklist |
| `backend_services/auth_service/src/users/users.module.ts` | Wire User model |
| `backend_services/auth_service/src/users/user.model.ts` | Sequelize model bảng `users` |
| `backend_services/auth_service/src/database/database.module.ts` | `SequelizeModule.forRootAsync` từ env |
| `backend_services/auth_service/src/config/database.config.ts` | DB config (`DB_HOST/PORT/USER/PASSWORD/DATABASE`) |
| `backend_services/auth_service/src/config/jwt.config.ts` | `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN` (15m), `JWT_REFRESH_EXPIRES_IN` (7d) |
| `backend_services/auth_service/src/config/redis.config.ts` | Redis host/port/password/db/ttl |

## Endpoints

`@Controller('auth')` → đứng sau gateway, prefix path local là `/auth/*`. Qua gateway sẽ là `/api/auth/*`.

| Method | Path | Body / Header | Guard | Mô tả |
|--------|------|---------------|-------|-------|
| POST | `/auth/register` | `RegisterDto` | none | Hash bcrypt, insert `users`, return user (no token) |
| POST | `/auth/login` | `LoginDto` | none | Verify password, issue access+refresh, set refresh cookie, return `{ user, accessToken }` |
| POST | `/auth/refresh` | (refresh cookie) | none (đọc cookie) | Verify refresh, issue access mới |
| POST | `/auth/logout` | (Authorization Bearer) | `JwtAuthGuard` | Clear cookie + del refresh token Redis |
| POST | `/auth/validate` | `ValidateTokenDto` | `JwtAuthGuard` | Validate credential (used cho service-to-service?) |
| POST | `/auth/issue-token` | `{ userId, email, role }` | none (qua gateway kiểm ADMIN) | Tạo token cho user cho trước — **admin only** |
| POST | `/auth/forgot-password` | `ForgotPasswordDto` | none | Gọi mail_service gửi OTP qua email |
| POST | `/auth/check-otp` | `CheckOtpDto` | none | Verify OTP, reset password |

## JWT payload

```ts
{
  userId: number,
  email: string,
  role: number,   // 1=ADMIN, 2=STUDENT, 3=LECTURER
  iat: number,
  exp: number
}
```

Secret và TTL config trong `config/jwt.config.ts`. **Bắt buộc cùng `JWT_SECRET` với api_gateway** để gateway verify được.

## Cookie strategy

`backend_services/auth_service/src/auth/constants/cookie.constant.ts`:
- Name: `refreshToken` (— TODO: xác minh tên chính xác)
- Options: `httpOnly: true`, `secure: production`, `sameSite: 'lax'` hoặc `'none'` (cross-origin)
- MaxAge: 7d

## Redis usage

- Key pattern: `refresh:<userId>` → store refresh token hiện tại
- Khi logout: `DEL refresh:<userId>`
- Khi refresh: verify token + check redis còn tồn tại

## Dependencies sang module khác

- **`mail_service`** (qua HTTP, env `MAIL_SERVICE_URL`): gửi OTP, gửi forgot password
- **DB `users` table**: shared với `user_service`
- **JWT secret**: shared với `api_gateway`

## Quirks

- `register` không trả token — user phải gọi `login` riêng sau khi register
- `issue-token` không có guard ở service level — bảo vệ bằng rule ở `api_gateway/access-policy.ts` (`roles: [ADMIN]`)
- Có 2 comment trùng `//jwtauthguard chạy trước...` trong `auth.controller.ts` lines 22-24
- Có `console.log('check2')` trong `register` — debug residue
- Forgot-password OTP storage thực ra do `mail_service` quản lý (Redis key `MAIL_OTP:<email>`). Khi check OTP, `auth_service` phải gọi sang mail_service hoặc đọc trực tiếp Redis chung — **TODO: xác minh** trong `auth.service.ts.checkOtpAndResetPassword()`

## Cách chạy local

```bash
cd backend_services/auth_service
cp .env.example .env  # set DB_*, REDIS_*, JWT_SECRET, MAIL_SERVICE_URL
yarn install
yarn start:dev        # nest start --watch, port 8001 (mặc định)
```

## Test

```bash
yarn test          # unit tests (jest)
yarn test:cov      # với coverage
yarn test:e2e      # e2e
```
