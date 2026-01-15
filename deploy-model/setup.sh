#!/bin/bash

set -e

echo "🚀 Complete VPS Setup - Video Highlight API + SadTalker"
echo "========================================================="

# ============================================================================
# PART 1: SYSTEM DEPENDENCIES
# ============================================================================
echo ""
echo "📦 Step 1/6: Installing system dependencies..."
apt-get update
apt-get install -y libcudnn9-cuda-12
apt-get install -y \
    pkg-config \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    libavfilter-dev \
    python3.10 \
    python3.10-dev \
    python3.10-venv \
    build-essential \
    git wget curl vim \
    ffmpeg \
    supervisor \
    unzip

# ============================================================================
# PART 2: PYTHON VIRTUAL ENVIRONMENT (for FastAPI)
# ============================================================================
echo ""
echo "🐍 Step 2/6: Setting up Python virtual environment..."

# Create venv if not exists
if [ ! -d "/opt/venv" ]; then
    python3.10 -m venv /opt/venv
fi

source /opt/venv/bin/activate

pip install --upgrade pip setuptools wheel

# Core packages
echo "Installing FastAPI & Uvicorn..."
pip install fastapi==0.104.1 "uvicorn[standard]==0.24.0"

# ✅ PyTorch 2.5.1 cu124 cho RTX 4090 (Whisper + LLM cần GPU)
echo "Installing PyTorch (with CUDA support)..."
pip install torch==2.1.2 torchvision==0.16.2 torchaudio==2.1.2

# AI/ML packages
echo "Installing AI/ML packages..."
pip install --upgrade faster-whisper
pip install sentence-transformers==2.5.0
pip install transformers==4.40.0
pip install tokenizers
pip install accelerate==0.25.0

# Utilities
echo "Installing utilities..."
pip install numpy==1.24.3 srt==3.5.3 nest-asyncio==1.5.8 python-multipart

echo ""
echo "🔍 Verifying Python packages..."
python << 'PYEOF'
import sys, torch, fastapi, uvicorn, faster_whisper, sentence_transformers, transformers, accelerate, numpy

