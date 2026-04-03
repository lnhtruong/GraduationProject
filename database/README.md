# Knex.js migration (baseline đến `006`, áp `007` + `008`)

Repo hiện tại đang có các migration legacy dạng `.sql` ở `database/migrations/`.
File này thêm một layer Knex để:

- Dev chỉ cần chạy một lệnh `migrate` là Knex tự biết script nào đã chạy ở DB (qua bảng `knex_migrations`).
- Dùng “baseline” tại trạng thái sau migration legacy `006`.
- Migration `007` và `008` được làm “idempotent” (nếu cột đã có thì no-op) để an toàn khi DB dev đã chạy thủ công trước đó.

## 1) Cài dependencies Knex

```bash
cd database
yarn install
```

## 2) Đặt biến kết nối MySQL

Trước khi migrate, đảm bảo MySQL đang chạy (ví dụ: `docker-compose up -d` ở root).

Theo `docker-compose.yml`, default MySQL chạy với:

- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER=graduation_user`
- `DB_PASSWORD=graduation_password`
- `DB_NAME=graduation_db`

Nếu bạn dùng `.env`/cấu hình khác thì set các biến tương ứng (không bắt buộc).

PowerShell ví dụ:

```powershell
$env:DB_HOST="127.0.0.1"
$env:DB_PORT="3306"
$env:DB_USER="graduation_user"
$env:DB_PASSWORD="graduation_password"
$env:DB_NAME="graduation_db"
```

## 3) Chạy migration

```bash
cd database
yarn migrate
```

Knex sẽ:

- Tạo bảng `knex_migrations` nếu chưa có.
- Chạy baseline (đến hết `006`).
- Sau đó chạy `007` và `008` nếu DB đang thiếu các thay đổi tương ứng.

## 4) Các lệnh hữu ích

```bash
cd database
# xem migration nào đã áp
yarn migrate:status

# list migration
yarn migrate:list

# rollback 1 bước (chỉ nên dùng khi biết chắc)
yarn migrate:rollback
```
