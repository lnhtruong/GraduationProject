# Inference Service (Colab Pool)

## Mục đích
NestJS service làm orchestrator giữa stack microservice nội bộ và một **pool
các Colab notebook** (mỗi notebook chạy FastAPI, expose qua ngrok). Service
chịu trách nhiệm:

- Load list ngrok URL từ env `COLAB_API_URLS`.
- Health-check + round-robin chọn worker mỗi khi có request inference đến.
- Forward request đến worker đã chọn.
- Vì Colab xử lý **async** (trả `job_id` và queue), service lưu mapping
  `jobId → colabUrl` vào **Redis** để route đúng worker khi user poll status
  / download kết quả.

Service được mount qua API Gateway tại prefix `/api/mascot_colab/**` (xem
`backend_services/api_gateway/src/routes/mascot_colab_routes.ts` và
`config/index.ts → services.mascot_colab.url`, mặc định
`http://localhost:3005`).

## File / Folder

| Path | Mô tả |
|------|------|
| `backend_services/inference_service/src/main.ts` | Bootstrap NestJS |
| `backend_services/inference_service/src/app.module.ts` | Wire ConfigModule, HttpModule, RedisModule, ColabModule |
| `backend_services/inference_service/src/app.controller.ts` | Mọi endpoint public (highlight-reel, highlight-reel-link, mascot, generate-quiz, jobs/status, download, pool/status) |
| `backend_services/inference_service/src/app.service.ts` | Logic forward + bind/resolve job mapping |
| `backend_services/inference_service/src/colab/colab.module.ts` | Module xuất ColabPool + JobRegistry |
| `backend_services/inference_service/src/colab/colab-pool.service.ts` | Pool worker, round-robin, health probe + cache |
| `backend_services/inference_service/src/colab/job-registry.service.ts` | Redis SETEX/GET cho mapping `colab:job:{jobId} → colabUrl` |
| `backend_services/inference_service/src/redis/redis.module.ts` | Inject ioredis client (global) |
| `backend_services/inference_service/src/config/colab.config.ts` | Parse `COLAB_API_URLS` (+ fallback `COLAB_API_URL`), timeouts, health path |
| `backend_services/inference_service/src/config/redis.config.ts` | REDIS_HOST/PORT/PASSWORD/DB + `COLAB_JOB_TTL_SECONDS` |
| `backend_services/inference_service/src/app.controller.spec.ts` | Unit test home endpoint |
| `backend_services/inference_service/.env.example` | Mẫu env (multi-URL) |
| `backend_services/inference_service/README.md` | Hướng dẫn vận hành Colab + service |

## Endpoint

| Method | Path | Access (gateway) | Mô tả |
|--------|------|------------------|-------|
| GET | `/api/mascot_colab/` | authenticated | Home + danh sách endpoint |
| GET | `/api/mascot_colab/pool/status` | authenticated | Snapshot health của pool |
| POST | `/api/mascot_colab/highlight-reel` | authenticated | Multipart upload video |
| POST | `/api/mascot_colab/highlight-reel-link` | authenticated | JSON `{video_url, …}` |
| POST | `/api/mascot_colab/generate-quiz` | authenticated | Form fields |
| POST | `/api/mascot_colab/mascot` | authenticated | (legacy) mascot overlay |
| GET | `/api/mascot_colab/jobs/status/:job_id` | authenticated | Auto route theo Redis |
| GET | `/api/mascot_colab/download/:job_id` | authenticated | Stream file kết quả |

Tất cả nằm dưới rule `{ method: '*', pattern: '/api/mascot_colab/**', access: 'authenticated' }` trong `api_gateway/src/middleware/access-policy.ts`.

## Env

| Biến | Mặc định | Ghi chú |
|------|----------|---------|
| `PORT` | `3005` | Khớp với `services.mascot_colab.url` ở gateway |
| `COLAB_API_URLS` | `""` | **Ưu tiên cao nhất** — list URL ngrok cách nhau bằng `,` |
| `COLAB_API_URL` | `""` | Fallback single-URL (legacy) |
| `COLAB_HEALTH_TIMEOUT_MS` | `3000` | Timeout 1 lần probe |
| `COLAB_HEALTH_CACHE_TTL_MS` | `5000` | Cache health in-memory |
| `COLAB_HEALTH_PATH` | `/` | Colab trả JSON ở `GET /` |
| `COLAB_REQUEST_TIMEOUT_MS` | `600000` | Timeout request inference (upload video lớn) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` / `REDIS_DB` | localhost/6379/-/0 | ioredis |
| `COLAB_JOB_TTL_SECONDS` | `604800` | TTL mapping job (7 ngày) |

## Kiến trúc scale ngang

```
Client → API Gateway → inference_service ──► ColabPoolService
                                              │ pickHealthy() (round-robin + cache 5s)
                                              ▼
                          ┌───────────────────┼────────────────────┐
                          ▼                   ▼                    ▼
                   Colab A (ngrok)     Colab B (ngrok)      Colab C (ngrok)

POST /highlight-reel*  →  forward  →  worker trả {job_id}
                                       │
                                       ▼
                                JobRegistryService
                                SETEX colab:job:{jobId} → "<colab_url>"

GET /jobs/status/{jobId}  →  Redis GET → forward đúng worker
GET /download/{jobId}     →  Redis GET → stream từ đúng worker
```

Nhiều instance inference_service đều share Redis, nên một job tạo ra ở
instance X vẫn poll được ở instance Y.

## Health check Colab

Service `GET <colabUrl>/` (có header `ngrok-skip-browser-warning`). Response
dạng `{ service, version, endpoints, features }` được coi là healthy nếu trả
HTTP 2xx. Có thể đổi path qua `COLAB_HEALTH_PATH`.

## Khi sửa thêm endpoint

- Bổ sung handler vào `app.controller.ts` + logic forward ở `app.service.ts`
  (dùng `pickAndPersist` để hệ thống tự bind jobId nếu Colab trả `job_id`).
- Cập nhật `docs/06-api.md` (section Mascot Colab).
- Không cần thêm rule riêng ở gateway nếu vẫn dưới `/api/mascot_colab/**`.

## Cách chạy local

```bash
cd backend_services/inference_service
yarn install
cp .env.example .env   # set COLAB_API_URLS, REDIS_*
yarn start:dev
```

## Trạng thái

- Đã wire vào API Gateway (`/api/mascot_colab/**`).
- Chưa có trong `render.yaml` — deploy production cần thêm Render service +
  Redis (có thể dùng chung Redis với auth_service / payment_service).
- Không có DB riêng; mọi state ngắn hạn nằm trên Redis.
