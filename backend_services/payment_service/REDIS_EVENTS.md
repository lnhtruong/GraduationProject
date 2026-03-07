# Redis Event System - Hướng dẫn sử dụng

## 🎯 Tổng quan

Hệ thống sử dụng Redis Pub/Sub để publish webhook events từ Payment Service. Các service khác có thể subscribe to các events này để xử lý logic nghiệp vụ.

## 📢 Các Channel có sẵn

### 1. `payment:webhook`
- **Khi nào được publish:** Khi nhận được webhook từ PayOS
- **Dữ liệu:**
  ```json
  {
    "type": "PAYMENT_WEBHOOK",
    "timestamp": "2024-03-05T10:30:00.000Z",
    "data": {
      "orderCode": 1234567890,
      "amount": 50000,
      "status": "PAID",
      "description": "Thanh toán bằng mã QR",
      ...
    }
  }
  ```

### 2. `payment:success`
- **Khi nào được publish:** Khi webhook xác thực thành công và payment hoàn tất
- **Dữ liệu:**
  ```json
  {
    "type": "PAYMENT_SUCCESS",
    "timestamp": "2024-03-05T10:30:00.000Z",
    "orderCode": 1234567890,
    "data": { ... }
  }
  ```

### 3. `payment:failed`
- **Khi nào được publish:** Khi payment thất bại
- **Dữ liệu:**
  ```json
  {
    "type": "PAYMENT_FAILED",
    "timestamp": "2024-03-05T10:30:00.000Z",
    "orderCode": 1234567890,
    "reason": "Reason for failure"
  }
  ```

## 🔧 Cách sử dụng trong service khác

### Ví dụ: Subscribe to payment success event

```javascript
const { getEventSubscriber } = require("./utils/event.subscriber");

// Khởi động khi app start
const eventSubscriber = getEventSubscriber();

// Subscribe to payment:success channel
eventSubscriber.subscribe("payment:success", (event) => {
  console.log("💰 Payment thành công:", event);
  
  // Xử lý logic của bạn ở đây
  // Ví dụ: Cập nhật database, gửi email, tạo certificate, v.v.
  const { orderCode, data } = event;
  
  // TODO: Implement your business logic
});

// Subscribe to payment:webhook channel
eventSubscriber.subscribe("payment:webhook", (event) => {
  console.log("📢 Webhook nhận được:", event);
  // Xử lý webhook event
});
```

## 🌐 Cấu hình Redis

Đảm bảo `.env` có cấu hình Redis:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password_here  # Optional
```

## 📝 Ví dụ full trong User Service

```javascript
// src/server.js
const app = require('./app');
const { getEventSubscriber } = require('./utils/event.subscriber');

const PORT = process.env.PORT || 3001;

// Khởi động server
const server = app.listen(PORT, () => {
  console.log(`✅ User Service running on port ${PORT}`);
});

// Setup Redis event listeners
const eventSubscriber = getEventSubscriber();

// Khi payment thành công, cập nhật user course
eventSubscriber.subscribe("payment:success", async (event) => {
  try {
    const { orderCode, data } = event;
    console.log(`💰 Cập nhật course cho user từ order: ${orderCode}`);
    
    // Lấy order từ database
    const order = await Order.findOne({ orderCode });
    if (!order) return;
    
    // Cập nhật user courses
    await User.findByIdAndUpdate(order.userId, {
      $push: { courses: order.courseId }
    });
    
    console.log(`✅ Course đã được thêm cho user`);
  } catch (error) {
    console.error("❌ Lỗi cập nhật user course:", error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  eventSubscriber.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
```

## 🚀 Workflow

```
1. Client thanh toán → PayOS
                  ↓
2. PayOS gửi webhook → Payment Service
                  ↓
3. Payment Service xác thực webhook
                  ↓
4. Publish event to Redis:
   - payment:webhook
   - payment:success
                  ↓
5. Các service subscribe to event xử lý logic:
   - User Service: Cấp quyền truy cập khóa học
   - Mail Service: Gửi email xác nhận
   - v.v.
```

## 🔒 Bảo mật

- Webhook được xác thực bằng `payos.webhooks.verify()` trước khi publish
- Chỉ publish data đã xác minh vào Redis
- Redis password có thể được cấu hình qua env

## 📦 Dependencies

Đảm bảo đã cài đặt:
```bash
npm install redis
```

## ⚠️ Lưu ý

- Redis server phải đang chạy
- Service sẽ tự động reconnect nếu Redis bị disconnect
- Event handlers nên là async function để không block
- Xử lý error trong event handler để không làm crash app
