# Inference Service

## Mục đích
**Scaffold trống** — NestJS service được tạo nhưng chưa có business logic. Có thể được tạo để chuẩn bị cho:
- Cung cấp endpoint inference AI (gen quiz, gen description...)
- Hoặc dự định gộp với `ai_service`

## File / Folder

| Path | Mô tả |
|------|------|
| `backend_services/inference_service/src/main.ts` | NestJS bootstrap |
| `backend_services/inference_service/src/app.module.ts` | Root module (chỉ có AppController + AppService) |
| `backend_services/inference_service/src/app.controller.ts` | `/` health |
| `backend_services/inference_service/src/app.service.ts` | `getHello()` |
| `backend_services/inference_service/src/app.controller.spec.ts` | Unit test |
| `backend_services/inference_service/src/config/database.config.ts` | DB env (chưa wire vào module) |
| `backend_services/inference_service/README.md` | Note (TODO: kiểm tra) |
| `backend_services/inference_service/package.json` | NestJS deps |
| `backend_services/inference_service/tsconfig.json` | TS config |

## Trạng thái
- Chưa có route business
- Chưa có model
- Không được mount qua `api_gateway` (không có rule trong `access-policy.ts`)
- Chưa được deploy (không có trong `render.yaml`)

## Hành động khi gặp task liên quan
- Hỏi user xem có cần extend service này hay nên đặt logic ở `course_service` / `media_service`
- Nếu user muốn dùng → cần thêm: route file, service business, module wire, DB connection (nếu có), rule trong `api_gateway/access-policy.ts`

## Cách chạy local

```bash
cd backend_services/inference_service
yarn install
yarn start:dev
```
