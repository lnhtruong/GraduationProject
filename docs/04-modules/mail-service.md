# Mail Service

## Mục đích
- Gửi email transactional qua Nodemailer (SMTP Gmail)
- 3 loại mail: OTP đăng ký / forgot password / custom
- Lưu OTP vào Redis (TTL 5 phút) — service khác (auth_service) có thể đọc để verify

## File / Folder

| Path | Mô tả |
|------|------|
| `backend_services/mail_service/src/server.js` | Entry — Express listen |
| `backend_services/mail_service/src/app.js` | Express app: cors, json, mount routes |
| `backend_services/mail_service/src/configs/mail.config.js` | Nodemailer transporter (SMTP) |
| `backend_services/mail_service/src/configs/redis.config.js` | Redis client (ioredis) |
| `backend_services/mail_service/src/configs/index.js` | Re-export |
| `backend_services/mail_service/src/controllers/mail.controller.js` | 3 endpoints handler |
| `backend_services/mail_service/src/controllers/index.js` | Re-export |
| `backend_services/mail_service/src/routes/mail.route.js` | Router `/mail/*` |
| `backend_services/mail_service/src/routes/index.js` | Re-export |
| `backend_services/mail_service/src/services/mail.service.js` | `sendOTP(email, otp)`, `sendForgotPassword(email, link)`, `sendCustom(email, message)` |
| `backend_services/mail_service/src/services/index.js` | Re-export |
| `backend_services/mail_service/src/templates/mail.template.js` | HTML template cho mỗi loại mail |
| `backend_services/mail_service/src/templates/index.js` | Re-export |
| `backend_services/mail_service/src/utils/otp.util.js` | `generateOTP()` — 6 digit random |
| `backend_services/mail_service/src/utils/index.js` | Re-export |
| `backend_services/mail_service/src/middlewares/validate.middleware.js` | Body validation |
| `backend_services/mail_service/src/middlewares/error.middleware.js` | Global error handler |
| `backend_services/mail_service/src/middlewares/index.js` | Re-export |

## Endpoints

(Service này **không qua api_gateway** — auth_service gọi trực tiếp qua HTTP env `MAIL_SERVICE_URL`)

| Method | Path | Body | Mô tả |
|--------|------|------|------|
| POST | `/mail/send-otp` | `{ email }` | Gen OTP, lưu Redis `MAIL_OTP:<email>` TTL 300s, gửi mail |
| POST | `/mail/send-forgot-password` | `{ email, link }` | Gửi mail reset có link |
| POST | `/mail/send-custom` | `{ email, message }` | Gửi mail tùy chỉnh |

> **TODO: xác minh** — endpoint exact paths nằm trong `routes/mail.route.js`. Tên endpoint có thể khác (vd `/send-otp` không có prefix `/mail`).

## Redis usage

- Key: `MAIL_OTP:<email_lowercased>` (xem `controllers/mail.controller.js` line 11)
- Value: OTP 6 digit
- TTL: 300s (5 phút) — set qua `redis.set(key, otp, 'EX', 300)`

## Dependencies

- SMTP: env `MAIL_HOST` (mặc định `smtp.gmail.com`), `MAIL_PORT` (587), `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- Redis: shared với auth_service (cùng instance) → auth_service đọc OTP từ Redis hoặc gọi lại endpoint verify (TODO: xác minh)

## Pattern

- Module export style: mỗi feature có `index.js` re-export — pattern dùng `require('../services').mailService` để gọi
- `next(err)` truyền error xuống `error.middleware`

## Quirks

- `gmail` thường require **App Password** (không phải password thường) — phải set 2FA + tạo app password riêng
- TTL OTP 5 phút hardcode trong controller, không config qua env
- `package.json` dùng Express 5 (mới) — chú ý syntax khác với Express 4

## Cách chạy local

```bash
cd backend_services/mail_service
cp .env.example .env  # MAIL_USER, MAIL_PASS, MAIL_FROM, REDIS_*
npm install
npm run dev           # nodemon, port 10000 prod / TODO local
```