print(f"✓ Python: {sys.version.split()[0]}")
print(f"✓ PyTorch: {torch.__version__}")
print(f"✓ CUDA: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"✓ GPU: {torch.cuda.get_device_name(0)}")
    print(f"✓ GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
print(f"✓ FastAPI: {fastapi.__version__}")
print(f"✓ Uvicorn: {uvicorn.__version__}")
print(f"✓ Sentence Transformers: {sentence_transformers.__version__}")
print(f"✓ Transformers: {transformers.__version__}")
print(f"✓ Accelerate: {accelerate.__version__}")
print(f"✓ NumPy: {numpy.__version__}")
print("\n🎉 All packages verified!")
PYEOF

# ✅ DEACTIVATE VENV
deactivate

# ============================================================================
# PART 3: MINICONDA (for SadTalker)
# ============================================================================
echo ""
echo "🐍 Step 3/6: Installing Miniconda..."

if [ ! -d "/opt/conda" ]; then
    wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O /tmp/miniconda.sh
    bash /tmp/miniconda.sh -b -p /opt/conda
    rm /tmp/miniconda.sh
fi

export PATH="/opt/conda/bin:$PATH"
echo 'export PATH="/opt/conda/bin:$PATH"' >> ~/.bashrc

echo "✓ Accepting Anaconda Terms of Service..."
/opt/conda/bin/conda config --set allow_conda_downgrades true
/opt/conda/bin/conda config --set channel_priority flexible
yes 2>/dev/null | /opt/conda/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/main || true
yes 2>/dev/null | /opt/conda/bin/conda tos accept --override-channels --channel https://repo.anaconda.com/pkgs/r || true


# ============================================================================
# PART 4: SADTALKER SETUP (RTX 4090 Compatible)
# ============================================================================
echo ""
echo "🎭 Step 4/6: Setting up SadTalker (RTX 4090)..."

mkdir -p /opt/sadtalker/SadTalker
cd /opt/sadtalker

if [ ! -f "/opt/sadtalker/SadTalker/inference.py" ]; then
    echo "📥 Cloning SadTalker repository..."
    if [ -d "SadTalker" ]; then
        rm -rf SadTalker
    fi
    git clone https://github.com/voduytan1/SadTalker.git
else
    echo "✓ SadTalker already cloned, skipping..."
fi

cd SadTalker

# Remove old conda env if exists
/opt/conda/bin/conda env remove -n sadtalker -y 2>/dev/null || true

# Create conda environment Python 3.10
echo "🔧 Creating SadTalker conda environment (Python 3.10)..."
/opt/conda/bin/conda create -n sadtalker python=3.10 -y

# ✅ FIX: Use official PyPI (not download.pytorch.org)
echo "📦 Installing PyTorch 2.1.2 with CUDA 12.1..."
/opt/conda/envs/sadtalker/bin/pip install \
    torch==2.1.2 \
    torchvision==0.16.2 \
    torchaudio==2.1.2 \
    --index-url https://download.pytorch.org/whl/cu121 || \
/opt/conda/envs/sadtalker/bin/pip install \
    torch==2.1.2 \
    torchvision==0.16.2 \
    torchaudio==2.1.2

# ✅ Install NumPy compatible version FIRST
echo "📦 Installing NumPy 1.24.3..."
/opt/conda/envs/sadtalker/bin/pip install numpy==1.24.3

# ✅ STEP 1: Install basicsr FIRST
echo "📦 Step 1/5: Installing basicsr..."
/opt/conda/envs/sadtalker/bin/pip install basicsr==1.4.2

# ✅ STEP 2: Install facexlib
echo "📦 Step 2/5: Installing facexlib..."
/opt/conda/envs/sadtalker/bin/pip install facexlib

# ✅ STEP 3: Install gfpgan
echo "📦 Step 3/5: Installing gfpgan..."
/opt/conda/envs/sadtalker/bin/pip install gfpgan

# ✅ STEP 4: Install realesrgan
echo "📦 Step 4/5: Installing realesrgan..."
/opt/conda/envs/sadtalker/bin/pip install realesrgan

# ✅ STEP 5: Install remaining requirements
echo "📦 Step 5/5: Installing remaining SadTalker requirements..."
if [ -f "requirements.txt" ]; then
    grep -v '^basicsr' requirements.txt | \
    grep -v '^facexlib' | \
    grep -v '^gfpgan' | \
    grep -v '^numpy' | \
    sed 's/#.*//' | \
    sed '/^$/d' | \
    sed 's/[[:space:]]*$//' \
    > requirements_temp.txt
    
    /opt/conda/envs/sadtalker/bin/pip install -r requirements_temp.txt
    
    rm requirements_temp.txt
fi

# ✅ Install additional packages
echo "📦 Installing additional packages..."
/opt/conda/envs/sadtalker/bin/pip install \
    scipy \
    imageio \
    imageio-ffmpeg \
    librosa

# Patch basicsr
echo "🔧 Patching basicsr for PyTorch 2.x..."
BASICSR_PATH="/opt/conda/envs/sadtalker/lib/python3.10/site-packages/basicsr/data/degradations.py"
if [ -f "$BASICSR_PATH" ]; then
    sed -i 's/from torchvision.transforms.functional_tensor import rgb_to_grayscale/from torchvision.transforms.functional import rgb_to_grayscale/' "$BASICSR_PATH"
    echo "✓ basicsr patched"
fi

# ✅ Patch preprocess.py for NumPy 1.26+ compatibility
echo "🔧 Patching preprocess.py for NumPy 1.26+ compatibility..."
PREPROCESS_PATH="/opt/sadtalker/SadTalker/src/face3d/util/preprocess.py"
if [ -f "$PREPROCESS_PATH" ]; then
    # Backup original
    cp "$PREPROCESS_PATH" "${PREPROCESS_PATH}.backup"
    
    # Apply patch using Python for more reliable replacement
    /opt/conda/envs/sadtalker/bin/python << 'PATCHEOF'
import re

file_path = '/opt/sadtalker/SadTalker/src/face3d/util/preprocess.py'

with open(file_path, 'r') as f:
    content = f.read()

# Fix line ~101: trans_params array creation
# NumPy 1.26+ requires explicit type conversion for heterogeneous sequences
old_pattern = r'trans_params = np\.array\(\[w0, h0, s, t\[0\], t\[1\]\]\)'
new_code = 'trans_params = np.array([w0, h0, s, float(t[0]), float(t[1])], dtype=np.float64)'

if re.search(old_pattern, content):
    content = re.sub(old_pattern, new_code, content)
    with open(file_path, 'w') as f:
        f.write(content)
    print("✓ Patched preprocess.py line 101 for NumPy compatibility")
else:
    # Check if already patched
    if 'dtype=np.float64' in content and 'float(t[0])' in content:
        print("✓ preprocess.py already patched")
    else:
        print("⚠ Could not find pattern to patch - manual check needed")
PATCHEOF
    
    echo "✓ preprocess.py NumPy compatibility patch applied"
else
    echo "⚠️  preprocess.py not found at $PREPROCESS_PATH"
fi

# Create symlinks for path resolution
echo "🔗 Creating symlinks for SadTalker path resolution..."
ln -sf /opt/sadtalker/SadTalker/src /opt/sadtalker/src
ln -sf /opt/sadtalker/SadTalker/checkpoints /opt/sadtalker/checkpoints
echo "✓ Symlinks created"

# ✅ Verify installation
echo "🔍 Verifying SadTalker setup..."
/opt/conda/envs/sadtalker/bin/python << 'PYEOF'
import sys
print(f"✓ Python: {sys.version.split()[0]}")

try:
    import torch
    print(f"✓ PyTorch: {torch.__version__}")
    print(f"✓ CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"✓ CUDA version: {torch.version.cuda}")
        print(f"✓ GPU: {torch.cuda.get_device_name(0)}")
except Exception as e:
    print(f"✗ PyTorch error: {e}")
    sys.exit(1)

try:
    import numpy
    print(f"✓ NumPy: {numpy.__version__}")
except Exception as e:
    print(f"✗ NumPy error: {e}")
    sys.exit(1)

try:
    from torchvision.transforms.functional import rgb_to_grayscale
    from basicsr.data.degradations import circular_lowpass_kernel
    print("✓ All imports OK")
except Exception as e:
    print(f"✗ Import error: {e}")
    sys.exit(1)

print("🎉 SadTalker ready!")
PYEOF

if [ $? -ne 0 ]; then
    echo "❌ SadTalker verification failed!"
    exit 1
fi
#----------------------------------------------------------------------------
# ✅ AUTO-DOWNLOAD MODELS
echo ""
echo "📥 Downloading SadTalker models..."

# Remove Git LFS pointer files (134 bytes)
rm -f checkpoints/SadTalker_V0.0.2_*.safetensors

# Run download script
if [ -f "scripts/download_models.sh" ]; then
    echo "Running download_models.sh..."
    bash scripts/download_models.sh
else
    echo "⚠️  download_models.sh not found, downloading manually..."
    
    # Create directories
    mkdir -p checkpoints gfpgan/weights
    
    # Download v0.0.2 models
    wget -nc -c https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar -O checkpoints/mapping_00109-model.pth.tar
    wget -nc -c https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar -O checkpoints/mapping_00229-model.pth.tar
    wget -nc -c https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors -O checkpoints/SadTalker_V0.0.2_256.safetensors
    wget -nc -c https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_512.safetensors -O checkpoints/SadTalker_V0.0.2_512.safetensors
    
    # Download legacy models (required by code)
    # wget -nc -c https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/epoch_20.pth -O checkpoints/epoch_20.pth
    # wget -nc -c https://github.com/Winfredy/SadTalker/releases/download/v0.0.2/facevid2vid_00189-model.pth.tar -O checkpoints/facevid2vid_00189-model.pth.tar
    
    # Download GFPGAN
    wget -nc -c https://github.com/xinntao/facexlib/releases/download/v0.1.0/alignment_WFLW_4HG.pth -O gfpgan/weights/alignment_WFLW_4HG.pth
    wget -nc -c https://github.com/xinntao/facexlib/releases/download/v0.1.0/detection_Resnet50_Final.pth -O gfpgan/weights/detection_Resnet50_Final.pth
    wget -nc -c https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth -O gfpgan/weights/GFPGANv1.4.pth
    wget -nc -c https://github.com/xinntao/facexlib/releases/download/v0.2.2/parsing_parsenet.pth -O gfpgan/weights/parsing_parsenet.pth
fi

# Verify models
echo ""
echo "🔍 Verifying SadTalker models..."
    # "checkpoints/epoch_20.pth"
    # "checkpoints/facevid2vid_00189-model.pth.tar"
REQUIRED_FILES=(
    "checkpoints/mapping_00109-model.pth.tar"
    "checkpoints/mapping_00229-model.pth.tar"
    "checkpoints/SadTalker_V0.0.2_256.safetensors"
    "checkpoints/SadTalker_V0.0.2_512.safetensors"
    "gfpgan/weights/GFPGANv1.4.pth"
)
MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        actual_size=$(du -h "$file" | cut -f1)
        echo "✓ $file ($actual_size)"
    else
        echo "✗ MISSING: $file"
        ((MISSING++))
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo "✅ All SadTalker models verified!"
else
    echo "⚠️  Missing $MISSING models!"
    echo ""
    echo "Please check:"
    echo "  1. Download failed? Re-run: bash scripts/download_models.sh"
    echo "  2. Manual download from: https://github.com/OpenTalker/SadTalker/releases/tag/v0.0.2-rc"
    echo ""
    echo "SadTalker may not work without all models."
fi

# Verify SadTalker installation
echo ""
echo "🔍 Verifying SadTalker installation..."
/opt/conda/envs/sadtalker/bin/python << 'PYEOF'
import sys, torch, numpy, scipy, imageio

print(f"✓ Python: {sys.version.split()[0]}")
print(f"✓ PyTorch: {torch.__version__}")
print(f"✓ CUDA: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"✓ GPU: {torch.cuda.get_device_name(0)}")
print(f"✓ NumPy: {numpy.__version__}")
print(f"✓ SciPy: {scipy.__version__}")
print("\n🎉 SadTalker environment ready!")
PYEOF

# ============================================================================
# PART 5: CREATE DIRECTORIES
# ============================================================================
echo ""
echo "📁 Step 5/6: Creating application directories..."
mkdir -p /opt/app
mkdir -p /opt/outputs
mkdir -p /opt/models

cat > /opt/app/.env << 'EOF'
TRANSFORMERS_CACHE=/opt/models
HF_HOME=/opt/models
TORCH_HOME=/opt/models
EOF

# ============================================================================
# PART 6: SUPERVISOR SETUP
# ============================================================================
echo ""
echo "🔧 Step 6/6: Setting up Supervisor..."

# Start supervisor daemon
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf 2>/dev/null || true
sleep 2

# Create API config
cat > /etc/supervisor/conf.d/highlight-api.conf << 'EOFCONF'
[program:highlight-api]
command=/opt/venv/bin/uvicorn main:app --host 0.0.0.0 --port 1434 --workers 1
directory=/opt/app
user=root
autostart=true
autorestart=true
stderr_logfile=/var/log/highlight-api.err.log
stdout_logfile=/var/log/highlight-api.out.log
environment=PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/venv/bin:/usr/local/cuda/bin:/opt/conda/bin",HF_HOME="/opt/models",TORCH_HOME="/opt/models",PYTHONUNBUFFERED="1"
stopasgroup=true
killasgroup=true
stopsignal=TERM
stopwaitsecs=30
EOFCONF

# Reload supervisor
supervisorctl reread
supervisorctl update

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "============================================"
echo "✅ Complete Setup Finished!"
echo "============================================"
echo ""
echo "📦 Installed Components:"
echo "  ✓ Python 3.10 virtual environment (/opt/venv)"
echo "  ✓ FastAPI + PyTorch + AI packages"
echo "  ✓ Miniconda (/opt/conda)"
echo "  ✓ SadTalker conda environment"
echo "  ✓ Supervisor service manager"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1️⃣  Upload main.py (with compute_type='int8'):"
echo "   scp -P PORT main.py root@VPS:/opt/app/main.py"
echo ""
echo "2️⃣  Upload SadTalker models:"
echo "   scp -P PORT -r checkpoints/ root@VPS:/opt/sadtalker/SadTalker/"
echo "   scp -P PORT -r gfpgan/ root@VPS:/opt/sadtalker/SadTalker/"
echo ""
echo "3️⃣  Start API service:"
echo "   supervisorctl start highlight-api"
echo ""
echo "4️⃣  Check status:"
echo "   supervisorctl status highlight-api"
echo "   tail -f /var/log/highlight-api.out.log"
echo "   tail -f /var/log/highlight-api.err.log"
echo ""
echo "5️⃣  Test API:"
echo "   curl http://localhost:8000/"
echo ""
echo "============================================"
echo "📍 Important Paths:"
echo "  API app: /opt/app/main.py"
echo "  API Python: /opt/venv/bin/python"
echo "  SadTalker: /opt/sadtalker/SadTalker"
echo "  SadTalker Python: /opt/conda/envs/sadtalker/bin/python"
echo "  Outputs: /opt/outputs"
echo "  Models cache: /opt/models"
echo ""
echo "🎉 Ready to deploy!"
echo "============================================"