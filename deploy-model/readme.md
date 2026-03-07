


# 🚀 Hướng dẫn Deploy API lên VPS

## 🔧 Setup Lần Đầu

### Bước 1: Setup JoyVASA trên VPS

```powershell
# Chỉ cần 2 bước:
$PORT = 2291; $VPS = "root@n2.ckey.vn"

# 1. Upload & setup (20-30 phút)
ssh -p $PORT $VPS "mkdir -p /opt/app /opt/joyvasa /opt/outputs"
scp -P $PORT .\setup_full.sh ${VPS}:~/
scp -P $PORT .\main.py ${VPS}:/opt/app/
scp -P $PORT .\joyvasa_wrapper.py ${VPS}:/opt/joyvasa/

# Fix line endings và chạy
ssh -p $PORT $VPS "sed -i 's/\r$//' ~/setup_full.sh && bash ~/setup_full.sh"

# 2. Start API
ssh -p $PORT $VPS "supervisorctl restart highlight-api"
```

### Bước 2: Setup API dependencies

```powershell
# Upload script setup (từ máy local)
chmod +x ~/setup_full.sh
~/setup_full.sh
supervisorctl restart highlight-api"

# # SSH và chạy script
# ssh -p 2291 root@n2.ckey.vn
# bash ~/setup_api_only.sh

# # Verify:
# /opt/venv/bin/python -c "import torch; print(torch.cuda.is_available())"
```

### Bước 3: Upload các file code

```bash
# Từ máy local, upload 2 file chính:
$PORT = 2291
$VPS = "root@n2.ckey.vn"

scp -P $PORT .\main.py ${VPS}:/opt/app/main.py
scp -P $PORT .\joyvasa_wrapper.py ${VPS}:/opt/joyvasa/joyvasa_wrapper.py
```

**Setup sẽ tự động:**
- ✅ Cài đặt: Python 3.10, FFmpeg, CUDA tools, pkg-config
- ✅ Tạo virtual environment tại `/opt/venv`
- ✅ Cài đặt PyTorch 2.1.2 + CUDA 12.1
- ✅ Cài đặt JoyVASA trong conda env `/opt/conda/envs/joyvasa`
- ✅ Download models (~6GB): JoyVASA, Chinese Hubert, Wav2Vec2, LivePortrait, InsightFace
- ✅ Tạo symlinks cho model paths (TencentGameMate:chinese-hubert-base)
- ✅ Cấu hình Supervisor tự động chạy API
- ✅ NumPy<2, transformers 4.39.2 cho Qwen2Tokenizer

### Bước 4: Khởi động service

```bash
# SSH vào VPS
ssh -p 2291 root@n2.ckey.vn

# Restart service
supervisorctl restart highlight-api

# Xem logs để verify
supervisorctl tail -f highlight-api
```

---

## 🔄 Update Code (Sau khi đã setup)

Khi có thay đổi code, chỉ cần:

```powershell
# Upload file đã sửa
$PORT = 2291; $VPS = "root@n2.ckey.vn"
scp -P $PORT .\main.py ${VPS}:/opt/app/main.py

# Hoặc upload wrapper nếu có thay đổi
scp -P $PORT .\joyvasa_wrapper.py ${VPS}:/opt/joyvasa/
```

```bash
# SSH vào và restart
ssh -p 2291 root@n2.ckey.vn
supervisorctl restart highlight-api

# Xem logs để kiểm tra
supervisorctl tail -f highlight-api
```

---

## 🛠️ Troubleshooting

### JoyVASA model path error (TencentGameMate:chinese-hubert-base)
```bash
# Tạo symlinks cho model paths
cd /opt/joyvasa/JoyVASA/pretrained_weights
ln -sf chinese-hubert-base "TencentGameMate:chinese-hubert-base"
ln -sf wav2vec2-base-960h "facebook:wav2vec2-base-960h"

# Verify
ls -la | grep ":"

# Restart API
supervisorctl restart highlight-api
```

