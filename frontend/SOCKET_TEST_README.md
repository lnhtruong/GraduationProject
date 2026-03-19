# Socket.IO Test Guide 🧪

Hướng dẫn kiểm tra kết nối Socket.IO qua browser console

## Option 1: Visual Test Page (Recommended)

### Cách sử dụng:

1. **Mở file test** - Mở `socket-test.html` trong browser:
   ```
   file:///e:/HCMUS/Do_An_Tot_Nghiep/source/GraduationProject/frontend/socket-test.html
   ```
   Hoặc nếu frontend đang chạy, trỏ đến:
   ```
   http://localhost:5173/socket-test.html
   ```

2. **Nhập Server URL** (nếu chưa auto-detect):
   - Localhost: `http://localhost:3000`
   - Ngrok: `https://your-ngrok-url.ngrok.io`

3. **Nhập Token** (nếu API yêu cầu authentication):
   - Paste JWT token hoặc Bearer token

4. **Click "Connect"** - Kết nối đến server

5. **Gửi test message**:
   - Nhập message trong input field
   - Click "Send" hoặc nhấn Enter

6. **Xem logs** - Toàn bộ events được log ở phần Logs

---

## Option 2: Browser Console Script

### Cách sử dụng:

1. **Mở Browser DevTools**:
   - Bấm `F12` hoặc `Ctrl+Shift+I` (Mac: `Cmd+Option+I`)
   - Chọn tab "Console"

2. **Copy script từ `SOCKET_TEST_CONSOLE.js`** - Copy toàn bộ nội dung

3. **Paste vào Console** - Dán toàn bộ script vào console

4. **Sử dụng commands**:

   ```javascript
   // Gửi test message
   socketTest.send("Hello World")
   
   // Gửi custom event
   socketTest.emit("test", { name: "John", action: "login" })
   
   // Kiểm tra trạng thái
   socketTest.status()
   
   // Ngắt kết nối
   socketTest.disconnect()
   
   // Kết nối lại
   socketTest.reconnect()
   ```

---

## Kiểm tra Server Configuration

Để Socket.IO hoạt động, đảm bảo API Gateway được cấu hình đúng:

### ✅ Required trong `api_gateway/src/index.ts`:

```typescript
// Import Socket.IO middleware
import { createProxyMiddleware } from 'http-proxy-middleware';
import httpProxy from 'http-proxy';

// Proxy Socket.IO requests
app.use('/socket.io', mediaWebSocketProxy);

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  wsProxy.ws(req, socket, head);
});
```

### ✅ Chạy API Gateway:

```bash
cd backend_services/api_gateway
yarn install
yarn dev
# Server sẽ chạy trên http://localhost:3000
```

---

## Common Issues & Solutions

### ❌ "Connection refused"
- Kiểm tra API Gateway đang chạy: `http://localhost:3000/health`
- Kiểm tra port đúng trong Browser DevTools > Network

### ❌ "CORS error"
- API Gateway đã setup CORS cho Socket.IO? 
- Kiểm tra `cors` config trong `index.ts`

### ❌ "Cannot GET /socket.io"
- Socket.IO route chưa được proxy
- Kiểm tra `app.use('/socket.io', mediaWebSocketProxy)` có tồn tại

### ❌ "401 Unauthorized"
- Token hết hạn, cần cấp token mới
- Hoặc endpoint yêu cầu authentication nhưng không có token

### ✅ "Connected! Socket ID: ..."
- Kết nối thành công! 🎉

---

## Event Monitoring

Khi connected, tất cả events sẽ được log:

```
✅ Connected! Socket ID: xxxxx
📨 Event "test": [{ message: "Hello" }]
📨 Event "response": [{ status: "ok" }]
```

---

## Testing with curl (WebSocket)

Có thể test WebSocket bằng `curl` nếu không dùng browser:

```bash
curl --include \
  --no-buffer \
  --header "Connection: Upgrade" \
  --header "Upgrade: websocket" \
  --header "Sec-WebSocket-Version: 13" \
  --header "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  http://localhost:3000/socket.io/?transport=websocket
```

---

## Networking Debugging

Để xem chi tiết kết nối WebSocket:

1. Mở **DevTools > Network**
2. Click Connect
3. Tìm request `/socket.io`
4. Click vào request > **Messages** tab
5. Xem tất cả data được gửi/nhận

---

**Tác giả**: Socket.IO Test Suite  
**Cập nhật**: 2026-03-19
