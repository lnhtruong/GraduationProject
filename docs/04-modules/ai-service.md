# AI Service (CLI tool)

## Mục đích
**Không phải HTTP service** — là CLI script chạy ad-hoc để generate quiz qua OpenAI từ SRT transcript. Logic chính của AI quiz đã được port vào `course_service/src/quizzes/helper/quiz.gen.ts`. File này còn lại như **reference / dev tool** để test prompt OpenAI offline.

## File / Folder

| Path | Mô tả |
|------|------|
| `backend_services/ai_service/index.js` | Entry CLI (`node index.js`) |
| `backend_services/ai_service/quiz.js` | Logic gọi OpenAI gen quiz từ transcript |
| `backend_services/ai_service/package.json` | Chỉ có 2 dependency: `openai`, `dotenv` |
| `backend_services/ai_service/output/quiz_1.json` | Sample output quiz |
| `backend_services/ai_service/output/output_2.json` | Sample output |
| `backend_services/ai_service/output/output_3.json` | Sample output |

## Cách dùng

```bash
cd backend_services/ai_service
npm install
echo "OPENAI_API_KEY=sk-..." > .env
node index.js
```

Output ghi vào `output/*.json`.

## Quirks

- **Không có HTTP endpoint, không listen port** — gọi từ command line
- Không deploy lên Render
- Không integration với DB
- Khi muốn fix prompt quiz generation → sửa cả 2 nơi: `backend_services/ai_service/quiz.js` (CLI) và `backend_services/course_service/src/quizzes/helper/quiz.gen.ts` (runtime)

## TODO

- Xem `index.js` xem có expose endpoint hay không
- Cân nhắc xóa nếu không còn dùng làm dev tool, để tránh nhầm
