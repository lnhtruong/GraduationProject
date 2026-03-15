#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/opt/graduation-project"
BACKEND_ROOT="$APP_ROOT/backend_services"

echo "[1/7] Update package index"
apt update -y

echo "[2/7] Install base packages"
apt install -y curl git build-essential redis-server

echo "[3/7] Install Node.js 20"
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash
  apt install -y nodejs
fi

echo "[4/7] Install Yarn and PM2"
npm install -g yarn pm2

echo "[5/7] Start and enable Redis"
#  systemctl enable redis-server
# sudo systemctl restart redis-server
redis-server --daemonize yes

echo "[6/7] Install dependencies and build services"

build_nest() {
  local dir="$1"
  echo "Building Nest service: $dir"
  cd "$dir"
  yarn install
  yarn build
}

install_node() {
  local dir="$1"
  echo "Installing Node service: $dir"
  cd "$dir"
  if [ -f yarn.lock ]; then
    yarn install
  else
    npm install
  fi
}

build_nest "$BACKEND_ROOT/auth_service"
build_nest "$BACKEND_ROOT/user_service"
# build_nest "$BACKEND_ROOT/edit_session_service"
# build_nest "$BACKEND_ROOT/mascot_video_service"
build_nest "$BACKEND_ROOT/mascot_video_share_service"

# install_node "$BACKEND_ROOT/mail_service"
# install_node "$BACKEND_ROOT/payment_service"

echo "[7/7] Start services with PM2"
cd "$APP_ROOT"
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

pm2 startup systemd -u "$USER" --hp "$HOME" | tail -n 1 | bash || true

echo "Done. Check with: pm2 status"