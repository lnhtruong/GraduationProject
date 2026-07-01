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

REQUIRED_CUDA="12.1"
REQUIRED_CUDA_MAJOR="12"
REQUIRED_GCC_MAJOR="12"
REQUIRED_PYTHON_MAJOR_MINOR="3.10"

CUDA_HOME_TARGET="${CUDA_HOME:-/usr/local/cuda-${REQUIRED_CUDA}}"

LOG_DIR="${LOG_DIR:-/var/log}"
LOG_FILE="${LOG_FILE:-${LOG_DIR}/joyvasa_setup_$(date +%Y%m%d_%H%M%S).log}"
WATCH_INTERVAL="${WATCH_INTERVAL:-20}"

if [ "${EUID}" -ne 0 ]; then
  echo "ERROR: Chay script bang root nhe. Vi du: sudo bash setup_full.sh"
  exit 1
fi

mkdir -p "${LOG_DIR}" 2>/dev/null || true
if ! touch "${LOG_FILE}" 2>/dev/null; then
  LOG_FILE="/tmp/joyvasa_setup_$(date +%Y%m%d_%H%M%S).log"
  touch "${LOG_FILE}"
fi

exec > >(tee -a "${LOG_FILE}") 2>&1

trap 'code=$?; echo ""; echo "[FAILED] Setup loi tai line ${LINENO}, exit code ${code}"; echo "Log file: ${LOG_FILE}"; exit ${code}' ERR

export DEBIAN_FRONTEND=noninteractive
export PIP_PROGRESS_BAR=on
export PYTHONUNBUFFERED=1
export MAX_JOBS="${MAX_JOBS:-2}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

step() {
  echo ""
  echo "================================================================"
  log "$*"
  echo "================================================================"
}

run() {
  log "+ $*"
  "$@"
}

cmd_exists() {
  command -v "$1" >/dev/null 2>&1
}

ubuntu_distro_id() {
  . /etc/os-release
  echo "${ID}${VERSION_ID//./}"
}

watch_dir_size() {
  local label="$1"
  local path="$2"
  local child_pid="$3"

  while kill -0 "${child_pid}" 2>/dev/null; do
    if [ -e "${path}" ]; then
      log "[progress] ${label}: current size $(du -sh "${path}" 2>/dev/null | awk '{print $1}') at ${path}"
    else
      log "[progress] ${label}: waiting for ${path}"
    fi
    sleep "${WATCH_INTERVAL}"
  done
}

run_with_size_watch() {
  local label="$1"
  local path="$2"
  shift 2

  log "+ $*"
  "$@" &
  local cmd_pid=$!

  watch_dir_size "${label}" "${path}" "${cmd_pid}" &
  local watch_pid=$!

  set +e
  wait "${cmd_pid}"
  local code=$?
  kill "${watch_pid}" 2>/dev/null || true
  wait "${watch_pid}" 2>/dev/null || true
  set -e

  if [ "${code}" -ne 0 ]; then
    echo "ERROR: ${label} failed with exit code ${code}"
    return "${code}"
  fi

  if [ -e "${path}" ]; then
    log "[done] ${label}: final size $(du -sh "${path}" 2>/dev/null | awk '{print $1}') at ${path}"
  else
    log "[done] ${label}"
  fi
}

apt_install_base_tools() {
  step "Cai base tools de check/install moi thu"

  run apt-get update
  run apt-get install -y --no-install-recommends \
    ca-certificates gnupg lsb-release software-properties-common \
    build-essential cmake ninja-build pkg-config \
    git git-lfs wget curl rsync \
    ffmpeg supervisor \
    libgl1 libglib2.0-0
}

ensure_python310() {
  step "Check Python ${REQUIRED_PYTHON_MAJOR_MINOR}"

  if cmd_exists python3.10 && python3.10 - <<'PY' >/dev/null 2>&1
import sys
raise SystemExit(0 if sys.version_info[:2] == (3, 10) else 1)
PY
  then
    log "OK: $(python3.10 --version)"
  else
    log "Python 3.10 chua co hoac sai version. Dang install python3.10..."

    if ! apt-get install -y --no-install-recommends python3.10 python3.10-dev python3.10-venv; then
      log "Default apt khong co Python 3.10. Thu them deadsnakes PPA..."
      run add-apt-repository -y ppa:deadsnakes/ppa
      run apt-get update
      run apt-get install -y --no-install-recommends python3.10 python3.10-dev python3.10-venv
    fi
  fi

  python3.10 - <<'PY'
import sys
assert sys.version_info[:2] == (3, 10), sys.version
print("Python OK:", sys.version.split()[0])
PY
}

