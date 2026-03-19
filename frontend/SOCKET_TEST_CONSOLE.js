// ==============================================================
// Socket.IO Test Script - Paste this into Browser Console
// ==============================================================

// Configuration
const BASE_URL = window.location.origin; // or specify: 'http://localhost:3000'
const NAMESPACE = '/media';
const SOCKET_PATH = '/socket.io';
const TOKEN = ''; // Set your token here if needed

// Initialize Socket.IO
const socket = io(`${BASE_URL}${NAMESPACE}`, {
  path: SOCKET_PATH,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  transports: ['websocket'],
  query: { userId: '1' },
  auth: TOKEN ? { token: TOKEN } : undefined
});

// Connection Events
socket.on('connect', () => {
  console.log('✅ Connected! Socket ID:', socket.id);
  console.log('📊 Connected to:', `${BASE_URL}${NAMESPACE}`);
  socket.emit('ping');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection Error:', {
    message: error.message,
    description: error.description,
    context: error.context,
  });
});

socket.on('pong', () => {
  console.log('🏓 Received pong from media namespace');
});

// Listen for all incoming events
socket.onAny((event, ...args) => {
  console.log(`📨 Event "${event}":`, args);
});

// Utility Functions
window.socketTest = {
  // Send ping payload to server
  send: (message) => {
    socket.emit('ping', {
      message,
      timestamp: new Date().toISOString() 
    });
    console.log(`📤 Sent ping payload "${message}"`);
  },

  // Send raw event
  emit: (event, data) => {
    socket.emit(event, data);
    console.log(`📤 Emitted "${event}":`, data);
  },

  // Disconnect
  disconnect: () => {
    socket.disconnect();
    console.log('🔌 Disconnected');
  },

  // Reconnect
  reconnect: () => {
    socket.connect();
    console.log('🔄 Attempting to reconnect...');
  },

  // Show status
  status: () => {
    console.log({
      connected: socket.connected,
      socketId: socket.id,
      url: `${BASE_URL}${NAMESPACE}`,
      path: SOCKET_PATH,
      handshakeQuery: socket.io.opts.query
    });
  }
};

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log('🧪 Socket.IO Test Ready!');
console.log('═══════════════════════════════════════════════════════');
console.log('');
console.log('Available commands:');
console.log('  socketTest.send("message")     - Send ping payload');
console.log('  socketTest.emit("event", data) - Send custom event');
console.log('  socketTest.status()            - Show connection status');
console.log('  socketTest.disconnect()        - Disconnect socket');
console.log('  socketTest.reconnect()         - Reconnect socket');
console.log('');
console.log('Examples:');
console.log('  socketTest.send("Hello World")');
console.log('  socketTest.emit("ping", {hello: "media"})');
console.log('  socketTest.status()');
console.log('');
