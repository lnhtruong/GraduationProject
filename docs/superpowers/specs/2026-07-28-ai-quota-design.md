# Quota AI theo role — Thiết kế

**Ngày:** 2026-07-28
**Phạm vi:** Giới hạn số lần dùng các tính năng AI chạy trên Colab pool (highlight, mascot, transcribe, quiz AI) theo role người dùng.

## 1. Vấn đề

Bốn tính năng AI đều đẩy job sang một **Colab pool hữu hạn** dùng chung. Hiện không có bất kỳ giới hạn nào theo người dùng: một tài khoản có thể submit job liên tục và làm nghẽn pool của toàn hệ thống. Rate limit hiện có ở gateway chỉ chặn theo IP trên `/api/auth` và `/api/media`, không phủ `/api/mascot_colab/**`.

## 2. Mô hình quota

### 2.1 Credit pool chung

Mỗi người dùng có **một số credit dùng chung mỗi ngày** cho cả 4 tính năng. Mỗi job trừ một lượng credit khác nhau tuỳ độ nặng.

```
cost = baseCost(feature) × durationMultiplier(durationSec)
```

**baseCost theo tính năng:**

| Tính năng | Endpoint | baseCost |
|---|---|---|
| Highlight | `POST /highlight-reel`, `POST /highlight-reel-link` | 1 |
| Transcribe | `POST /transcribe` | 1 |
| Quiz AI | `POST /generate-quiz` | 2 |
| Mascot | `POST /mascot` | 3 |

Mascot đắt nhất vì chạy JoyVASA lip-sync. Quiz AI đắt hơn highlight vì gồm cả Whisper lẫn LLM sinh câu hỏi.

**Hệ số thời lượng:**

| Thời lượng | Hệ số |
|---|---|
| ≤ 5 phút | ×1 |
| ≤ 15 phút | ×2 |
| ≤ 30 phút | ×3 |
| > 30 phút | ×5 |

Ví dụ: highlight video 12 phút = 1 × 2 = **2 credit**; mascot video 12 phút = 3 × 2 = **6 credit**.

Cost tối thiểu luôn là **1 credit**, kể cả khi thiếu `durationSec`.

### 2.2 Hạn mức theo role

Role lấy từ `access-policy.ts`: `ADMIN = 1`, `STUDENT = 2`, `LECTURER = 3`.

| Role | Credit/ngày |
|---|---|
| Guest (không token) | 0 |
| Student (2) | 12 |
| Lecturer (3) | 60 |
| Admin (1) | 200 |

**Guest không cần code.** Access rule `{ method: '*', pattern: '/api/mascot_colab/**', access: 'authenticated' }` khiến guest nhận 401 tại gateway trước khi chạm tới quota.

**Admin vẫn có quota.** Quota ở đây bảo vệ Colab pool — một tài nguyên hữu hạn dùng chung — chứ không chỉ chống người dùng xấu. Một script lỗi của admin vẫn làm nghẽn pool của mọi người. Mức 200 đủ cao để không cản trở vận hành nhưng vẫn giữ một con số hữu hạn để log và cảnh báo. "Không giới hạn" nếu cần phải là override thủ công cho từng tài khoản, không phải mặc định của role.

Nếu request thiếu `x-user-role`, áp hạn mức **Student** (fail-safe, không fail-open).

### 2.3 Chu kỳ reset

Reset lúc **00:00 giờ Việt Nam (UTC+7)** mỗi ngày, thực hiện bằng cách nhúng ngày vào Redis key thay vì chạy cron.

## 3. Kiến trúc

Chặn tại **một điểm duy nhất**: `inference_service`. Đây là cửa ngõ chung của cả 4 tính năng và đã có sẵn ioredis + ConfigService nên không phải thêm hạ tầng.

```
FE → api_gateway (/api/mascot_colab/**, access: authenticated)
       │  x-user-id, x-user-role (đã có sẵn từ index.ts:150-151,
       │  http-proxy-middleware forward mặc định toàn bộ req.headers)
       ▼
   inference_service
       │  QuotaService.reserve(userId, role, feature, durationSec)  → Redis INCRBY
       ▼
   Colab pool
       │  nếu submit lỗi đồng bộ → QuotaService.refund()  → Redis DECRBY
       ▼

course_service ──(gọi thẳng, không qua gateway)──► inference_service /generate-quiz
                  AI_SERVICE_BASE_URL
```

**Không cần sửa `api_gateway`.** Rule `'*'` + `authenticated` cho `/api/mascot_colab/**` đã phủ luôn endpoint `GET /quota` mới.

### 3.1 Redis

```
key:    quota:ai:{userId}:{YYYY-MM-DD}     (ngày theo giờ VN)
value:  tổng credit đã dùng trong ngày
TTL:    48h
```

TTL tự dọn key cũ, không cần cron.

**Thuật toán reserve:**

1. `INCRBY key cost` → `newTotal`
2. Nếu `newTotal > limit` → `DECRBY key cost`, ném `429`
3. Nếu `newTotal === cost` (lần đầu trong ngày) → `EXPIRE key 172800`