ensure_gcc12() {
  step "Check GCC/G++ ${REQUIRED_GCC_MAJOR}"

  local need_install=0

  if ! cmd_exists gcc-12 || ! cmd_exists g++-12; then
    need_install=1
  fi

  if [ "${need_install}" -eq 1 ]; then
    log "gcc-12/g++-12 chua co. Dang install..."

    if ! apt-get install -y --no-install-recommends gcc-12 g++-12; then
      log "Default apt khong co GCC 12. Thu them ubuntu-toolchain-r/test PPA..."
      run add-apt-repository -y ppa:ubuntu-toolchain-r/test
      run apt-get update
      run apt-get install -y --no-install-recommends gcc-12 g++-12
    fi
  fi

  run update-alternatives --install /usr/bin/gcc gcc /usr/bin/gcc-12 120
  run update-alternatives --install /usr/bin/g++ g++ /usr/bin/g++-12 120
  run update-alternatives --set gcc /usr/bin/gcc-12
  run update-alternatives --set g++ /usr/bin/g++-12

  local gcc_major
  local gxx_major

  gcc_major="$(gcc -dumpversion | cut -d. -f1)"
  gxx_major="$(g++ -dumpversion | cut -d. -f1)"

  if [ "${gcc_major}" != "${REQUIRED_GCC_MAJOR}" ] || [ "${gxx_major}" != "${REQUIRED_GCC_MAJOR}" ]; then
    echo "ERROR: GCC/G++ van sai version. gcc=$(gcc --version | head -1), g++=$(g++ --version | head -1)"
    exit 1
  fi

  export CC=/usr/bin/gcc-12
  export CXX=/usr/bin/g++-12

  log "OK: $(gcc --version | head -1)"
  log "OK: $(g++ --version | head -1)"
}

nvcc_release() {
  local nvcc_bin="${1:-nvcc}"
  "${nvcc_bin}" --version 2>/dev/null | sed -n 's/.*release \([0-9][0-9]*\.[0-9][0-9]*\).*/\1/p' | head -1
}

find_cuda12_nvcc() {
  local f
  local rel

  if [ -x "/usr/local/cuda-${REQUIRED_CUDA}/bin/nvcc" ]; then
    echo "/usr/local/cuda-${REQUIRED_CUDA}/bin/nvcc"
    return 0
  fi

  if cmd_exists nvcc; then
    rel="$(nvcc_release nvcc || true)"
    if [[ "${rel}" == 12.* ]]; then
      command -v nvcc
      return 0
    fi
  fi

  for f in /usr/local/cuda-12*/bin/nvcc /usr/local/cuda/bin/nvcc; do
    if [ -x "${f}" ]; then
      rel="$(nvcc_release "${f}" || true)"
      if [[ "${rel}" == 12.* ]]; then
        echo "${f}"
        return 0
      fi
    fi
  done

  return 1
}

install_cuda121_toolkit_if_supported() {
  step "Install CUDA Toolkit ${REQUIRED_CUDA} neu distro support"

  local distro
  distro="$(ubuntu_distro_id)"

  case "${distro}" in
    ubuntu2004|ubuntu2204)
      log "Detected ${distro}. Dung NVIDIA apt repo cho CUDA ${REQUIRED_CUDA}."
      ;;
    *)
      log "WARNING: May hien tai la ${distro}, khong auto install CUDA ${REQUIRED_CUDA} bang apt."
      log "WARNING: Bo qua cai CUDA toolkit. Script se tiep tuc voi PyTorch cu121 wheel trong venv."
      log "WARNING: Neu XPose custom ops can nvcc thi co the fail, nhung script se bo qua XPose va tiep tuc."
      return 0
      ;;
  esac

  local keyring_deb="/tmp/cuda-keyring.deb"
  local keyring_base="https://developer.download.nvidia.com/compute/cuda/repos/${distro}/x86_64"

  log "Tai cuda-keyring tu NVIDIA repo..."

  if ! wget --progress=dot:giga -O "${keyring_deb}" "${keyring_base}/cuda-keyring_1.1-1_all.deb"; then
    log "cuda-keyring_1.1-1 khong tai duoc, fallback sang 1.0-1..."
    run wget --progress=dot:giga -O "${keyring_deb}" "${keyring_base}/cuda-keyring_1.0-1_all.deb"
  fi

  run dpkg -i "${keyring_deb}"
  run apt-get update
  run apt-get install -y --no-install-recommends cuda-toolkit-12-1

  if [ -d "/usr/local/cuda-${REQUIRED_CUDA}" ]; then
    run ln -sfn "/usr/local/cuda-${REQUIRED_CUDA}" /usr/local/cuda
  fi
}

