
#!/usr/bin/env bash
set -euo pipefail

# Script to start API Gateway and expose it via ngrok

GATEWAY_PORT=8000

echo "Starting deployment via ngrok..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null
then
    echo "ngrok could not be found. Please install it first: https://ngrok.com/download"
    exit 1
fi

echo "Cleaning up existing ngrok sessions..."
killall ngrok 2>/dev/null || true
sleep 1

echo "Step 1: Starting API Gateway and other backend services using PM2..."
# Using npx to run pm2 in case it's not installed globally
PM2_CMD="npx pm2"
if command -v pm2 &> /dev/null; then
  PM2_CMD="pm2"
fi

$PM2_CMD start ecosystem.config.js || $PM2_CMD restart all

echo "Step 2: Starting ngrok for API Gateway (Port $GATEWAY_PORT)..."
# Start ngrok in background
ngrok http $GATEWAY_PORT --log=stdout > /tmp/ngrok_gateway.log &
NGROK_GW_PID=$!

# Wait for ngrok to initialize and fetch the public URL
echo "Waiting for ngrok to generate public URL..."
MAX_RETRIES=10
GATEWAY_URL=""
for ((i=1; i<=MAX_RETRIES; i++)); do
    sleep 2
    GATEWAY_URL=$(node -e "
      const http = require('http');
      http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const tunnel = json.tunnels.find(t => t.config.addr.includes('$GATEWAY_PORT'));
            if (tunnel) console.log(tunnel.public_url);
          } catch (e) {}
        });
      }).on('error', () => {});
    ")
    if [ -n "$GATEWAY_URL" ]; then
        break
    fi
    echo "Retrying ($i/$MAX_RETRIES)..."
done

if [ -z "$GATEWAY_URL" ]; then
    echo "⚠️  Could not automatically fetch ngrok URL from API. Extracting from logs..."
    GATEWAY_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.ngrok-free\.app' /tmp/ngrok_gateway.log | head -n 1 || echo "")
fi

if [ -z "$GATEWAY_URL" ]; then
    echo "❌ Failed to start ngrok or fetch URL. Please check /tmp/ngrok_gateway.log"
    kill $NGROK_GW_PID 2>/dev/null || true
    exit 1
fi

echo "======================================================="
echo "✅ API Gateway Deployment Successful!"
echo "======================================================="
echo "🌍 API Gateway Public URL: $GATEWAY_URL"
echo "🌍 Health Check: $GATEWAY_URL/health"
echo "======================================================="
echo ""
echo "Press Ctrl+C to stop ngrok tunnels and PM2 services."

# Trap Ctrl+C to clean up
cleanup() {
    echo -e "\nStopping ngrok and cleaning up..."
    kill $NGROK_GW_PID 2>/dev/null || true
    # Optional: $PM2_CMD stop all
    exit
}
trap cleanup SIGINT

wait $NGROK_GW_PID