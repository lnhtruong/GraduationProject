# WebSocket Debugging Guide 🔍

## Current Issue
```
✅ Connected! Socket ID: h1v8d4pwsM4VrZs0AAAB
❌ Error: websocket error
❌ Error: websocket error
❌ Error: websocket error
```

Connection succeeds but WebSocket closes immediately after. Common causes below:

---

## ✅ Step 1: Verify Media Service is Running

```bash
# Check if Media Service is accessible
curl -i http://localhost:3002/health

# Should respond with 200 OK and health status
```

**Expected output:**
```
HTTP/1.1 200 OK
{
  "success": true,
  "message": "..."
}
```

If Media Service is **NOT running**:
```bash
cd backend_services/media_service
yarn install
yarn dev
# Should start on port 3002
```

---

## ✅ Step 2: Rebuild API Gateway with Enhanced Logging

Enhanced logging has been added to show detailed WebSocket errors:

```bash
cd backend_services/api_gateway
yarn build
yarn dev
```

**You'll now see detailed logs like:**
```
[📡 WebSocket Upgrade] { url: '/socket.io/?...' }
[✅ Media WS Proxy Response] { statusCode: 101 }
```

or errors:
```
[❌ Media WS Proxy Error] { 
  message: "...", 
  code: "ECONNREFUSED",
  url: "/socket.io/..."
}
```

---

## ✅ Step 3: Check Media Service Configuration

### Media Service should have Socket.IO setup

**File**: `backend_services/media_service/src/main.ts`

Should include:
```typescript
import { SocketIoAdapter } from '@nestjs/platform-socket.io';

// ...

const app = await NestFactory.create(AppModule);
app.useWebSocketAdapter(new SocketIoAdapter(app));

// Listen on port specified in .env
await app.listen(3002);
```

### Check `.env` files

**API Gateway** (`backend_services/api_gateway/.env`):
```env
PORT=3000
MEDIA_SERVICE_URL=http://localhost:3002  # ← Must match Media Service port
```

**Media Service** (`backend_services/media_service/.env`):
```env
PORT=3002
# Must match MEDIA_SERVICE_URL in API Gateway
```

---

## ✅ Step 4: Browser Console Diagnostics

Run this in browser console (F12 > Console):

```javascript
// 1. Check Socket.IO connection details
console.log('Event count:', socket.listeners('test').length);
console.log('Transport:', socket.io.engine.transport?.name);
console.log('Connected:', socket.connected);
console.log('Handshake:', socket.handshake);

// 2. Listen for ALL socket errors
socket.io.engine.on('error', (err) => {
  console.error('🔴 Engine Error:', err);
});

socket.on('error', (error) => {
  console.error('🔴 Socket Error:', error);
});

// 3. Monitor transport changes
socket.io.engine.on('upgrade', (transport) => {
  console.log('🟢 Upgraded to:', transport.name);
});

socket.on('reconnect_attempt', () => {
  console.log('🔄 Attempting to reconnect...');
});

// 4. Check transport status
console.log('Available transports:', socket.io.engine.upgradeTransports);
console.log('Current transport:', socket.io.engine.transport?.name);
```

---

## 🔧 Common Issues & Fixes

### Issue 1: ECONNREFUSED - Media Service Not Running
```
[❌ Error] code: "ECONNREFUSED"
```
**Fix**: Start Media Service
```bash
cd backend_services/media_service
yarn dev
```

### Issue 2: Wrong URL Configuration
```
[❌ Error] 404 on WebSocket upgrade
```
**Fix**: Check MEDIA_SERVICE_URL in API Gateway config
```typescript
// backend_services/api_gateway/src/config.ts
export const config = {
  services: {
    media: {
      url: 'http://localhost:3002', // ← Verify this is correct
    }
  }
};
```

### Issue 3: WebSocket Transport Not Enabled
```
Connected but no messages received, only polling
```
**Fix**: Check Browser DevTools > Network > Filter by WS
- If you see `/socket.io?transport=websocket` → **Good**
- If you only see `/socket.io?transport=polling` → **Bad**

Enable WebSocket in Socket.IO client:
```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket', 'polling'],  // websocket first
  reconnection: true,
});
```

### Issue 4: CORS/Auth Headers Missing
```
[❌ Error] 401 Unauthorized
```
**Fix**: Check auth middleware not blocking WebSocket
```typescript
// API Gateway should SKIP auth for socket.io
app.use((req, res, next) => {
  if (req.path.startsWith('/socket.io')) {
    return next();  // ← Skip auth
  }
  return authMiddleware(req, res, next);
});
```

---

## 📊 Testing Checklist

- [ ] Media Service running: `curl http://localhost:3002/health`
- [ ] API Gateway running: `curl http://localhost:3000/health`
- [ ] Correct service URLs in config
- [ ] Socket.IO import in Media Service main.ts
- [ ] WebSocket adapter registered in Media Service
- [ ] `/socket.io` route not blocked by auth middleware
- [ ] Browser shows WebSocket transport (DevTools > Network)
- [ ] No CORS errors in browser console
- [ ] All services rebuild after code changes

---

## 📝 Server Logs to Check

### API Gateway Terminal
```bash
[📡 WebSocket Upgrade] { url: '/socket.io/?EIO=4&transport=websocket&...' }
[✅ Media WS Proxy Response] { statusCode: 101 }  # 101 = Switching Protocols ✅
```

### Media Service Terminal
```bash
Nest application successfully started
Listening at http://localhost:3002
[WebSocketGateway] New connection: xxx  # Should see this
```

---

## 🚨 Emergency Debug Mode

If still failing, add this to API Gateway for maximum logging:

```typescript
// At the top of index.ts
console.log('=== SYSTEM CONFIG ===', {
  MEDIA_SERVICE: config.services.media.url,
  API_GATEWAY_PORT: config.port,
  NODE_ENV: process.env.NODE_ENV,
});

// Before server.listen()
server.on('clientError', (err, socket) => {
  console.error('🔴 Client Error:', err);
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.on('error', (err) => {
  console.error('🔴 Server Error:', err);
});
```

---

## Quick Restart All Services

```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Start Media Service
cd backend_services/media_service && yarn dev &

# Start API Gateway
cd backend_services/api_gateway && yarn dev &

# Then test in browser
```

---

Need help? Check:
1. Terminal outputs for `[❌ Error]` messages
2. Browser DevTools > Console for client-side errors
3. Browser DevTools > Network > WS filter for WebSocket connections

Good luck! 🚀