ensure_cuda12() {
  step "Check CUDA/nvcc major ${REQUIRED_CUDA_MAJOR}, prefer ${REQUIRED_CUDA}"

  local nvcc_bin=""
  local current_release=""

  if nvcc_bin="$(find_cuda12_nvcc 2>/dev/null)"; then
    current_release="$(nvcc_release "${nvcc_bin}")"
    CUDA_HOME_TARGET="$(dirname "$(dirname "${nvcc_bin}")")"

    log "Found nvcc: ${nvcc_bin}"
    log "nvcc release: ${current_release}"
    log "OK: chap nhan CUDA ${current_release} vi cung major 12."
  else
    log "nvcc hien tai: MISSING hoac khong phai CUDA 12.x."
    install_cuda121_toolkit_if_supported
  fi

  if nvcc_bin="$(find_cuda12_nvcc 2>/dev/null)"; then
    current_release="$(nvcc_release "${nvcc_bin}")"
    CUDA_HOME_TARGET="$(dirname "$(dirname "${nvcc_bin}")")"

    export CUDA_HOME="${CUDA_HOME_TARGET}"
    export CUDA_PATH="${CUDA_HOME_TARGET}"
    export PATH="${CUDA_HOME_TARGET}/bin:${PATH}"
    export LD_LIBRARY_PATH="${CUDA_HOME_TARGET}/lib64:${LD_LIBRARY_PATH:-}"

    run ln -sfn "${CUDA_HOME_TARGET}" /usr/local/cuda || true

    cat > /etc/profile.d/cuda-12-x.sh <<EOF_CUDA
export CUDA_HOME=${CUDA_HOME_TARGET}
export CUDA_PATH=${CUDA_HOME_TARGET}
export PATH=${CUDA_HOME_TARGET}/bin:\$PATH
export LD_LIBRARY_PATH=${CUDA_HOME_TARGET}/lib64:\${LD_LIBRARY_PATH:-}
EOF_CUDA

    log "OK: $(nvcc --version | tail -1)"
    log "CUDA_HOME=${CUDA_HOME}"
  else
    log "WARNING: Khong tim thay nvcc CUDA 12.x sau khi check/install."
    log "WARNING: Van tiep tuc setup vi PyTorch cu121 wheel co runtime rieng trong venv."

    if [ -d "/usr/local/cuda" ]; then
      CUDA_HOME_TARGET="/usr/local/cuda"
    fi

    export CUDA_HOME="${CUDA_HOME_TARGET}"
    export CUDA_PATH="${CUDA_HOME_TARGET}"
    export PATH="${PATH}"
    export LD_LIBRARY_PATH="${LD_LIBRARY_PATH:-}"
  fi

  if cmd_exists nvidia-smi; then
    log "nvidia-smi:"
    nvidia-smi || true
  else
    log "WARNING: Khong thay nvidia-smi. VPS/container co the chua expose GPU driver."
  fi
}

ensure_system_versions() {
  apt_install_base_tools
  ensure_python310
  ensure_gcc12
  ensure_cuda12
}

ensure_venv_python310() {
  step "Tao/kiem tra Python venv tai ${VENV_DIR}"

  if [ -d "${VENV_DIR}" ]; then
    local venv_py_version=""
    venv_py_version="$("${VENV_DIR}/bin/python" - <<'PY' 2>/dev/null || true
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}")
PY
)"

    if [ "${venv_py_version}" != "${REQUIRED_PYTHON_MAJOR_MINOR}" ]; then
      log "Venv cu dang dung Python ${venv_py_version:-UNKNOWN}, xoa de tao lai bang Python ${REQUIRED_PYTHON_MAJOR_MINOR}."
      rm -rf "${VENV_DIR}"
    fi
  fi

  if [ ! -d "${VENV_DIR}" ]; then
    run "${PYTHON_BIN}" -m venv "${VENV_DIR}"
  fi

  "${VENV_DIR}/bin/python" - <<'PY'
