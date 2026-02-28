#!/bin/bash

set -e

echo "🎭 JoyVASA Setup - OPTIMIZED VERSION"
echo "=================================================="
echo ""

# ============================================================================
# CONFIGURATION
# ============================================================================
JOYVASA_DIR="/opt/joyvasa"
CONDA_ENV="joyvasa"

# ============================================================================
# PART 1: SYSTEM DEPENDENCIES
# ============================================================================
echo "📦 Step 1/5: Installing system dependencies..."

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq 2>/dev/null || apt-get update

apt-get install -y --no-install-recommends \
    build-essential git git-lfs wget curl \
    ffmpeg python3.10 python3.10-dev \
    supervisor 2>&1 | grep -v "^W:" || true

git lfs install

echo "✓ System dependencies installed"

# ============================================================================
# PART 2: MINICONDA
# ============================================================================
echo ""
echo "🐍 Step 2/5: Setting up Miniconda..."

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
# PART 3: JOYVASA ENVIRONMENT
# ============================================================================
echo ""
echo "🎨 Step 3/5: Creating JoyVASA environment..."

/opt/conda/bin/conda env remove -n ${CONDA_ENV} -y 2>/dev/null || true

echo "  Creating conda environment..."
/opt/conda/bin/conda create -n ${CONDA_ENV} python=3.10 -y -q

echo "  Installing PyTorch (2-3 phút)..."
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir \
    torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2 \
    --index-url https://download.pytorch.org/whl/cu121

echo "✓ PyTorch installed"

# ============================================================================
# PART 4: CLONE & INSTALL (OPTIMIZED)
# ============================================================================
echo ""
echo "📥 Step 4/5: Setting up JoyVASA..."

mkdir -p ${JOYVASA_DIR}
cd ${JOYVASA_DIR}

if [ ! -d "JoyVASA" ]; then
    echo "  Cloning JoyVASA..."
    git clone https://github.com/jdh-algo/JoyVASA.git
fi

cd JoyVASA

# ============================================================================
# CRITICAL FIX: Install dependencies WITH PROGRESS
# ============================================================================
echo ""
echo "  Installing dependencies (5-10 phút)..."
echo "  ⏳ Có thể mất thời gian, vui lòng chờ..."
echo ""

# Remove torch/xformers from requirements (already installed)
sed -i 's/^torch/#torch/g' requirements.txt 2>/dev/null || true
sed -i 's/^xformers/#xformers/g' requirements.txt 2>/dev/null || true

# Install main requirements (verbose to show progress)
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir -r requirements.txt

echo ""
echo "  Installing xformers (CRITICAL: 5-15 phút)..."
echo "  📊 Đang download pre-built wheel (~500MB)..."
echo ""

# Install xformers with specific version that has pre-built wheel
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir \
    xformers==0.0.23.post1 \
    --index-url https://download.pytorch.org/whl/cu121

# Install additional deps
/opt/conda/envs/${CONDA_ENV}/bin/pip install --no-cache-dir "huggingface_hub>=0.23.0,<1.0"

echo "✓ Dependencies installed"

# ============================================================================
# XPose compilation (OPTIONAL - for animal animation)
# ============================================================================
echo ""
echo "  Compiling XPose (optional, for animal animation)..."
if [ -d "src/utils/dependencies/XPose/models/UniPose/ops" ]; then
    cd src/utils/dependencies/XPose/models/UniPose/ops
    
    echo "  Building XPose CUDA ops..."
    /opt/conda/envs/${CONDA_ENV}/bin/python setup.py build install 2>&1 | \
        grep -E "(Running|Compiling|Building|Finished)" || \
        echo "⚠️  XPose compilation failed (OK for human-only mode)"
    
    cd ${JOYVASA_DIR}/JoyVASA
else
    echo "⚠️  XPose source not found (OK for human-only mode)"
fi

# ============================================================================
# PART 5: DOWNLOAD MODELS (PARALLEL)
# ============================================================================
echo ""
echo "📥 Step 5/5: Downloading models (~6GB, 10-15 phút)..."
echo ""

mkdir -p pretrained_weights
cd ${JOYVASA_DIR}/JoyVASA/pretrained_weights

# Download models in parallel with progress
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

# Wait for first batch
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

# ============================================================================
# VERIFY & CREATE WRAPPER
# ============================================================================
echo ""
echo "🔍 Verifying installation..."
echo ""

/opt/conda/envs/${CONDA_ENV}/bin/python << 'PYEOF'
import torch
import sys

print("=" * 50)
print("✓ PyTorch:", torch.__version__)
print("✓ CUDA available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("✓ GPU:", torch.cuda.get_device_name(0))
    print("✓ CUDA version:", torch.version.cuda)
else:
    print("⚠️  CUDA not available!")
    sys.exit(1)
print("=" * 50)
PYEOF

# Create wrapper script
cat > ${JOYVASA_DIR}/joyvasa_wrapper.py << 'WRAPPER_EOF'
#!/usr/bin/env python
import sys, os

JOYVASA_DIR = '/opt/joyvasa/JoyVASA'
sys.path.insert(0, JOYVASA_DIR)
os.chdir(JOYVASA_DIR)

import torch
from argparse import ArgumentParser
from inference import main

parser = ArgumentParser()
parser.add_argument("-r", "--ref_image_path", required=True)
parser.add_argument("-a", "--audio_path", required=True)
parser.add_argument("-o", "--output_path", default="./output")
parser.add_argument("--animation_mode", default="human", choices=["human", "animal"])
parser.add_argument("--cfg_scale", type=float, default=2.0)

args = parser.parse_args()
args.device = "cuda" if torch.cuda.is_available() else "cpu"

main(args)
WRAPPER_EOF

chmod +x ${JOYVASA_DIR}/joyvasa_wrapper.py

# ============================================================================
# SETUP SUPERVISOR
# ============================================================================
echo ""
echo "🔧 Setting up Supervisor..."

mkdir -p /opt/app /opt/outputs /opt/models

cat > /opt/app/.env << 'EOF'
TRANSFORMERS_CACHE=/opt/models
HF_HOME=/opt/models
TORCH_HOME=/opt/models
EOF

pkill supervisord 2>/dev/null || true
sleep 1

/usr/bin/supervisord -c /etc/supervisor/supervisord.conf
sleep 2

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

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "=========================================="
echo "✅ JoyVASA Setup Complete!"
echo "=========================================="
echo ""
echo "📍 Paths:"
echo "  Repository: ${JOYVASA_DIR}/JoyVASA"
echo "  Conda env: ${CONDA_ENV}"
echo "  Wrapper: ${JOYVASA_DIR}/joyvasa_wrapper.py"
echo ""
echo "🎯 Features:"
echo "  ✓ Human portrait animation"
echo "  ✓ Animal portrait animation (if XPose compiled)"
echo "  ✓ Multilingual audio support"
echo ""
echo "📋 Quick Test:"
echo ""
echo "  cd /opt/joyvasa/JoyVASA"
echo "  /opt/conda/envs/${CONDA_ENV}/bin/python ${JOYVASA_DIR}/joyvasa_wrapper.py \\"
echo "    -r assets/examples/imgs/joyvasa_001.png \\"
echo "    -a assets/examples/audios/joyvasa_001.wav \\"
echo "    --animation_mode human"
echo ""
echo "=========================================="
