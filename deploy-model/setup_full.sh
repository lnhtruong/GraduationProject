#!/bin/bash
set -euo pipefail

APP_DIR="/opt/app"
JOYVASA_DIR="/opt/joyvasa"
JOYVASA_REPO="${JOYVASA_DIR}/JoyVASA"
VENV_DIR="/opt/venv"
OUTPUT_DIR="/opt/outputs"
TEMP_DIR="/opt/mascot_temp"
BG_CACHE_DIR="/opt/mascot_bg_cache"
MODEL_CACHE_DIR="/opt/models"
SERVICE_NAME="highlight-api"
PORT="${PORT:-1434}"
PYTHON_BIN="${PYTHON_BIN:-python3.10}"

echo "== JoyVASA VPS full setup (in-process API) =="
echo "This installs JoyVASA and FastAPI into one venv: ${VENV_DIR}"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends \
  build-essential cmake ninja-build pkg-config \
  git git-lfs wget curl rsync \
  ffmpeg supervisor \
  python3.10 python3.10-dev python3.10-venv \
  libgl1 libglib2.0-0 > /dev/null

git lfs install >/dev/null 2>&1 || true

mkdir -p "${APP_DIR}" "${JOYVASA_DIR}" "${OUTPUT_DIR}" "${TEMP_DIR}" "${BG_CACHE_DIR}" "${MODEL_CACHE_DIR}"

if [ ! -d "${VENV_DIR}" ]; then
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

"${VENV_DIR}/bin/python" -m pip install --upgrade pip setuptools wheel

if [ ! -d "${JOYVASA_REPO}" ]; then
  git clone https://github.com/jdh-algo/JoyVASA.git "${JOYVASA_REPO}"
else
  git -C "${JOYVASA_REPO}" pull --ff-only || true
fi

REQ_CLEAN="/tmp/joyvasa_requirements_clean.txt"
python3 - "${JOYVASA_REPO}/requirements.txt" "${REQ_CLEAN}" <<'PY'
import sys
from pathlib import Path
req = Path(sys.argv[1])
out = Path(sys.argv[2])
ignore = (
    "torch", "torchvision", "torchaudio", "xformers", "numpy", "scipy", "pandas",
    "protobuf", "onnxruntime", "onnxruntime-gpu", "cupy", "tensorflow", "jax",
    "jaxlib", "transformers", "sentence-transformers", "accelerate", "peft",
    "bitsandbytes", "triton", "gradio", "fastapi", "uvicorn", "cloudinary",
    "pyngrok", "qstash", "rembg",
)
lines = []
if req.exists():
    for line in req.read_text(encoding="utf-8", errors="ignore").splitlines():
        raw = line.strip()
        lower = raw.lower()
        if raw and not raw.startswith("#") and not any(pkg in lower for pkg in ignore):
            lines.append(line)
out.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
print(f"clean requirements: {len(lines)} lines -> {out}")
PY

"${VENV_DIR}/bin/python" -m pip uninstall -y \
  torch torchvision torchaudio xformers numpy scipy pandas protobuf \
  onnxruntime onnxruntime-gpu rembg cupy cupy-cuda11x cupy-cuda12x \
  tensorflow jax jaxlib transformers sentence-transformers accelerate peft \
  bitsandbytes triton gradio >/dev/null 2>&1 || true

"${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  torch==2.3.1 torchvision==0.18.1 torchaudio==2.3.1 \
  --index-url https://download.pytorch.org/whl/cu121

"${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  xformers==0.0.27 \
  --index-url https://download.pytorch.org/whl/cu121

if [ -s "${REQ_CLEAN}" ]; then
  "${VENV_DIR}/bin/python" -m pip install --no-cache-dir -r "${REQ_CLEAN}"
fi

"${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  numpy==1.26.4 scipy==1.13.1 pandas==2.2.2 protobuf==3.20.3 \
  transformers==4.41.2 sentence-transformers==3.0.1 accelerate==0.31.0 peft==0.11.1 \
  fastapi==0.111.0 'uvicorn[standard]==0.30.1' python-multipart==0.0.9 \
  cloudinary==1.40.0 requests==2.32.3 qstash==2.0.1 \
  pillow==10.3.0 opencv-python-headless==4.10.0.84 imageio==2.34.1 imageio-ffmpeg==0.5.1 \
  librosa==0.10.2.post1 soundfile==0.12.1 onnxruntime==1.18.1 rembg==2.0.57 \
  bitsandbytes==0.43.1 triton==2.3.1 huggingface_hub==0.23.4
"${VENV_DIR}/bin/python" -m pip install --no-cache-dir --force-reinstall \
  numpy==1.26.4 scipy==1.13.1 pandas==2.2.2 protobuf==3.20.3 onnxruntime==1.18.1
"${VENV_DIR}/bin/python" -m pip install --no-cache-dir --no-deps --force-reinstall rembg==2.0.57