import sys
assert sys.version_info[:2] == (3, 10), sys.version
print("Venv Python OK:", sys.version.split()[0])
PY
}

echo "== JoyVASA VPS full setup (in-process API) =="
echo "This installs JoyVASA and FastAPI into one venv: ${VENV_DIR}"
echo "Required: CUDA major ${REQUIRED_CUDA_MAJOR}, prefer ${REQUIRED_CUDA}; GCC/G++ ${REQUIRED_GCC_MAJOR}; Python ${REQUIRED_PYTHON_MAJOR_MINOR}"
echo "Log file: ${LOG_FILE}"

ensure_system_versions

git lfs install || true

step "Tao folder deploy"
run mkdir -p "${APP_DIR}" "${JOYVASA_DIR}" "${OUTPUT_DIR}" "${TEMP_DIR}" "${BG_CACHE_DIR}" "${MODEL_CACHE_DIR}"

ensure_venv_python310

step "Upgrade pip/setuptools/wheel"
run "${VENV_DIR}/bin/python" -m pip install --upgrade pip setuptools wheel

step "Clone/update JoyVASA repo"
if [ ! -d "${JOYVASA_REPO}" ]; then
  run_with_size_watch "Clone JoyVASA repo" "${JOYVASA_REPO}" \
    git clone --progress https://github.com/jdh-algo/JoyVASA.git "${JOYVASA_REPO}"
else
  run git -C "${JOYVASA_REPO}" pull --ff-only || true
fi

step "Lam sach JoyVASA requirements de tranh conflict package CUDA/PyTorch"
REQ_CLEAN="/tmp/joyvasa_requirements_clean.txt"

python3.10 - "${JOYVASA_REPO}/requirements.txt" "${REQ_CLEAN}" <<'PY'
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

step "Go package de conflict truoc khi cai stack JoyVASA"
"${VENV_DIR}/bin/python" -m pip uninstall -y \
  torch torchvision torchaudio xformers numpy scipy pandas protobuf \
  onnxruntime onnxruntime-gpu rembg cupy cupy-cuda11x cupy-cuda12x \
  tensorflow jax jaxlib transformers sentence-transformers accelerate peft \
  bitsandbytes triton gradio || true

step "Cai PyTorch CUDA 12.1 wheel"
run "${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  torch==2.3.1 torchvision==0.18.1 torchaudio==2.3.1 \
  --index-url https://download.pytorch.org/whl/cu121

step "Cai xformers CUDA 12.1 wheel"
run "${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  xformers==0.0.27 \
  --index-url https://download.pytorch.org/whl/cu121

if [ -s "${REQ_CLEAN}" ]; then
  step "Cai requirements con lai cua JoyVASA"
  run "${VENV_DIR}/bin/python" -m pip install --no-cache-dir -r "${REQ_CLEAN}"
fi

step "Cai package API + JoyVASA pinned versions"
run "${VENV_DIR}/bin/python" -m pip install --no-cache-dir \
  numpy==1.26.4 scipy==1.13.1 pandas==2.2.2 protobuf==3.20.3 \
  transformers==4.41.2 sentence-transformers==3.0.1 accelerate==0.31.0 peft==0.11.1 \
  fastapi==0.111.0 'uvicorn[standard]==0.30.1' python-multipart==0.0.9 \
  cloudinary==1.40.0 requests==2.32.3 qstash==2.0.1 \
  pillow==10.3.0 opencv-python-headless==4.10.0.84 imageio==2.34.1 imageio-ffmpeg==0.5.1 \
  librosa==0.10.2.post1 soundfile==0.12.1 onnxruntime==1.18.1 rembg==2.0.57 \
  bitsandbytes==0.43.1 triton==2.3.1 huggingface_hub==0.23.4