`INCRBY` là atomic nên hai request đồng thời không thể cùng vượt hạn mức.

**Refund:** `DECRBY key cost`. Chỉ áp dụng khi submit sang Colab **thất bại đồng bộ** (pool không có worker healthy, ngrok chết, HTTP lỗi) — tức trong cùng vòng đời request, nằm trọn trong `inference_service`. Job đã được Colab nhận rồi mà fail sau đó (bất đồng bộ) thì **không hoàn**, để tránh phải bắc cầu sang webhook ở `media_service` và xử lý idempotency.

**Redis lỗi → fail-open**, ghi log warning và cho request đi qua. Quota là lớp chống lạm dụng, không phải lớp bảo mật; để một Redis blip làm chết tính năng là tệ hơn.

## 4. Cấu hình

Toàn bộ hạn mức và bảng giá nằm trong env, không đụng database.

```
QUOTA_ENABLED=true

QUOTA_DAILY_STUDENT=12
QUOTA_DAILY_LECTURER=60
QUOTA_DAILY_ADMIN=200

QUOTA_COST_HIGHLIGHT=1
QUOTA_COST_TRANSCRIBE=1
QUOTA_COST_QUIZ=2
QUOTA_COST_MASCOT=3

QUOTA_TIER_MINUTES=5,15,30
QUOTA_TIER_MULTIPLIERS=1,2,3,5
QUOTA_MAX_DURATION_SEC=14400
```

`QUOTA_TIER_MULTIPLIERS` có nhiều hơn `QUOTA_TIER_MINUTES` đúng một phần tử — phần tử cuối áp cho mọi thời lượng vượt bậc cuối.

`QUOTA_ENABLED=false` bỏ qua toàn bộ kiểm tra, dùng cho môi trường dev.

## 5. Hợp đồng API

### 5.1 `GET /api/mascot_colab/quota`

Trả về **cả số dư lẫn bảng giá**, để FE tự tính cost mà không hardcode con số nào.

```json
{
  "limit": 12,
  "used": 4,
  "remaining": 8,
  "resetAt": "2026-07-29T00:00:00+07:00",
  "pricing": {
    "base": { "highlight": 1, "transcribe": 1, "quiz": 2, "mascot": 3 },
    "durationTiers": [
      { "maxMinutes": 5,    "multiplier": 1 },
      { "maxMinutes": 15,   "multiplier": 2 },
      { "maxMinutes": 30,   "multiplier": 3 },
      { "maxMinutes": null, "multiplier": 5 }
    ]
  }
}
```

`maxMinutes: null` là bậc cuối (không giới hạn trên).

### 5.2 Vượt hạn mức → `429`

```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Bạn đã dùng hết hạn mức AI hôm nay",
  "quota": {
    "limit": 12,
    "used": 10,
    "remaining": 2,
    "cost": 6,
    "resetAt": "2026-07-29T00:00:00+07:00"
  }
}
```

### 5.3 Trường mới trên request

Cả 5 endpoint tạo job nhận thêm `duration_sec` (số giây, tuỳ chọn):

- `POST /highlight-reel` — form field
- `POST /highlight-reel-link` — JSON field
- `POST /transcribe` — JSON field
- `POST /mascot` — form field
- `POST /generate-quiz` — form field (do `course_service` gửi)

Thiếu `duration_sec` → tính cost ở hệ số ×1 (tối thiểu 1 credit).

## 6. Thay đổi mã nguồn

### 6.1 `inference_service` — module mới `src/quota/`

| File | Trách nhiệm |
|---|---|
| `quota.config.ts` | Đọc và parse env thành object cấu hình (`registerAs('quota', ...)`) |
| `quota.service.ts` | `price()`, `reserve()`, `refund()`, `peek()` |
| `quota.module.ts` | Wiring, export `QuotaService` |

`QuotaService` phụ thuộc `REDIS_CLIENT` (đã là `@Global()` module) và `ConfigService`.

### 6.2 `inference_service` — sửa file có sẵn

**`src/app.service.ts:133` — `pickAndPersist`**

Nhận thêm tham số ngữ cảnh quota:

```ts
private async pickAndPersist(
  pool: ColabPoolService,
  callable: (colabUrl: string) => Promise<unknown>,
  quota: { userId?: number; role?: number; feature: QuotaFeature; durationSec?: number },
): Promise<unknown>
```

Reserve trước `pool.pickHealthy()`, refund trong khối `catch` đã có sẵn. Đây là chỗ duy nhất cần sửa để phủ cả 4 tính năng — cả 5 hàm `createHighlightReel`, `createHighlightReelLink`, `createTranscribe`, `createMascot`, `generateQuiz` đều đi qua nó.

**`src/app.controller.ts`**

- Cả 5 handler tạo job: nhận thêm `@Headers('x-user-role')`, đọc `duration_sec` từ body/form
- `generateQuiz` hiện chưa nhận `x-user-id` → bổ sung
- Thêm handler `GET /quota`

**`src/app.module.ts`** — import `QuotaModule`, load `quotaConfig`.

