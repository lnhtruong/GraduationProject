#!/bin/bash
set -euo pipefail

APP_DIR="/opt/app"
JOYVASA_REPO="${JOYVASA_REPO_PATH:-/opt/joyvasa/JoyVASA}"
VENV_DIR="/opt/venv"
OUTPUT_DIR="/opt/outputs"
TEMP_DIR="/opt/mascot_temp"
BG_CACHE_DIR="/opt/mascot_bg_cache"
MODEL_CACHE_DIR="/opt/models"
SERVICE_NAME="highlight-api"
PORT="${PORT:-1434}"
PYTHON_BIN="${PYTHON_BIN:-python3.10}"

echo "== API-only setup for in-process JoyVASA =="
if [ ! -d "${JOYVASA_REPO}" ]; then
  echo "ERROR: JoyVASA repo not found at ${JOYVASA_REPO}"
  echo "Run setup_full.sh first, or set JOYVASA_REPO_PATH to the existing repo."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y --no-install-recommends \
  build-essential cmake ninja-build pkg-config \
  ffmpeg supervisor python3.10 python3.10-dev python3.10-venv \
  libgl1 libglib2.0-0 > /dev/null

mkdir -p "${APP_DIR}" "${OUTPUT_DIR}" "${TEMP_DIR}" "${BG_CACHE_DIR}" "${MODEL_CACHE_DIR}"

if [ ! -d "${VENV_DIR}" ]; then
  "${PYTHON_BIN}" -m venv "${VENV_DIR}"
fi

"${VENV_DIR}/bin/python" -m pip install --upgrade pip setuptools wheel
"${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  torch==2.3.1 torchvision==0.18.1 torchaudio==2.3.1 \
  --index-url https://download.pytorch.org/whl/cu121
"${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  xformers==0.0.27 \
  --index-url https://download.pytorch.org/whl/cu121
"${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  numpy==1.26.4 scipy==1.13.1 pandas==2.2.2 protobuf==3.20.3 \
  transformers==4.41.2 sentence-transformers==3.0.1 accelerate==0.31.0 peft==0.11.1 \
  fastapi==0.111.0 'uvicorn[standard]==0.30.1' python-multipart==0.0.9 \
  cloudinary==1.40.0 requests==2.32.3 qstash==2.0.1 \
  pillow==10.3.0 opencv-python-headless==4.10.0.84 imageio==2.34.1 imageio-ffmpeg==0.5.1 \
  librosa==0.10.2.post1 soundfile==0.12.1 onnxruntime==1.18.1 rembg==2.0.57 \
  bitsandbytes==0.43.1 triton==2.3.1 huggingface_hub==0.23.4

if [ -f "${JOYVASA_REPO}/requirements.txt" ]; then
  python3 - "${JOYVASA_REPO}/requirements.txt" /tmp/joyvasa_requirements_clean.txt <<'PY'
import sys
from pathlib import Path
ignore = ("torch", "torchvision", "torchaudio", "xformers", "numpy", "scipy", "pandas", "protobuf", "onnxruntime", "tensorflow", "jax", "transformers", "sentence-transformers", "accelerate", "peft", "bitsandbytes", "triton", "gradio", "fastapi", "uvicorn", "cloudinary", "pyngrok", "qstash", "rembg")
req = Path(sys.argv[1])
out = Path(sys.argv[2])
lines = []
for line in req.read_text(encoding="utf-8", errors="ignore").splitlines():
    raw = line.strip()
    lower = raw.lower()
    if raw and not raw.startswith("#") and not any(pkg in lower for pkg in ignore):
        lines.append(line)
out.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")
PY
  [ ! -s /tmp/joyvasa_requirements_clean.txt ] || "${VENV_DIR}/bin/python" -m pip install --no-cache-dir -r /tmp/joyvasa_requirements_clean.txt
fi

"${VENV_DIR}/bin/python" -m pip install --no-cache-dir --force-reinstall \
  numpy==1.26.4 scipy==1.13.1 pandas==2.2.2 protobuf==3.20.3 \
  onnxruntime==1.18.1 transformers==4.41.2 accelerate==0.31.0 peft==0.11.1
"${VENV_DIR}/bin/python" -m pip install --no-cache-dir --no-deps --force-reinstall rembg==2.0.57

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

echo "== Done =="
echo "Upload deploy-model/main.py to ${APP_DIR}/main.py, then run: supervisorctl restart ${SERVICE_NAME}"