step "Force reinstall core scientific stack de tranh ABI conflict"
run "${VENV_DIR}/bin/python" -m pip install --no-cache-dir --force-reinstall \
  numpy==1.26.4 scipy==1.13.1 pandas==2.2.2 protobuf==3.20.3 onnxruntime==1.18.1

run "${VENV_DIR}/bin/python" -m pip install --no-cache-dir --no-deps --force-reinstall rembg==2.0.57

step "Build XPose ops neu co nvcc"
XPOSE_PATH="${JOYVASA_REPO}/src/utils/dependencies/XPose/models/UniPose/ops"

if [ -d "${XPOSE_PATH}" ]; then
  if cmd_exists nvcc; then
    log "Building XPose ops bang GCC/G++ ${REQUIRED_GCC_MAJOR}, CUDA_HOME=${CUDA_HOME}, MAX_JOBS=${MAX_JOBS}..."
    (
      cd "${XPOSE_PATH}"
      CUDA_HOME="${CUDA_HOME}" CUDA_PATH="${CUDA_PATH}" PATH="${CUDA_HOME}/bin:${PATH}" \
      CC="${CC}" CXX="${CXX}" FORCE_CUDA=1 MAX_JOBS="${MAX_JOBS}" \
      "${VENV_DIR}/bin/python" -m pip install --no-build-isolation .
    ) || log "WARNING: XPose build failed. Human mode van co the chay; animal mode co the fail. Xem log: ${LOG_FILE}"
  else
    log "WARNING: Khong co nvcc, bo qua build XPose ops. Human mode van co the chay; animal mode co the fail."
  fi
else
  log "Khong thay XPose ops path, bo qua."
fi

step "Download model weights"
run mkdir -p "${JOYVASA_REPO}/pretrained_weights"
cd "${JOYVASA_REPO}/pretrained_weights"

if [ ! -d JoyVASA ]; then
  run_with_size_watch "Download JoyVASA weights repo" "${JOYVASA_REPO}/pretrained_weights/JoyVASA" \
    env GIT_LFS_SKIP_SMUDGE=1 git clone --progress https://huggingface.co/jdh-algo/JoyVASA JoyVASA

  step "Git LFS pull JoyVASA weights"
  (
    cd JoyVASA
    git lfs pull &
    lfs_pid=$!

    while kill -0 "${lfs_pid}" 2>/dev/null; do
      log "[progress] JoyVASA git-lfs weights: current size $(du -sh . 2>/dev/null | awk '{print $1}')"
      sleep "${WATCH_INTERVAL}"
    done

    wait "${lfs_pid}"
  )
else
  log "JoyVASA weights folder da co, bo qua clone."
fi

if [ ! -d chinese-hubert-base ]; then
  run_with_size_watch "Download chinese-hubert-base" "${JOYVASA_REPO}/pretrained_weights/chinese-hubert-base" \
    git clone --progress https://huggingface.co/TencentGameMate/chinese-hubert-base chinese-hubert-base
else
  log "chinese-hubert-base da co, bo qua clone."
fi

if [ ! -d wav2vec2-base-960h ]; then
  run_with_size_watch "Download wav2vec2-base-960h" "${JOYVASA_REPO}/pretrained_weights/wav2vec2-base-960h" \
    git clone --progress https://huggingface.co/facebook/wav2vec2-base-960h wav2vec2-base-960h
else
  log "wav2vec2-base-960h da co, bo qua clone."
fi

step "Download LivePortrait weights"
cd "${JOYVASA_REPO}"

"${VENV_DIR}/bin/python" - <<'PY' &
from huggingface_hub import snapshot_download

snapshot_download(
    repo_id="KwaiVGI/LivePortrait",
    local_dir="pretrained_weights",
    local_dir_use_symlinks=False,
    ignore_patterns=["*.git*", "README.md", "docs"],
)
PY

liveportrait_pid=$!

while kill -0 "${liveportrait_pid}" 2>/dev/null; do
  log "[progress] LivePortrait snapshot: current pretrained_weights size $(du -sh "${JOYVASA_REPO}/pretrained_weights" 2>/dev/null | awk '{print $1}')"
  sleep "${WATCH_INTERVAL}"
done

wait "${liveportrait_pid}"

