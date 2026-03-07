#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Setting up API Stack (FastAPI + venv)"
echo "=========================================="

# Step 1: Install python3.10-venv + build deps + ffmpeg dev
echo ""
echo "📦 Step 1/4: Installing python3.10-venv + build tools + FFmpeg dev..."
apt-get update -qq
apt-get install -y python3.10-venv pkg-config libavformat-dev libavcodec-dev \
  libavdevice-dev libavutil-dev libavfilter-dev libswscale-dev libswresample-dev > /dev/null 2>&1
echo "✓ Build tools + FFmpeg dev installed"

# Step 2: Create virtual environment
echo ""
echo "🐍 Step 2/4: Creating virtual environment at /opt/venv..."
rm -rf /opt/venv
python3.10 -m venv /opt/venv
echo "✓ Virtual environment created"

# Step 3: Install PyTorch + API dependencies
echo ""
echo "📥 Step 3/4: Installing dependencies (5-10 phút)..."
echo "  Installing PyTorch 2.1.2 + CUDA 12.1..."
/opt/venv/bin/pip install --upgrade pip > /dev/null 2>&1
/opt/venv/bin/pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 \
  --index-url https://download.pytorch.org/whl/cu121 > /dev/null

echo "  Installing FastAPI + dependencies..."
/opt/venv/bin/pip install \
  "numpy<2" \
  fastapi==0.109.0 \
  uvicorn[standard]==0.27.0 \
  python-multipart==0.0.6 \
  pillow==10.2.0 \
  faster-whisper==1.0.0 \
  sentence-transformers==2.3.1 \
  transformers==4.39.2 \
  accelerate==0.25.0 > /dev/null

echo "✓ Dependencies installed"

# Step 4: Configure Supervisor
echo ""
echo "🔧 Step 4/4: Configuring Supervisor..."

cat > /etc/supervisor/conf.d/highlight-api.conf << 'EOF'
[program:highlight-api]
command=/opt/venv/bin/uvicorn main:app --host 0.0.0.0 --port 1434
directory=/opt/app
autostart=true
autorestart=true
stderr_logfile=/var/log/highlight-api.err.log
stdout_logfile=/var/log/highlight-api.out.log
user=root
environment=PYTHONUNBUFFERED=1,CUDA_VISIBLE_DEVICES=0
stopasgroup=true
killasgroup=true
EOF

# Reload supervisor
supervisorctl reread > /dev/null 2>&1 || true
supervisorctl update > /dev/null 2>&1 || true

echo "✓ Supervisor configured"

echo ""
echo "=========================================="
echo "✅ API Setup Complete!"
echo "=========================================="
echo ""
echo "📍 Quick Start:"
echo "  supervisorctl start highlight-api"
echo "  supervisorctl status highlight-api"
echo "  curl http://localhost:1434/"
echo ""
echo "🔍 GPU Info:"
/opt/venv/bin/python -c "import torch; print(f'  PyTorch: {torch.__version__}'); print(f'  CUDA: {torch.cuda.is_available()}'); print(f'  GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')"
echo ""
echo "=========================================="