### 6.3 `course_service`

**`src/quizzes/quizzes.service.ts:361`** — lệnh gọi `/generate-quiz` đi thẳng sang `inference_service`, không qua gateway, nên phải tự gắn ngữ cảnh:

- Thêm header `x-user-id` và `x-user-role` từ `requester.requesterUserId` / `requester.requesterRole`
- Thêm form field `duration_sec`, tính từ `end_time - start_time` khi `timeRange` có giá trị, fallback về `video.duration`

Tính theo đoạn đã chọn là bắt buộc: quiz AI cho phép sinh câu hỏi trên một khoảng của video (`quizzes.service.ts:356`), tính giá theo cả video sẽ khiến lecturer bị trừ oan.

Lỗi `429` từ `inference_service` phải được truyền nguyên vẹn (status + body) lên FE, không bị bọc thành `500`.

### 6.4 `frontend-nextjs`

| Thành phần | Nội dung |
|---|---|
| `useQuota()` | Hook fetch `GET /mascot_colab/quota`, cache qua react-query, invalidate sau khi tạo job thành công |
| `calcCost(feature, durationSec, pricing)` | Util thuần, tính cost từ bảng giá server trả về |
| `<QuotaNotice feature durationSec />` | Component hiển thị "⚡ Sẽ tốn N credit · Bạn còn X/Y credit hôm nay" |
| Badge header | Số dư credit hiện tại, dùng chung `useQuota()` |

Gắn `<QuotaNotice>` tại 3 nơi:

1. `features/upload/index.tsx` — nút tạo Highlight (duration có sẵn từ `useUpload.tsx:174`)
2. `features/editor/components/optionDetails/Mascot.tsx` — nút tạo Mascot
3. `features/instructor/course-management/components/ActivityCreationDialog.tsx` — nút tạo Quiz AI

`/transcribe` và `/highlight-reel` (multipart) hiện **không** được FE gọi ở đâu — backend vẫn chặn để phòng thủ nhưng không cần UI.

**Khi `remaining < cost`:** disable nút Create, `<QuotaNotice>` chuyển sang trạng thái cảnh báo với nội dung "Cần N credit, bạn chỉ còn X. Hạn mức reset lúc 00:00". Việc này ngăn người dùng chờ upload xong mới biết bị từ chối. FE chỉ là lớp trải nghiệm — `429` từ backend mới là chốt chặn thật.

## 7. Tiêu chí nghiệm thu

1. **Unit `calcCost`** — biên thời lượng `0s`, `5:00`, `5:01`, `15:00`, `15:01`, `30:00`, `30:01` ra đúng hệ số; thiếu `durationSec` ra ×1; cost tối thiểu 1
2. **Unit `QuotaService.reserve`** — rollback đúng khi vượt hạn mức; `EXPIRE` được set đúng ở lần gọi đầu trong ngày và không bị reset ở các lần sau; Redis ném lỗi → fail-open (request đi qua, có log warning)
3. **Unit hạn mức theo role** — role 1/2/3 ra đúng limit; thiếu role → áp limit Student
4. **Integration hết quota** — student (limit 12) tạo mascot 12 phút (6 credit): lần 1 và 2 thành công, lần 3 nhận `429` với body đúng schema mục 5.2
5. **Integration refund** — Colab pool không có worker healthy → submit lỗi → `GET /quota` cho thấy `used` không đổi
6. **Integration quiz AI** — `course_service` gửi kèm role và `duration_sec` theo đoạn `start_time`/`end_time`; `429` được truyền nguyên vẹn lên FE
7. **Manual** — nút Create bị disable đúng ở cả 3 màn hình khi không đủ credit; badge header hiện đúng số dư và cập nhật sau khi tạo job

## 8. Rủi ro đã biết

**`duration_sec` do client khai, không thể xác minh.** `inference_service` không có kết nối database (`config/database.config.ts` bị comment toàn bộ) nên không đối chiếu được với bản ghi `videos`. Người dùng sửa request để khai 30 giây cho video 2 tiếng sẽ chỉ bị trừ ×1.

Chốt chặn rẻ tiền, chấp nhận rủi ro còn lại trong phạm vi đồ án:
- Clamp `duration_sec` vào `[0, QUOTA_MAX_DURATION_SEC]` (mặc định 4 giờ)
- Cost tối thiểu 1 credit
- Số lần submit vẫn bị giới hạn dù khai gian, vì mỗi job luôn tốn ít nhất 1 credit

Nếu sau này cần siết, hướng đi là để Colab báo thời lượng thật trong webhook kết quả rồi điều chỉnh hậu kiểm — nằm ngoài phạm vi lần này.

## 9. Ngoài phạm vi

- Bảng cấu hình hạn mức trong database và màn hình admin chỉnh quota (hiện dùng env, sửa thì redeploy)
- Lịch sử sử dụng credit (`ai_usage_logs`) và báo cáo cho admin
- Override hạn mức cho từng tài khoản riêng lẻ
- Hoàn credit khi job fail bất đồng bộ
- Giới hạn số job chạy đồng thời (concurrency)
