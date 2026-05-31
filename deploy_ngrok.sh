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

echo "Step 1: Resolving PM2 command..."
# Using npx to run pm2 in case it's not installed globally
PM2_CMD="npx pm2"
if command -v pm2 &> /dev/null; then
  PM2_CMD="pm2"
fi

# --- Build helpers -----------------------------------------------------------
# A service needs rebuilding when its compiled entry is missing, or any file
# under src/ is newer than that entry (i.e. source changed since last build).
needs_build() {
  local out="$1"     # absolute path to compiled entry, e.g. .../dist/main.js
  local srcdir="$2"  # absolute path to .../src
  [ -f "$out" ] || return 0
  [ -d "$srcdir" ] || return 1
  [ -n "$(find "$srcdir" -type f -newer "$out" -print -quit 2>/dev/null)" ]
}

run_build() {
  local dir="$1"
  if [ -f "$dir/yarn.lock" ]; then
    ( cd "$dir" && { [ -d node_modules ] || yarn install --frozen-lockfile || yarn install; } && yarn build )
  else
    ( cd "$dir" && { [ -d node_modules ] || npm install; } && npm run build )
  fi
}

echo "Step 2: Building service dist/ if sources changed..."
# Enumerate apps declared in ecosystem.config.js as: name<TAB>cwd<TAB>script
APPS=$(node -e 'const c=require("./ecosystem.config.js");for(const a of c.apps){process.stdout.write(`${a.name}\t${a.cwd}\t${a.script}\n`)}')
while IFS=$'\t' read -r APP_NAME APP_CWD APP_SCRIPT; do
  [ -z "$APP_NAME" ] && continue
  case "$APP_SCRIPT" in
    dist/*)
      OUT="$APP_CWD/$APP_SCRIPT"
      SRC="$APP_CWD/src"
      if needs_build "$OUT" "$SRC"; then
        echo "  ↻ $APP_NAME: source changed → building..."
        run_build "$APP_CWD"
      else
        echo "  ✓ $APP_NAME: dist up-to-date"
      fi
      ;;
    *)
      echo "  • $APP_NAME: runs $APP_SCRIPT (no build step)"
      ;;
  esac
done <<EOF
$APPS
EOF

echo "Step 3: Starting/reloading backend services with PM2..."
# startOrReload only touches apps declared in ecosystem.config.js — unrelated
# pm2 processes are left alone — and it loads the freshly built dist/.
$PM2_CMD startOrReload ecosystem.config.js --update-env

# Recover anything left in an errored/stopped state: restart once, then report
# whatever is still broken so it doesn't fail silently.
list_broken() {
  $PM2_CMD jlist 2>/dev/null | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{let l=[];try{l=JSON.parse(d)}catch(e){}for(const p of l){const s=p.pm2_env&&p.pm2_env.status;if(s==="errored"||s==="stopped")console.log(p.name)}})'
}
BROKEN=$(list_broken || true)
if [ -n "$BROKEN" ]; then
  echo "Step 3b: Recovering errored/stopped services..."
  while IFS= read -r svc; do
    [ -z "$svc" ] && continue
    echo "  ↻ restarting $svc ..."
    $PM2_CMD restart "$svc" --update-env >/dev/null 2>&1 || true
  done <<< "$BROKEN"
  sleep 2
  STILL=$(list_broken || true)
  if [ -n "$STILL" ]; then
    echo "  ⚠️  Still not running (inspect with: pm2 logs <name>):"
    echo "$STILL" | sed 's/^/      - /'
  else
    echo "  ✓ all services recovered"
  fi
fi

$PM2_CMD save >/dev/null 2>&1 || true

echo "Step 4: Starting ngrok for API Gateway (Port $GATEWAY_PORT)..."
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

# echo "Step 3: Updating Payment Service .env with ngrok URLs..."
# PAYMENT_ENV="backend_services/payment_service/.env"
# if [ -f "$PAYMENT_ENV" ]; then
#     # Thay thế các URL cũ bằng URL ngrok mới
#     # Dùng /api/payment vì đi qua gateway
#     sed -i '' "s|PAYOS_RETURN_URL=.*|PAYOS_RETURN_URL=${GATEWAY_URL}/api/payment/return|g" "$PAYMENT_ENV"
#     sed -i '' "s|PAYOS_CANCEL_URL=.*|PAYOS_CANCEL_URL=${GATEWAY_URL}/api/payment/cancel|g" "$PAYMENT_ENV"
#     # Nếu có biến WEBHOOK_URL thì cập nhật luôn (tùy code backend của bạn)
#     # sed -i '' "s|PAYOS_WEBHOOK_URL=.*|PAYOS_WEBHOOK_URL=${GATEWAY_URL}/api/payment/payos-callback|g" "$PAYMENT_ENV"
    
#     echo "✅ Updated $PAYMENT_ENV with new ngrok URLs."
#     echo "♻️  Restarting payment_service to apply changes..."
#     $PM2_CMD restart payment_service
# fi

echo ""
echo "💡 Nhớ cập nhật các URL sau trong backend_services/payment_service/.env:"
echo "   PAYOS_RETURN_URL=${GATEWAY_URL}/api/payment/return"
echo "   PAYOS_CANCEL_URL=${GATEWAY_URL}/api/payment/cancel"
echo "   PAYOS_WEBHOOK_URL=${GATEWAY_URL}/api/payment/payos-callback"
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
