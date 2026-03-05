# Payment Service (PayOS Integration)

Dịch vụ xử lý thanh toán tích hợp với **PayOS**. Được xây dựng bằng Node.js (CommonJS) với cấu trúc Clean Architecture (Route -> Controller -> Service).

## 🚀 Tính năng
- Tạo link thanh toán QR Code qua PayOS.
- Kiểm tra trạng thái đơn hàng.
- Xử lý Webhook (Callback) xác nhận thanh toán thành công.
- Tự động hủy đơn hàng sau 5 phút nếu chưa thanh toán.

## 🛠 Cài đặt

1. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

2. **Cấu hình môi trường:**
   Tạo file `.env` từ `.env.example` và điền thông tin từ [PayOS Dashboard](https://dashboard.payos.vn/):
   ```env
   PORT=3000
   PAYOS_CLIENT_ID=your_client_id
   PAYOS_API_KEY=your_api_key
   PAYOS_CHECK_SUM=your_checksum_key
   ```

3. **Chạy ứng dụng:**
   ```bash
   # Chế độ development (với nodemon)
   npm run dev

   # Chế độ production
   npm start
   ```

## 📋 Danh sách API (Endpoints)

| Phương thức | Endpoint | Mô tả |
| :--- | :--- | :--- |
| `POST` | `/payment/create-payment` | Tạo link thanh toán (Body: `{"amount": 2000}`) |
| `GET` | `/payment/order-status/:id` | Kiểm tra trạng thái đơn hàng |
| `POST` | `/payment/payos-callback` | Webhook nhận thông báo từ PayOS |
| `GET` | `/payment/return` | Trang hiển thị khi thanh toán thành công |
| `GET` | `/payment/cancel` | Trang hiển thị khi khách hàng hủy thanh toán |

## 🧪 Cách kiểm tra (Testing)

1. **Tạo link thanh toán:**
   Sử dụng cURL hoặc Postman:
   ```bash
   curl -X POST http://localhost:3000/payment/create-payment \
        -H "Content-Type: application/json" \
        -d '{"amount": 5000}'
   ```
   Copy `checkoutUrl` nhận được và dán vào trình duyệt để thanh toán.

2. **Test Webhook (Local):**
   Sử dụng **ngrok** để nhận callback từ PayOS về máy local:
   ```bash
   ngrok http 3000
   ```
   Sau đó copy URL ngrok dán vào cấu hình Webhook trên PayOS Dashboard (ví dụ: `https://abc.ngrok.io/payment/payos-callback`).

## 📁 Cấu trúc thư mục
- `src/controllers`: Xử lý HTTP Request/Response.
- `src/services`: Chứa logic nghiệp vụ và gọi API PayOS.
- `src/routes/`: Định nghĩa các luồng API.
- `src/utils/`: Các hàm bổ trợ (tạo chữ ký, xác thực).
- `src/views/`: Giao diện HTML đơn giản cho kết quả thanh toán.
