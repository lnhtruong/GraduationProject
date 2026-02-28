#!/bin/bash

set -e

echo "=========================================="
echo "🚀 FULL DEPLOYMENT SETUP"
echo "=========================================="
echo "This script will install:"
echo "  [A] JoyVASA (conda env + models)"
echo "  [B] API Stack (Python venv + FastAPI)"
echo ""
echo "📦 Total size: ~8GB"
echo "⏱️  Time: 20-30 minutes"
echo ""
echo "=========================================="
echo ""

# ============================================================================
# PART A: JOYVASA SETUP
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎭 PART A: JoyVASA Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Configuration
JOYVASA_DIR="/opt/joyvasa"
CONDA_ENV="joyvasa"

# ============================================================================
# A1: System dependencies
# ============================================================================
echo "📦 A1/5: Installing system dependencies..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null || apt-get update

apt-get install -y --no-install-recommends \
    build-essential git git-lfs wget curl \
    ffmpeg python3.10 python3.10-dev python3.10-venv \
    supervisor pkg-config \
    libavformat-dev libavcodec-dev libavdevice-dev \
    libavutil-dev libavfilter-dev libswscale-dev libswresample-dev \
    2>&1 | grep -v "^W:" || true

git lfs install

echo "✓ System dependencies installed"

# ============================================================================
# A2: Miniconda
# ============================================================================
echo ""
echo "🐍 A2/5: Setting up Miniconda..."

if [ ! -d "/opt/conda" ]; then
    wget -q --show-progress -O /tmp/miniconda.sh \
        https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
    bash /tmp/miniconda.sh -b -p /opt/conda
    rm /tmp/miniconda.sh
fi

export PATH="/opt/conda/bin:$PATH"
echo 'export PATH="/opt/conda/bin:$PATH"' >> ~/.bashrc

/opt/conda/bin/conda config --set channel_priority flexible
yes 2>/dev/null | /opt/conda/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main || true
yes 2>/dev/null | /opt/conda/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r || true

echo "✓ Miniconda ready"

# ============================================================================
# A3: JoyVASA environment
# ============================================================================
echo ""
echo "🎨 A3/5: Creating JoyVASA environment (5-10 phút)..."

/opt/conda/bin/conda env remove -n ${CONDA_ENV} -y 2>/dev/null || true

echo "  Creating conda environment..."
/opt/conda/bin/conda create -n ${CONDA_ENV} python=3.10 -y -q

echo "  Installing PyTorch..."
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir \
    torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 \
    --index-url https://download.pytorch.org/whl/cu121

echo "✓ PyTorch installed in conda env"

# ============================================================================
# A4: Clone & install dependencies
# ============================================================================
echo ""
echo "📥 A4/5: Setting up JoyVASA (10-15 phút)..."

mkdir -p ${JOYVASA_DIR}
cd ${JOYVASA_DIR}

if [ ! -d "JoyVASA" ]; then
    echo "  Cloning JoyVASA..."
    git clone https://github.com/jdh-algo/JoyVASA.git
fi

cd JoyVASA

echo ""
echo "  Installing dependencies..."

# Remove torch/xformers from requirements
sed -i 's/^torch/#torch/g' requirements.txt 2>/dev/null || true
sed -i 's/^xformers/#xformers/g' requirements.txt 2>/dev/null || true

# Install main requirements
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir -r requirements.txt

echo ""
echo "  Installing xformers (5-15 phút)..."
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir \
    xformers==0.0.23.post1 \
    --index-url https://download.pytorch.org/whl/cu121

# Install additional deps
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir "huggingface_hub>=0.23.0,<1.0"

echo "✓ Dependencies installed"

# Compile XPose (optional)
echo ""
echo "  Compiling XPose (optional)..."
if [ -d "src/utils/dependencies/XPose/models/UniPose/ops" ]; then
    cd src/utils/dependencies/XPose/models/UniPose/ops
    /opt/conda/envs/${CONDA_ENV}/bin/python setup.py build install 2>&1 | \
        grep -E "(Running|Compiling|Building|Finished)" || \
        echo "⚠️  XPose compilation failed (OK for human-only mode)"
    cd ${JOYVASA_DIR}/JoyVASA
