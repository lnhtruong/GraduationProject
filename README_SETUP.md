# Setup Guide - Microservices Architecture

## Tổng quan

Dự án bao gồm 3 microservices:

1. **auth_service** (Port 3001) - Xử lý authentication
2. **user_service** (Port 3002) - Quản lý thông tin user
3. **api_gateway** (Port 3000) - Gateway routing và middleware

## Yêu cầu

- Node.js >= 18
- Docker & Docker Compose
- Yarn hoặc npm

## Bước 1: Khởi động Database và Redis

```bash
cd GraduationProject
docker-compose up -d
```

Kiểm tra containers đang chạy:

```bash
docker ps
```

## Bước 2: Tạo Database Schema

Kết nối vào MySQL container và chạy migration:

```bash
docker exec -it graduation_mysql mysql -u graduation_user -pgraduation_password graduation_db
```

Hoặc copy file SQL và chạy:

```bash
docker exec -i graduation_mysql mysql -u graduation_user -pgraduation_password graduation_db < database/migrations/001_create_users_table.sql
```

## Bước 3: Setup Auth Service

```bash
cd backend_services/auth_service
cp .env.example .env
# Chỉnh sửa .env nếu cần
yarn install
yarn start:dev
```

## Bước 4: Setup User Service

```bash
cd backend_services/user_service
cp .env.example .env
# Chỉnh sửa .env nếu cần
yarn install
yarn start:dev
```

## Bước 5: Setup API Gateway

```bash
cd backend_services/api_gateway
cp .env.example .env
# Chỉnh sửa .env nếu cần
npm install
npm run dev
```

## API Endpoints

### Auth Service (qua Gateway: http://localhost:3000/api/auth)

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Đăng xuất (cần Bearer token)
- `POST /api/auth/validate` - Validate token
- `POST /api/auth/issue-token` - Issue token (internal)

### User Service (qua Gateway: http://localhost:3000/api/users)

- `GET /api/users/profile` - Lấy thông tin profile (cần Bearer token)
- `GET /api/users/:id` - Lấy thông tin user theo ID (cần Bearer token)

## Test Flow

1. **Register:**

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Login:**

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

3. **Get Profile (sử dụng accessToken từ login):**

```bash
curl -X GET http://localhost:8000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

4. **Refresh Token:**

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Cấu trúc Database

### Users Table

- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `email` (VARCHAR(100), UNIQUE)
- `password` (VARCHAR(255), hashed)
- `firstName` (VARCHAR(100))
- `lastName` (VARCHAR(100))
- `role` (INT)
- `createdAt` (DATETIME)
- `updatedAt` (DATETIME)

## Redis

Refresh tokens được lưu trong Redis với key format: `refresh_token:{userId}`
TTL mặc định: 7 ngày (604800 giây)

## Environment Variables

Đảm bảo tất cả các services sử dụng cùng `JWT_SECRET` để verify tokens.

## Troubleshooting

1. **Database connection error:** Kiểm tra Docker containers đang chạy
2. **Redis connection error:** Kiểm tra Redis container
3. **JWT verification failed:** Đảm bảo tất cả services dùng cùng JWT_SECRET
4. **Port already in use:** Thay đổi PORT trong .env files
