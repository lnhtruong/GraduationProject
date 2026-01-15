


# 🚀 Hướng dẫn Deploy API lên VPS

## 🔧 Setup Lần Đầu

### Bước 1: Chuẩn bị files trên local

```powershell
# Kiểm tra các file cần thiết
ls setup.sh          # Script setup tự động
ls main.py           # FastAPI application
ls sadtalker_wrapper.py  # Wrapper cho SadTalker (QUAN TRỌNG!)
ls cleanup_vps.sh    # Script cleanup (optional)
```

### Bước 2: Upload files lên VPS

```powershell
# Thay PORT và VPS_IP cho phù hợp
$PORT = 3931
$VPS = "root@n1.ckey.vn"

# Upload setup script
scp -P $PORT .\setup.sh ${VPS}:~/setup.sh
scp -P $PORT .\cleanup_vps.sh ${VPS}:~/cleanup_vps.sh

# Tạo thư mục app
ssh -p $PORT $VPS "mkdir -p /opt/app /opt/sadtalker"

# Upload application files
scp -P $PORT .\main.py ${VPS}:/opt/app/main.py
scp -P $PORT .\sadtalker_wrapper.py ${VPS}:/opt/sadtalker/sadtalker_wrapper.py
```

### Bước 3: SSH vào VPS và chạy setup

```bash
# Kết nối SSH (thay PORT và VPS cho đúng)
ssh -p 3931 root@n1.ckey.vn

# Chạy setup (mất ~15-20 phút)
chmod +x ~/setup.sh
~/setup.sh
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
# Start API
supervisorctl start highlight-api

# Kiểm tra status
supervisorctl status highlight-api

# Xem logs realtime
supervisorctl tail -f highlight-api

# Test API
curl http://localhost:8000/
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