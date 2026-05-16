# Payment Service

## Mục đích
- Tích hợp PayOS (cổng thanh toán VN)
- Tạo payment link cho cart hoặc buy-now
- Xử lý webhook PayOS
- Publish Redis events cho service khác (cấp enroll, gửi mail)
- Lưu transactions + items

## File / Folder

| Path | Mô tả |
|------|------|
| `backend_services/payment_service/src/server.js` | Entry — start Express + init Redis subscriber |
| `backend_services/payment_service/src/app.js` | Express app: cors, json, mount routes, error middleware |
| `backend_services/payment_service/src/configs/db.config.js` | Sequelize JS instance |
| `backend_services/payment_service/src/configs/redis.config.js` | Redis client (node-redis v4) |
| `backend_services/payment_service/src/configs/index.js` | Re-export |
| `backend_services/payment_service/src/models/index.js` | Define associations giữa Transaction ↔ TransactionItem ↔ Course |
| `backend_services/payment_service/src/models/transaction.model.js` | `transactions` table |
| `backend_services/payment_service/src/models/transaction_item.model.js` | `transaction_items` (1 transaction nhiều course) |
| `backend_services/payment_service/src/models/course.model.js` | Read-only mirror `courses` để lookup giá |
| `backend_services/payment_service/src/controllers/payment.controller.js` | 6 controller function |
| `backend_services/payment_service/src/routes/payment.route.js` | Mount router `/payment/*` (qua gateway: `/api/payment/*`) |
| `backend_services/payment_service/src/routes/index.js` | Re-export |
| `backend_services/payment_service/src/services/payment.service.js` | PayOS SDK calls, DB write, publish events |
| `backend_services/payment_service/src/services/event.publisher.js` | `getEventPublisher()` — publish to Redis channels |
| `backend_services/payment_service/src/services/index.js` | Re-export |
| `backend_services/payment_service/src/utils/event.subscriber.js` | `getEventSubscriber()` — **reusable** generic Redis subscriber (service khác copy file này để subscribe) |
| `backend_services/payment_service/src/utils/index.js` | Re-export |
| `backend_services/payment_service/src/middlewares/error.middleware.js` | Global error handler |
| `backend_services/payment_service/src/middlewares/index.js` | Re-export |
| `backend_services/payment_service/src/views/payment_success.html` | Trang return sau payment thành công (`/payment/return`) |
| `backend_services/payment_service/src/views/payment_cancel.html` | Trang cancel (`/payment/cancel`) |
| `backend_services/payment_service/REDIS_EVENTS.md` | **Tài liệu pub/sub** — đọc khi cần subscribe payment events |

## Endpoints

| Method | Path | Body / Header | Mô tả |
|--------|------|---------------|------|
| POST | `/payment/create-payment` | `{ courseIds: number[] }`, header `x-user-id` | Tạo PayOS order cho nhiều course (cart checkout). Return `{ paymentLink, orderCode, ... }` |
| POST | `/payment/buy-now` | `{ courseId: number }`, header `x-user-id` | Mua 1 course không qua cart |
| GET | `/payment/transactions` | header `x-user-id` | List transactions của user |
| GET | `/payment/transactions/:id` | header `x-user-id` | Detail (ownership check) |
| GET | `/payment/order-status/:orderCode` | public | Poll status PayOS |
| POST | `/payment/payos-callback` | (PayOS signature) | **Webhook** — verify HMAC, publish Redis event |
| GET | `/payment/return` | public | Render HTML success page |
| GET | `/payment/cancel` | public | Render HTML cancel page |

## Redis events (xem `REDIS_EVENTS.md`)

Publish khi webhook tới:

| Channel | Khi nào | Payload |
|---------|---------|--------|
| `payment:webhook` | Mọi webhook nhận từ PayOS (đã verify) | `{ type: 'PAYMENT_WEBHOOK', timestamp, data }` |
| `payment:success` | Webhook xác nhận payment thành công | `{ type: 'PAYMENT_SUCCESS', timestamp, orderCode, data }` |
| `payment:failed` | Payment fail | `{ type: 'PAYMENT_FAILED', timestamp, orderCode, reason }` |

Service khác consume bằng cách copy `utils/event.subscriber.js` vào project rồi `eventSubscriber.subscribe('payment:success', handler)`.

> **TODO: xác minh** — hiện tại service nào đang thực sự consume? Trong codebase chỉ thấy `course_service` cần cấp enroll, nhưng `course_service/src/` không có code subscribe Redis pubsub.

## DB tables

(Xem `database/migrations/transaction_tables.sql` + migration `004_transaction_tables.js`)

```
transactions:
  id           INT PK
  user_id      INT
  order_code   BIGINT UNIQUE   (PayOS orderCode)
  amount       INT
  status       ENUM('pending', 'paid', 'cancelled', 'failed')
  payment_link TEXT
  created_at, updated_at

transaction_items:
  id              INT PK
  transaction_id  INT FK
  course_id       INT FK
  price           INT  (snapshot giá tại thời điểm mua)
```

## Pattern

- Express middleware-style, **không** dùng class controller (khác với NestJS services)
- Async function controller → đọc body/params/headers → call service → return JSON
- Error: throw từ service với `.status` field, controller catch và respond

## Quirks

- `package.json` script `start` = `node src/server.js`, `dev` = `nodemon src/server.js`
- PayOS dùng `@payos/node` SDK v2 — wrap trong `payment.service.js`
- Webhook verify dùng `payos.webhooks.verify()` — không thủ công HMAC
- File `event.subscriber.js` được thiết kế **standalone** — copy-paste vào service khác là dùng được
- Đường dẫn return URL config qua env `PAYOS_RETURN_URL` (thường là `/payment/return` của chính service này)

## Dependencies

- PayOS: env `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_WEBHOOK_URL`, `PAYOS_CANCEL_URL`, `PAYOS_RETURN_URL`
- Redis: `REDIS_HOST`, `REDIS_PORT`, optional `REDIS_PASSWORD`
- DB: `DB_*` (cùng MySQL với các service khác)

## Cách chạy local

```bash
cd backend_services/payment_service
cp .env.example .env  # PayOS keys, DB, Redis
npm install
npm run dev           # nodemon, port 8006 (default)
```

## Lưu ý sửa đổi
- Khi thêm cột vào `transactions` → migration mới ở `database/knex_migrations/`
- Khi thêm event channel mới → cập nhật `REDIS_EVENTS.md` đồng thời
- Khi thay PayOS bằng cổng khác → chỉ cần refactor `services/payment.service.js`, các controller giữ nguyên
