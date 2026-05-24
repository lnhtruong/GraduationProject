#!/usr/bin/env bash
# Deploy backend microservices lên VPS (KVM).
# API Gateway chạy trên Render (HTTPS) — xem backend_services/api_gateway/.env.deploy
#
# Port map trên VPS:
#   8001 auth | 8002 user | 8003 media | 8006 payment | 8007 inference
#   8008 course | 8009 mail
#   6379 redis local only, không mở public
set -euo pipefail

APP_ROOT="/opt/graduation-project"
BACKEND_ROOT="$APP_ROOT/backend_services"

VPS_SERVICES=(
  auth_service
  user_service
  media_service
  payment_service
  inference_service
  course_service
  mail_service
)

NEST_SERVICES=(
  auth_service
  user_service
  media_service
  inference_service
  course_service
)

NODE_SERVICES=(
  payment_service
  mail_service
)

echo "[1/8] Update package index"
apt update -y

echo "[2/8] Install base packages"
apt install -y curl git build-essential redis-server

echo "[3/8] Install Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash
  apt install -y nodejs
fi

echo "[4/8] Install Yarn and PM2"
npm install -g yarn pm2

echo "[5/8] Start and enable Redis"
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  systemctl enable redis-server
  systemctl restart redis-server
else
  redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes
fi

echo "[6/8] Apply .env.deploy → .env cho từng service VPS"
for svc in "${VPS_SERVICES[@]}"; do
  dir="$BACKEND_ROOT/$svc"
  if [ -f "$dir/.env.deploy" ]; then
    cp "$dir/.env.deploy" "$dir/.env"
    echo "  env: $svc"
  else
    echo "  WARN: missing $dir/.env.deploy"
  fi
done

echo "[7/8] Install dependencies and build services"
build_nest() {
  local dir="$1"
  echo "Building Nest service: $dir"
  cd "$dir"
  yarn install --frozen-lockfile 2>/dev/null || yarn install
  yarn build
}

install_node() {
  local dir="$1"
  echo "Installing Node service: $dir"
  cd "$dir"
  if [ -f yarn.lock ]; then
    yarn install --frozen-lockfile 2>/dev/null || yarn install
  else
    npm ci 2>/dev/null || npm install
  fi
}

for svc in "${NEST_SERVICES[@]}"; do
  build_nest "$BACKEND_ROOT/$svc"
done

for svc in "${NODE_SERVICES[@]}"; do
  install_node "$BACKEND_ROOT/$svc"
done

echo "[8/8] Start VPS services with PM2 (không gồm api_gateway — chạy trên Render)"
cd "$APP_ROOT"
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 | bash || true

echo ""
echo "Done. Kiểm tra: pm2 status"
echo "Nhớ:"
echo "  1) Sửa __VPS_PUBLIC_IP__ trong api_gateway/.env.deploy (Render)"
echo "  2) Mở firewall VPS: 8001-8003,8006-8009 (chỉ cho IP Render hoặc 0.0.0.0 nếu cần)"
echo "  3) Điền secret thật trong .env.deploy (mail, payos, cloudinary, colab, openai...)"