else
    echo "⚠️  XPose source not found (OK for human-only mode)"
fi

# ============================================================================
# A5: Download models
# ============================================================================
echo ""
echo "📥 A5/5: Downloading models (~6GB, 10-15 phút)..."
echo ""

mkdir -p pretrained_weights
cd ${JOYVASA_DIR}/JoyVASA/pretrained_weights

# Download models in parallel
echo "  [1/5] JoyVASA checkpoint..."
if [ ! -d "JoyVASA" ]; then
    GIT_LFS_SKIP_SMUDGE=1 git clone https://huggingface.co/jdh-algo/JoyVASA JoyVASA
    cd JoyVASA
    git lfs pull
    cd ..
fi &
PID1=$!

echo "  [2/5] Chinese Hubert..."
if [ ! -d "chinese-hubert-base" ]; then
    git clone https://huggingface.co/TencentGameMate/chinese-hubert-base chinese-hubert-base
fi &
PID2=$!

echo "  [3/5] Wav2Vec2..."
if [ ! -d "wav2vec2-base-960h" ]; then
    git clone https://huggingface.co/facebook/wav2vec2-base-960h wav2vec2-base-960h
fi &
PID3=$!

wait $PID1 $PID2 $PID3

echo "  [4/5] LivePortrait..."
cd ${JOYVASA_DIR}/JoyVASA
/opt/conda/envs/${CONDA_ENV}/bin/python << 'PYEOF'
from huggingface_hub import snapshot_download
import os

os.makedirs("pretrained_weights", exist_ok=True)

print("  Downloading LivePortrait models...")
snapshot_download(
    repo_id="KwaiVGI/LivePortrait",
    local_dir="pretrained_weights",
    local_dir_use_symlinks=False,
    ignore_patterns=["*.git*", "README.md", "docs"]
)
print("  ✓ LivePortrait downloaded")
PYEOF

echo "  [5/5] InsightFace..."
mkdir -p pretrained_weights/insightface/models/buffalo_l
cd pretrained_weights/insightface/models/buffalo_l

if [ ! -f "det_10g.onnx" ]; then
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/det_10g.onnx
fi

if [ ! -f "2d106det.onnx" ]; then
    wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/2d106det.onnx
fi

cd ${JOYVASA_DIR}/JoyVASA

echo ""
echo "✓ All models downloaded"

# Create wrapper script
echo ""
echo "  Creating wrapper script..."
cat > ${JOYVASA_DIR}/joyvasa_wrapper.py << 'WRAPPER_EOF'
#!/usr/bin/env python
import sys, os, subprocess, shutil
from argparse import ArgumentParser

JOYVASA_DIR = '/opt/joyvasa/JoyVASA'
JOYVASA_PYTHON = '/opt/conda/envs/joyvasa/bin/python'

