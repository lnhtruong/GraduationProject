# Inference Service (Colab Pool)

NestJS service đứng làm proxy/orchestrator giữa các microservice nội bộ và
một **pool các Colab worker** (mỗi worker là 1 notebook FastAPI expose qua
ngrok). Service chịu trách nhiệm:

- Đọc env `COLAB_API_URLS` → load nhiều worker.
- Health-check (cache 5s) và round-robin chọn worker trước khi forward request.
- Forward request `POST /highlight-reel`, `POST /highlight-reel-link`,
  `POST /generate-quiz`, `POST /mascot` đến worker đã chọn.
- Khi Colab trả `job_id` (queue async), service ghi mapping `jobId → colabUrl`
  vào **Redis** (TTL mặc định 7 ngày).
- Khi user gọi `GET /jobs/status/:job_id` hoặc `GET /download/:job_id`, service
  tra Redis để route đúng worker từng nhận POST gốc.

## Endpoints

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/` | Health + danh sách endpoint |
| GET | `/pool/status?force=1` | Snapshot health của các worker (debug/ops) |
| POST | `/highlight-reel` | Multipart upload video |
| POST | `/highlight-reel-link` | JSON `{ video_url, ... }` |
| POST | `/generate-quiz` | Form fields, không có file |
| POST | `/mascot` | (legacy) tạo mascot overlay |
| GET | `/jobs/status/:job_id` | Trạng thái job — auto route đúng worker |
| GET | `/download/:job_id` | Stream file kết quả từ worker |

## Setup local

```bash
cd backend_services/inference_service
yarn install
cp .env.example .env   # rồi điền COLAB_API_URLS, REDIS_*
yarn start:dev
```

API Gateway sẽ proxy `/api/mascot_colab/**` → service này (xem
`backend_services/api_gateway/src/config/index.ts` → `mascot_colab.url`,
mặc định `http://localhost:3005`).

## Vận hành Colab worker

1. Chạy `yarn build` ở tất cả service.
2. Mở Git Bash, kéo `deploy_ngrok.sh` ở root project và chạy → copy URL ngrok.
3. (Một lần) tạo QStash URL group trỏ về
   `PUBLIC_NGROK_URL/api/media/webhooks/ai-model/result`.
4. Trong notebook Colab, paste `QSTASH_TOKEN` (cell "tạo file main.py").
5. Run all cell → lấy public URL của Colab.
6. **Thêm URL đó vào `COLAB_API_URLS` (cách nhau bằng dấu phẩy)** trong
   `.env` của service. Nhiều worker → nhiều URL.
7. `cd backend_services/inference_service && yarn build && yarn start`.
8. Restart `deploy_ngrok.sh` (Ctrl+C rồi chạy lại) nếu cần expose lại gateway.

## Scale ngang — thiết kế ngắn

```
Client ──► API Gateway ──► inference_service ──► ColabPoolService
                                │
                                │  pickHealthy()
                                ▼
                       ┌────────┴────────┬────────┐
                       ▼                 ▼        ▼
                   Colab A (ngrok)   Colab B   Colab C
                       │
                       │ trả {job_id}
                       ▼
                  JobRegistryService (Redis)
                  SETEX colab:job:{jobId} → "https://colab-a..."

GET /jobs/status/{jobId}  →  Redis GET colab:job:{jobId}  →  forward đúng Colab
GET /download/{jobId}     →  Redis GET colab:job:{jobId}  →  stream từ đúng Colab
```

## Env tham khảo

Xem `.env.example`.

## Lưu ý

- `COLAB_API_URLS` ưu tiên hơn `COLAB_API_URL`. Khi cả hai trống, mọi request
  inference sẽ trả 503.
- Worker unhealthy không bị xoá khỏi pool; chỉ skip khi pick. Lần probe sau
  sẽ retry tự động.
- Health cache mặc định 5s — đủ thấp để nhận thay đổi nhanh, đủ cao để không
  spam ngrok.
- Job mapping TTL mặc định 7 ngày (`COLAB_JOB_TTL_SECONDS`).
- Có thể chạy nhiều instance inference_service cùng lúc; tất cả share Redis
  nên jobId được route đồng nhất.