### JoyVASA bị lỗi khi generate video
```bash
# Check wrapper
ls -l /opt/joyvasa/joyvasa_wrapper.py

# Test wrapper trực tiếp
/opt/conda/envs/joyvasa/bin/python /opt/joyvasa/joyvasa_wrapper.py \
  -r /opt/joyvasa/JoyVASA/assets/examples/imgs/joyvasa_001.png \
  -a /opt/joyvasa/JoyVASA/assets/examples/audios/joyvasa_001.wav \
  -o /tmp/test.mp4 \
  --animation_mode human

# Check GPU trong conda env
/opt/conda/envs/joyvasa/bin/python -c "import torch; print(torch.cuda.is_available())"
```

### API không start
```bash
# Check logs
tail -100 /var/log/highlight-api.err.log

# Check supervisor config
cat /etc/supervisor/conf.d/highlight-api.conf

# Restart supervisor
systemctl restart supervisor
supervisorctl reread
supervisorctl update
```

### GPU không hoạt động
```bash
# Check CUDA
nvidia-smi
nvcc --version

# Test PyTorch CUDA trong API venv
/opt/venv/bin/python -c "import torch; print(torch.cuda.is_available())"

# Test PyTorch CUDA trong JoyVASA conda env
/opt/conda/envs/joyvasa/bin/python -c "import torch; print(torch.cuda.is_available())"
```

### Cleanup và setup lại từ đầu
```bash
# Chạy cleanup script
chmod +x ~/cleanup_vps.sh
~/cleanup_vps.sh

# Setup lại
~/setup.sh
```

---

## 📁 Cấu trúc thư mục trên VPS

```
/opt/
├── app/
│   └── main.py              # FastAPI application
├── venv/                    # Python venv cho API
├── joyvasa/
│   ├── joyvasa_wrapper.py   # Wrapper (QUAN TRỌNG!)
│   └── JoyVASA/             # JoyVASA repo
│       └── pretrained_weights/  # Models (~6GB)
├── conda/
│   └── envs/
│       └── joyvasa/         # Conda env cho JoyVASA
├── outputs/                 # Video outputs
└── models/                  # HuggingFace cache (Whisper, LLM, etc.)

/tmp/
├── joyvasa_output/          # JoyVASA temp outputs
├── video_*.mp4              # Temp videos
└── audio_*.wav              # Temp audio files

/etc/supervisor/conf.d/
└── highlight-api.conf       # Supervisor config
```

---

## 🎯 Các lệnh quan trọng

```bash
# Service management
supervisorctl start highlight-api
supervisorctl stop highlight-api
supervisorctl restart highlight-api
supervisorctl status

# Logs
supervisorctl tail -f highlight-api
tail -f /var/log/highlight-api.err.log

# System info
nvidia-smi                   # GPU status
df -h                        # Disk space
free -h                      # Memory
ps aux | grep python         # Python processes

# Cleanup temps
rm -rf /tmp/video_*
rm -rf /tmp/audio_*
rm -rf /tmp/joyvasa_output
```

---

## ⚠️ Lưu ý quan trọng

1. **KHÔNG xóa `joyvasa_wrapper.py`** - File này bridge giữa subprocess và JoyVASA inference
2. **JoyVASA timeout: 900s (15 phút)** - Chậm hơn SadTalker, cần kiên nhẫn
3. Setup chỉ chạy **1 lần đầu**, sau đó chỉ upload file và restart
4. **animation_mode**: "human" (mặt người) hoặc "animal" (động vật)
5. Model symlinks quan trọng: `TencentGameMate:chinese-hubert-base` → `chinese-hubert-base`

---

## 📞 Debug nhanh

```bash
# API có chạy không?
curl http://localhost:1434/

# GPU có hoạt động không?
nvidia-smi

# Python environments đúng không?
/opt/venv/bin/python --version                    # API (3.10.x)
/opt/conda/envs/joyvasa/bin/python --version      # JoyVASA (3.10.x)

# Test imports
/opt/venv/bin/python -c "import torch; import transformers; print('API OK')"
/opt/conda/envs/joyvasa/bin/python -c "import torch; print(f'JoyVASA OK - CUDA: {torch.cuda.is_available()}')"

# Test JoyVASA với sample
cd /opt/joyvasa/JoyVASA
/opt/conda/envs/joyvasa/bin/python /opt/joyvasa/joyvasa_wrapper.py \
  -r assets/examples/imgs/joyvasa_001.png \
  -a assets/examples/audios/joyvasa_001.wav \
  -o /tmp/test_joyvasa.mp4 \
  --animation_mode human
```