def main():
    parser = ArgumentParser()
    parser.add_argument("-r", "--ref_image_path", required=True)
    parser.add_argument("-a", "--audio_path", required=True)
    parser.add_argument("-o", "--output_path", required=True)
    parser.add_argument("--animation_mode", default="human", choices=["human", "animal"])
    args = parser.parse_args()

    # Build command
    cmd = [
        JOYVASA_PYTHON,
        os.path.join(JOYVASA_DIR, "inference.py"),
        "--reference", args.ref_image_path,
        "--audio", args.audio_path,
        "--output-dir", "/tmp/joyvasa_output",
        "--animation-mode", args.animation_mode
    ]

    # Run inference
    result = subprocess.run(cmd, cwd=JOYVASA_DIR, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"ERROR: {result.stderr}", file=sys.stderr)
        sys.exit(1)

    # Move output
    output_dir = "/tmp/joyvasa_output"
    if os.path.exists(output_dir):
        files = sorted([f for f in os.listdir(output_dir) if f.endswith('.mp4')])
        if files:
            shutil.move(os.path.join(output_dir, files[-1]), args.output_path)
            print(f"✓ Video saved: {args.output_path}")
        else:
            print("ERROR: No output video found", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
WRAPPER_EOF

chmod +x ${JOYVASA_DIR}/joyvasa_wrapper.py

echo "✓ Wrapper created"

echo ""
echo "✅ PART A COMPLETE: JoyVASA Ready!"
echo ""

# ============================================================================
# PART B: API STACK SETUP
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 PART B: API Stack Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ============================================================================
# B1: Create virtual environment
# ============================================================================
echo "🐍 B1/3: Creating Python virtual environment..."
rm -rf /opt/venv
python3.10 -m venv /opt/venv
echo "✓ Virtual environment created at /opt/venv"

# ============================================================================
# B2: Install API dependencies
# ============================================================================
echo ""
echo "📥 B2/3: Installing API dependencies (5-10 phút)..."
echo "  Installing PyTorch 2.1.2 + CUDA 12.1..."
/opt/venv/bin/pip install --upgrade pip > /dev/null 2>&1
/opt/venv/bin/pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 \
  --index-url https://download.pytorch.org/whl/cu121 > /dev/null

echo "  Installing FastAPI + ML dependencies..."
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

echo "✓ API dependencies installed"

# ============================================================================
# B3: Configure Supervisor
# ============================================================================
echo ""
echo "🔧 B3/3: Configuring Supervisor..."

mkdir -p /opt/app /opt/outputs /opt/models

cat > /opt/app/.env << 'EOF'
TRANSFORMERS_CACHE=/opt/models
HF_HOME=/opt/models
TORCH_HOME=/opt/models
EOF

# Stop existing supervisord
pkill supervisord 2>/dev/null || true
sleep 1

# Start supervisord
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf
sleep 2

# Create highlight-api config
cat > /etc/supervisor/conf.d/highlight-api.conf << 'EOFCONF'
[program:highlight-api]
command=/opt/venv/bin/uvicorn main:app --host 0.0.0.0 --port 1434 --workers 1
directory=/opt/app
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/highlight-api.err.log
stdout_logfile=/var/log/highlight-api.out.log
environment=PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/venv/bin:/opt/conda/bin",HF_HOME="/opt/models",TORCH_HOME="/opt/models",PYTHONUNBUFFERED="1"
stopasgroup=true
killasgroup=true
stopsignal=TERM
stopwaitsecs=30
EOFCONF

supervisorctl reread
supervisorctl update

echo "✓ Supervisor configured"

echo ""
echo "✅ PART B COMPLETE: API Stack Ready!"
echo ""

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "=========================================="
echo "✅ FULL DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "📍 Installed Components:"
echo "  [A] JoyVASA"
echo "      - Conda env: ${CONDA_ENV}"
echo "      - Path: ${JOYVASA_DIR}/JoyVASA"
echo "      - Wrapper: ${JOYVASA_DIR}/joyvasa_wrapper.py"
echo ""
echo "  [B] API Stack"
echo "      - Python venv: /opt/venv"
echo "      - Service: highlight-api"
echo "      - Port: 1434"
echo ""
echo "🔍 GPU Info:"
/opt/venv/bin/python -c "import torch; print(f'  PyTorch: {torch.__version__}'); print(f'  CUDA: {torch.cuda.is_available()}'); print(f'  GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"N/A\"}')" 2>/dev/null || echo "  (Python venv ready)"
echo ""
echo "📋 Next Steps:"
echo "  1. Upload code files:"
echo "     scp -P 2291 main.py root@n2.ckey.vn:/opt/app/"
echo "     scp -P 2291 joyvasa_wrapper.py root@n2.ckey.vn:/opt/joyvasa/"
echo ""
echo "  2. Start API:"
echo "     supervisorctl restart highlight-api"
echo ""
echo "  3. Test API:"
echo "     curl http://localhost:1434/"
echo ""
echo "=========================================="