step "Download insightface buffalo_l weights"
run mkdir -p "${JOYVASA_REPO}/pretrained_weights/insightface/models/buffalo_l"
cd "${JOYVASA_REPO}/pretrained_weights/insightface/models/buffalo_l"

if [ ! -f det_10g.onnx ]; then
  run wget --progress=dot:giga https://huggingface.co/MonsterMMORPG/tools/resolve/main/det_10g.onnx
else
  log "det_10g.onnx da co, bo qua."
fi

if [ ! -f 2d106det.onnx ]; then
  run wget --progress=dot:giga https://huggingface.co/MonsterMMORPG/tools/resolve/main/2d106det.onnx
else
  log "2d106det.onnx da co, bo qua."
fi

step "Tao symlink pretrained_weights"
cd "${JOYVASA_REPO}/pretrained_weights"
run ln -sfn chinese-hubert-base "TencentGameMate:chinese-hubert-base"
run ln -sfn wav2vec2-base-960h "facebook:wav2vec2-base-960h"

step "Tao/cap nhat file .env"
cat > "${APP_DIR}/.env" <<EOF_ENV
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
CUDA_HOME=${CUDA_HOME}
CUDA_PATH=${CUDA_PATH}
PYTHONUNBUFFERED=1
EOF_ENV

step "Tao/cap nhat supervisor service ${SERVICE_NAME}"
cat > /etc/supervisor/conf.d/${SERVICE_NAME}.conf <<EOF_SUPERVISOR
[program:${SERVICE_NAME}]
command=${VENV_DIR}/bin/uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
directory=${APP_DIR}
user=root
autostart=true
autorestart=true
stdout_logfile=/var/log/${SERVICE_NAME}.out.log
stderr_logfile=/var/log/${SERVICE_NAME}.err.log
environment=PATH="${CUDA_HOME}/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${VENV_DIR}/bin",LD_LIBRARY_PATH="${CUDA_HOME}/lib64",CUDA_HOME="${CUDA_HOME}",CUDA_PATH="${CUDA_PATH}",CC="/usr/bin/gcc-12",CXX="/usr/bin/g++-12",JOYVASA_REPO_PATH="${JOYVASA_REPO}",OUTPUT_DIR="${OUTPUT_DIR}",TEMP_DIR="${TEMP_DIR}",BG_CACHE_DIR="${BG_CACHE_DIR}",HF_HOME="${MODEL_CACHE_DIR}",TRANSFORMERS_CACHE="${MODEL_CACHE_DIR}",TORCH_HOME="${MODEL_CACHE_DIR}",PYTHONUNBUFFERED="1"
stopasgroup=true
killasgroup=true
stopsignal=TERM
stopwaitsecs=60
EOF_SUPERVISOR

step "Reload supervisor"
/usr/bin/supervisord -c /etc/supervisor/supervisord.conf 2>/dev/null || true
run supervisorctl reread
run supervisorctl update

step "Verify final environment"
log "python3.10: $(python3.10 --version)"
log "gcc: $(gcc --version | head -1)"
log "g++: $(g++ --version | head -1)"

if cmd_exists nvcc; then
  log "nvcc: $(nvcc --version | tail -1)"
else
  log "nvcc: MISSING"
fi

"${VENV_DIR}/bin/python" - <<'PY'
import os
import torch
import numpy
import scipy
import onnxruntime

print("torch", torch.__version__, "cuda", torch.cuda.is_available())
print("torch cuda version", torch.version.cuda)
print("numpy", numpy.__version__, "scipy", scipy.__version__)
print("onnxruntime providers", onnxruntime.get_available_providers())
print("CUDA_HOME", os.environ.get("CUDA_HOME"))

if torch.cuda.is_available():
    print("GPU", torch.cuda.get_device_name(0))
PY

echo ""
echo "== Done =="
echo "Log file: ${LOG_FILE}"
echo "Upload deploy-model/main.py to ${APP_DIR}/main.py, then run: supervisorctl restart ${SERVICE_NAME}"
echo "Health check: curl http://localhost:${PORT}/"
BASH

sed -i 's/\r$//' ~/setup_full.sh
chmod +x ~/setup_full.sh
grep -n "Ubuntu 20.04/22.04" ~/setup_full.sh || echo "OK: khong con block cu Ubuntu 20.04/22.04"
sudo WATCH_INTERVAL=5 bash ~/setup_full.sh
