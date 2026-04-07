# Database schema & Knex migration

## Nguồn schema “đúng bản hiện tại”

- **`initial_schema.sql`**: một file SQL gộp toàn bộ schema hiện tại (tương đương legacy `001`–`008` đã chạy xong). Dùng để dựng DB mới **một phát**.
- **`migrations/*.sql`**: giữ làm tham chiếu lịch sử; **không cần** chạy lần lượt nữa nếu đã dùng `initial_schema.sql` / Knex.

## Knex (theo dõi đã chạy migration nào)

Trong `knex_migrations/` hiện có:

- `001_initial_schema.js` — chạy `initial_schema.sql` khi DB **chưa có** bảng `users` (DB trống / mới clone).

Các thay đổi schema **tiếp theo**: tạo file mới trong `knex_migrations/` (timestamp + mô tả), không sửa `initial_schema.sql` trừ khi lead quyết định “reset mốc gốc”.

### 1) Cài dependency

```bash
cd database
yarn install
```

### 2) MySQL & biến môi trường

Bật MySQL (ví dụ ở root repo: `docker-compose up -d`).

Mặc định giống `docker-compose.yml`:

- `DB_HOST=127.0.0.1`
- `DB_PORT=3306`
- `DB_USER=graduation_user`
- `DB_PASSWORD=graduation_password`
- `DB_NAME=graduation_db`

### 3) Chạy migration

```bash
cd database
yarn migrate
```

### 4) Lệnh khác

```bash
cd database
yarn migrate:status
yarn migrate:list
yarn migrate:rollback
```

## DB mới — không dùng Knex (chỉ import SQL)

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

Lần đầu chạy `yarn migrate`, `001_initial_schema` thấy đã có `users` → không chạy lại `initial_schema.sql` (tránh trùng bảng). Bảng `knex_migrations` vẫn được cập nhật đúng.
```
