# Payment Service (PayOS Integration)

Dịch vụ xử lý thanh toán tích hợp với **PayOS**. Được xây dựng bằng Node.js (CommonJS) với cấu trúc Clean Architecture (Route -> Controller -> Service) sử dụng SDK chính thức `@payos/node`.

## 🚀 Tính năng
- Tạo link thanh toán QR Code qua PayOS.
- Kiểm tra trạng thái đơn hàng.
- Xử lý Webhook (Callback) xác nhận thanh toán thành công (Bảo mật bằng SDK).
- Tự động hủy đơn hàng sau 5 phút nếu chưa thanh toán.

## 🛠 Cài đặt

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env` từ `.env.example` và điền thông tin từ [PayOS Dashboard](https://my.payos.vn/):
   ```env
   PORT=3000
   PAYOS_CLIENT_ID=your_client_id
   PAYOS_API_KEY=your_api_key
   PAYOS_CHECKSUM_KEY=your_checksum_key
   PAYOS_WEBHOOK_URL=https://your-domain.com/payment/payos-callback
   ```

3. **Chạy ứng dụng:**
   ```bash
   npm run dev
   ```

## 📋 Danh sách API (Endpoints)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/payment/create-payment` | Tạo link thanh toán (Body: `{"amount": 2000}`) |
| `GET` | `/payment/order-status/:id` | Kiểm tra trạng thái đơn hàng |
| `POST` | `/payment/payos-callback` | Webhook nhận thông báo từ PayOS |
| `GET` | `/payment/return` | Trang hiển thị khi thanh toán thành công |
| `GET` | `/payment/cancel` | Trang hiển thị khi khách hàng hủy thanh toán |

## 🔗 Hướng dẫn Tích hợp Webhook (Callback)

⚠️ **LƯU Ý QUAN TRỌNG:** Webhook URL **PHẢI** được cấu hình đúng, không thì PayOS sẽ không thể gọi tới endpoint của bạn!

### 🌐 Webhook URL là gì?
- Đó là endpoint `POST /payment/payos-callback` của bạn
- PayOS sẽ gửi dữ liệu thanh toán tới URL này sau khi khách hàng thanh toán
- **Phải là URL công khai** mà PayOS có thể truy cập được

### 📍 Setup Webhook URL

#### **Cho môi trường Production:**
```env
PAYOS_WEBHOOK_URL=https://api.your-domain.com/payment/payos-callback
```

#### **Cho môi trường Local/Development (Sử dụng ngrok):**

**Bước 1:** Cài đặt [ngrok](https://ngrok.com/):
```bash
# macOS
brew install ngrok

# Hoặc download từ https://ngrok.com/download
```

**Bước 2:** Chạy ngrok để expose localhost:3000:
```bash
ngrok http 3000
```

**Output sẽ như:**
```
Session Status                online
Account                       email@example.com
Version                       3.0.0
Region                        us (United States)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abcd-1234.ngrok-free.app -> http://localhost:3000
```

**Bước 3:** Copy URL public (ví dụ: `https://abcd-1234.ngrok-free.app`) vào `.env`:
```env
PAYOS_WEBHOOK_URL=https://abcd-1234.ngrok-free.app/payment/payos-callback
```

**Bước 4:** Chạy payment service:
```bash
npm run dev
```

### 🎯 Đăng ký Webhook trên PayOS Dashboard

1. Truy cập [PayOS Dashboard](https://my.payos.vn/)
2. Tìm mục ** Tổ chức ** -> ** Kênh thanh toán ** -> ** GraduationProject ** -> ** Webhook url **
3. Nhập Webhook URL: `https://abcd-1234.ngrok-free.app/payment/payos-callback`
4. Nhấn **Lưu/Xác nhận**

### 🧪 Test Webhook

**Cách 1: Thực hiện thanh toán thực tế**
1. Gọi `/payment/create-payment` để tạo link
2. Quét QR code và thanh toán
3. PayOS sẽ gọi webhook endpoint của bạn
4. Kiểm tra console/logs: `💵 Đơn hàng ... đã thanh toán thành công!`

**Cách 2: Test bằng cURL (mô phỏng webhook)**
```bash
curl -X POST http://localhost:3000/payment/payos-callback \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": 123456789,
    "amount": 50000,
    "status": "PAID",
    "description": "Test"
  }'
```

### ❌ Troubleshooting Webhook

| Vấn đề | Nguyên nhân | Giải pháp |
|-------|----------|----------|
| Webhook không được gọi | URL không được cấu hình | Đảm bảo `PAYOS_WEBHOOK_URL` có trong `.env` |
| 403 Forbidden | Chữ ký không hợp lệ | Kiểm tra `PAYOS_CHECKSUM_KEY` |
| Connection refused | Local không expose được | Sử dụng ngrok hoặc deploy lên server |
| Endpoint không tìm thấy | Route sai | Kiểm tra route: `POST /payment/payos-callback` |

Webhook dùng để nhận thông báo tự động từ PayOS khi khách hàng thanh toán thành công. Để tích hợp ở môi trường local, hãy làm theo các bước:

### Bước 1: Công khai URL Local (Dùng ngrok)
Vì PayOS không thể gọi trực tiếp vào `localhost`, bạn cần dùng **ngrok**:
```bash
ngrok http 3000
```
Bạn sẽ nhận được một URL public có dạng: `https://abcd-123.ngrok-free.app`

### Bước 2: Đăng ký Webhook trên PayOS Dashboard
1. Truy cập [PayOS Dashboard](https://my.payos.vn/)
2. Tìm mục ** Tổ chức ** -> ** Kênh thanh toán ** -> ** GraduationProject ** -> ** Webhook url **
3. Nhập Webhook URL: `https://abcd-1234.ngrok-free.app/payment/payos-callback`
4. Nhấn **Lưu/Xác nhận**

### Bước 3: Kiểm tra log
Khi thực hiện thanh toán, PayOS sẽ gửi dữ liệu về. App sẽ log ra thông tin webhook. Nếu thanh toán thành công, sẽ log ra thông tin đơn hàng đã thanh toán. 

### Bước 4: Pub / Sub Redis Event
Sau khi nhận được webhook, app sẽ publish event vào Redis. Các service khác có thể subscribe vào event này để xử lý logic nghiệp vụ. Chi tiết có thể xem ở [REDIS_EVENTS.md](REDIS_EVENTS.md).

## 📁 Cấu trúc thư mục
- `src/controllers`: Điều phối HTTP Request/Response.
- `src/services`: Logic nghiệp vụ (Sử dụng SDK `@payos/node`).
- `src/routes/`: Định nghĩa API.
- `src/views/`: Giao diện kết quả thanh toán.
