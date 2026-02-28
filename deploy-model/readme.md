


# 🚀 Hướng dẫn Deploy API lên VPS

## 🔧 Setup Lần Đầu

### Bước 1: Setup JoyVASA trên VPS

```powershell
# SSH vào VPS
ssh -p 2291 root@n2.ckey.vn

# Chạy script setup JoyVASA (nếu chưa có)
bash ~/setup_joyvasa_fast.sh

# Hoặc nếu đã có, chỉ cần verify:
ls /opt/joyvasa/JoyVASA/pretrained_weights/  # Phải có models
conda env list | grep joyvasa 
```

### Bước 2: Setup API dependencies

```powershell
# Upload script setup (từ máy local)
$PORT = 2291
$VPS = "root@n2.ckey.vn"
scp -P $PORT .\setup_api_only.sh ${VPS}:~/setup_api_only.sh

# SSH và chạy script
ssh -p 2291 root@n2.ckey.vn
bash ~/setup_api_only.sh

# Verify:
/opt/venv/bin/python -c "import torch; print(torch.cuda.is_available())"
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
- ✅ Cài đặt: Python 3.10, FFmpeg, CUDA tools
- ✅ Tạo virtual environment tại `/opt/venv`
- ✅ Cài đặt PyTorch 2.1.2 + CUDA 12.1
- ✅ Cài đặt SadTalker trong conda env `/opt/conda/envs/sadtalker`
- ✅ Patch NumPy compatibility issues
- ✅ Fix supervisor killasgroup
- ✅ Cấu hình Supervisor tự động chạy API

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
scp -P 3931 .\main.py root@n1.ckey.vn:/opt/app/main.py

# Hoặc upload wrapper nếu có thay đổi
scp -P 3931 .\sadtalker_wrapper.py root@n1.ckey.vn:/opt/sadtalker/
```

```bash
# SSH vào và restart
ssh -p 3931 root@n1.ckey.vn
supervisorctl restart highlight-api

# Xem logs để kiểm tra
supervisorctl tail -f highlight-api
```

---

## 🛠️ Troubleshooting

### SadTalker bị "Terminated" (-15)
```bash
# Kiểm tra wrapper có đúng không
ls -l /opt/sadtalker/sadtalker_wrapper.py

# Test wrapper trực tiếp
cd /opt/sadtalker/SadTalker
/opt/conda/envs/sadtalker/bin/python /opt/sadtalker/sadtalker_wrapper.py --help

# Nếu fail, check log
cat /tmp/sadtalker_*.log
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

# Test PyTorch CUDA
/opt/venv/bin/python -c "import torch; print(torch.cuda.is_available())"

# Test SadTalker CUDA
/opt/conda/envs/sadtalker/bin/python -c "import torch; print(torch.cuda.is_available())"
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
├── sadtalker/
│   ├── sadtalker_wrapper.py # Wrapper (QUAN TRỌNG!)
│   └── SadTalker/           # SadTalker repo
├── conda/
│   └── envs/
│       └── sadtalker/       # Conda env cho SadTalker
└── outputs/                 # Video outputs

/tmp/
├── sadtalker_*.log          # SadTalker logs
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
cat /tmp/sadtalker_<JOB_ID>.log

# System info
nvidia-smi                   # GPU status
df -h                        # Disk space
free -h                      # Memory
ps aux | grep python         # Python processes

# Cleanup temps
rm -rf /tmp/video_*
rm -rf /tmp/audio_*
rm -rf /tmp/sadtalker_*.log
```

---

## ⚠️ Lưu ý quan trọng

1. **KHÔNG xóa `sadtalker_wrapper.py`** - File này là giải pháp cho SIGTERM bug
2. **KHÔNG chạy `python inference.py`** trực tiếp - Sẽ bị Terminated
3. Setup chỉ chạy **1 lần đầu**, sau đó chỉ upload file và restart
4. Khi SadTalker chạy lâu (2-3 phút), đừng panic - đó là bình thường
5. Check log tại `/tmp/sadtalker_*.log` nếu có lỗi

---

## 📞 Debug nhanh

```bash
# API có chạy không?
curl http://localhost:8000/

# GPU có hoạt động không?
nvidia-smi

# Python environments đúng không?
/opt/venv/bin/python --version                    # API (3.10.x)
/opt/conda/envs/sadtalker/bin/python --version    # SadTalker (3.10.x)

# Test imports
/opt/venv/bin/python -c "import torch; import transformers; print('API OK')"
/opt/conda/envs/sadtalker/bin/python -c "from inference import main; print('SadTalker OK')"
```