XPOSE_PATH="${JOYVASA_REPO}/src/utils/dependencies/XPose/models/UniPose/ops"
if [ -d "${XPOSE_PATH}" ]; then
  echo "Building XPose ops..."
  (cd "${XPOSE_PATH}" && "${VENV_DIR}/bin/python" -m pip install --no-build-isolation .) || \
    echo "WARNING: XPose build failed. Human mode can still work; animal mode may fail."
fi

echo "Downloading model weights..."
mkdir -p "${JOYVASA_REPO}/pretrained_weights"
cd "${JOYVASA_REPO}/pretrained_weights"

if [ ! -d JoyVASA ]; then
  GIT_LFS_SKIP_SMUDGE=1 git clone https://huggingface.co/jdh-algo/JoyVASA JoyVASA
  (cd JoyVASA && git lfs pull)
fi
if [ ! -d chinese-hubert-base ]; then
  git clone https://huggingface.co/TencentGameMate/chinese-hubert-base chinese-hubert-base
fi
if [ ! -d wav2vec2-base-960h ]; then
  git clone https://huggingface.co/facebook/wav2vec2-base-960h wav2vec2-base-960h
fi

cd "${JOYVASA_REPO}"
"${VENV_DIR}/bin/python" - <<'PY'
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="KwaiVGI/LivePortrait",
    local_dir="pretrained_weights",
    local_dir_use_symlinks=False,
    ignore_patterns=["*.git*", "README.md", "docs"],
)
PY

mkdir -p "${JOYVASA_REPO}/pretrained_weights/insightface/models/buffalo_l"
cd "${JOYVASA_REPO}/pretrained_weights/insightface/models/buffalo_l"
[ -f det_10g.onnx ] || wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/det_10g.onnx
[ -f 2d106det.onnx ] || wget -q --show-progress https://huggingface.co/MonsterMMORPG/tools/resolve/main/2d106det.onnx

cd "${JOYVASA_REPO}/pretrained_weights"
ln -sfn chinese-hubert-base "TencentGameMate:chinese-hubert-base"
ln -sfn wav2vec2-base-960h "facebook:wav2vec2-base-960h"

cat > "${APP_DIR}/.env" <<EOF
# CLOUDINARY_CLOUD_NAME=
# CLOUDINARY_API_KEY=
# CLOUDINARY_API_SECRET=
# QSTASH_TOKEN=
JOYVASA_REPO_PATH=${JOYVASA_REPO}
OUTPUT_DIR=${OUTPUT_DIR}
TEMP_DIR=${TEMP_DIR}
BG_CACHE_DIR=${BG_CACHE_DIR}
JOYVASA_STARTUP_MODE=${JOYVASA_STARTUP_MODE:-fast}
REMBG_FAST_MODEL=${REMBG_FAST_MODEL:-u2netp}
REMBG_CLEAN_MODEL=${REMBG_CLEAN_MODEL:-isnet-general-use}
LOAD_REMBG_ON_STARTUP=${LOAD_REMBG_ON_STARTUP:-false}
HF_HOME=${MODEL_CACHE_DIR}
TRANSFORMERS_CACHE=${MODEL_CACHE_DIR}
TORCH_HOME=${MODEL_CACHE_DIR}
PYTHONUNBUFFERED=1
EOF

cat > /etc/supervisor/conf.d/${SERVICE_NAME}.conf <<EOF
[program:${SERVICE_NAME}]
command=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
directory=${APP_DIR}
user=root
autostart=true
autorestart=true
stdout_logfile=/var/log/${SERVICE_NAME}.out.log
stderr_logfile=/var/log/${SERVICE_NAME}.err.log
environment=PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${VENV_DIR}/bin",JOYVASA_REPO_PATH="${JOYVASA_REPO}",OUTPUT_DIR="${OUTPUT_DIR}",TEMP_DIR="${TEMP_DIR}",BG_CACHE_DIR="${BG_CACHE_DIR}",HF_HOME="${MODEL_CACHE_DIR}",TRANSFORMERS_CACHE="${MODEL_CACHE_DIR}",TORCH_HOME="${MODEL_CACHE_DIR}",PYTHONUNBUFFERED="1"
stopasgroup=true
killasgroup=true
stopsignal=TERM
stopwaitsecs=60
EOF

/usr/bin/supervisord -c /etc/supervisor/supervisord.conf 2>/dev/null || true
supervisorctl reread
supervisorctl update

"${VENV_DIR}/bin/python" - <<'PY'
import torch, numpy, scipy, onnxruntime
print("torch", torch.__version__, "cuda", torch.cuda.is_available())
print("numpy", numpy.__version__, "scipy", scipy.__version__)
print("onnxruntime providers", onnxruntime.get_available_providers())
PY

echo "== Done =="
echo "Upload deploy-model/main.py to ${APP_DIR}/main.py, then run: supervisorctl restart ${SERVICE_NAME}"
echo "Health check: curl http://localhost:${PORT}/"
