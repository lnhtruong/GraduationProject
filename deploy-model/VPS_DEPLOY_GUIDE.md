# Huong Dan Deploy JoyVASA Len VPS GPU

Guide nay di theo thu tu thuc te: mua VPS GPU -> SSH vao may -> upload code -> chay setup -> dien key -> start server -> test API.

## 0. Can Chuan Bi

O may local:

- Folder hien tai: `deploy-model`
- Co cac file:
  - `main.py`
  - `setup_full.sh`
  - `setup_api_only.sh`
  - `joyvasa_wrapper.py`
- Co thong tin VPS:
  - IP/domain
  - SSH port
  - username, thuong la `root`
  - password hoac SSH key

O VPS:

- Nen chon image Ubuntu 22.04/20.04 co NVIDIA driver san neu nha cung cap co option.
- GPU nen co VRAM kha kha. Human mode nhe hon animal mode.
- Disk nen du rong, vi JoyVASA weights + env co the ton hon 15GB.

## 1. Sau Khi Mua VPS GPU

SSH vao VPS:

```powershell
$PORT = 2291
$VPS = "root@n2.ckey.vn"
ssh -p $PORT $VPS
```

Neu dung IP:

```powershell
$PORT = 22
$VPS = "root@YOUR_VPS_IP"
ssh -p $PORT $VPS
```

Kiem tra GPU:

```bash
nvidia-smi
```

Neu `nvidia-smi` khong chay, dung chay setup voi hy vong no tu sua. Hay chon lai image co NVIDIA driver/CUDA san, hoac cai driver theo huong dan nha cung cap VPS.

Kiem tra disk/RAM:

```bash
df -h
free -h
```

## 2. Tao Folder Tren VPS

Chay tren VPS:

```bash
mkdir -p /opt/app /opt/joyvasa /opt/outputs /opt/mascot_temp /opt/mascot_bg_cache /opt/models
```

Y nghia:

```text
/opt/app                code FastAPI: main.py, joyvasa_wrapper.py
/opt/joyvasa/JoyVASA    repo JoyVASA
/opt/outputs            video output tam thoi
/opt/mascot_temp        file input/audio/temp
/opt/mascot_bg_cache    cache anh mascot da remove background
/opt/models             cache HuggingFace/Torch
```

## 3. Upload File Tu May Local Len VPS

Mo PowerShell tai folder `deploy-model` tren may local:

```powershell
cd E:\TotNghiep\Source\GraduationProject\deploy-model
```

Set bien:

```powershell
$PORT = 2291
$VPS = "root@n2.ckey.vn"
```

Upload setup va code:

```powershell
scp -P $PORT .\setup_full.sh ${VPS}:~/setup_full.sh
scp -P $PORT .\setup_api_only.sh ${VPS}:~/setup_api_only.sh
scp -P $PORT .\main.py ${VPS}:/opt/app/main.py
scp -P $PORT .\joyvasa_wrapper.py ${VPS}:/opt/app/joyvasa_wrapper.py
```

Neu SSH port la 22 thi doi `$PORT = 22`.

## 4. Chay Setup Lan Dau

SSH vao VPS:

```powershell
ssh -p $PORT $VPS
```

Tren VPS, fix line ending va chay full setup:

```bash
sed -i 's/\r$//' ~/setup_full.sh
bash ~/setup_full.sh
```

Script nay se:

- Cai `ffmpeg`, `python3.10`, `supervisor`, build tools.
- Tao Python env tai `/opt/venv`.
- Clone JoyVASA vao `/opt/joyvasa/JoyVASA`.
- Cai dependency giong notebook Colab da optimize.
- Tai JoyVASA weights vao `/opt/joyvasa/JoyVASA/pretrained_weights`.
- Tao supervisor service `highlight-api`.
- Tao file env mau `/opt/app/.env`.

Lan dau co the mat lau vi tai model va cai package.

## 5. Dien Key Va Config Vao `.env`

Mo file env tren VPS:

```bash
nano /opt/app/.env
```

Dien key that vao:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
QSTASH_TOKEN=your_qstash_token

JOYVASA_REPO_PATH=/opt/joyvasa/JoyVASA
OUTPUT_DIR=/opt/outputs
TEMP_DIR=/opt/mascot_temp
BG_CACHE_DIR=/opt/mascot_bg_cache

JOYVASA_STARTUP_MODE=fast
REMBG_FAST_MODEL=u2netp
REMBG_CLEAN_MODEL=isnet-general-use
LOAD_REMBG_ON_STARTUP=false

HF_HOME=/opt/models
TRANSFORMERS_CACHE=/opt/models
TORCH_HOME=/opt/models
PYTHONUNBUFFERED=1
```

Giai thich config:

```text
JOYVASA_STARTUP_MODE=ultrafast  nhanh nhat, chat luong thap hon
JOYVASA_STARTUP_MODE=fast       nen dung mac dinh
JOYVASA_STARTUP_MODE=balanced   dep hon, nang hon
JOYVASA_STARTUP_MODE=quality    nang nhat
```

`LOAD_REMBG_ON_STARTUP=false` nghia la khong load rembg luc start server. Neu request dau tien co remove background thi luc do moi load. Neu muon request dau nhanh hon va RAM du, doi thanh:

```env
LOAD_REMBG_ON_STARTUP=true
```

Luu file trong nano:

```text
Ctrl + O -> Enter -> Ctrl + X
```

## 6. Start Hoac Restart Server

Sau khi setup va dien `.env`:

```bash
supervisorctl restart highlight-api
```

Kiem tra service:

```bash
supervisorctl status highlight-api
```

Neu thay `RUNNING` la server da len.

Xem log:

```bash
supervisorctl tail -f highlight-api
```

Hoac:

```bash
tail -f /var/log/highlight-api.out.log
tail -f /var/log/highlight-api.err.log
```

Luc start, log se co cac dong kieu:

```text
Mascot server starting...
Device: cuda
JoyVASA path: /opt/joyvasa/JoyVASA
Startup mode: fast
Loading default JoyVASA human pipeline...
Human pipeline loaded in ...
Mascot server ready!
```

Quan trong: `human` pipeline duoc load san luc start server. Request `animation_mode=human` sau do se khong load model lai.

## 7. Mo Port Firewall Neu Can

Server chay port:

```text
1434
```

Test noi bo tren VPS:

```bash
curl http://localhost:1434/
```

Neu muon backend ben ngoai goi truc tiep toi VPS:

```bash
ufw allow 1434/tcp
ufw status
```

Neu nha cung cap VPS co firewall/security group rieng, mo them port `1434` tren dashboard nha cung cap.

URL public se la:

```text
http://YOUR_VPS_IP:1434
```

Hoac neu co domain/reverse proxy:

```text
https://your-domain.com
```

## 8. Test API Health

Tren VPS:

```bash
curl http://localhost:1434/
```

Ket qua mong doi:

```json
{
  "service": "AI Mascot Video Generator",
  "device": "cuda",
  "joyvasa_path": "/opt/joyvasa/JoyVASA",
  "loaded_modes": ["human"],
  "pipeline_loaded": true
}
```

Neu `device` la `cpu`, GPU/CUDA dang co van de.

## 9. Goi API Tao Mascot

Endpoint:

```text
POST /mascot
```

Body la `multipart/form-data`.

Field toi thieu:

```text
user_id
video_url
mascot_image_url
origin_file_name
animation_mode
quality_mode
```

Vi du test tren VPS:

```bash
curl -X POST http://localhost:1434/mascot \
  -F "user_id=1" \
  -F "video_url=https://example.com/input.mp4" \
  -F "mascot_image_url=https://example.com/mascot.png" \
  -F "origin_file_name=input.mp4" \
  -F "animation_mode=human" \
  -F "quality_mode=fast"
```

Ket qua se tra ve:

```json
{
  "job_id": "xxxx",
  "status": "pending",
  "animation_mode": "human",
  "quality_mode": "fast"
}
```

Check trang thai:

```bash
curl http://localhost:1434/jobs/status/JOB_ID
```

Khi xong, response co:

```json
{
  "status": "completed",
  "result": {
    "download_url": "https://res.cloudinary.com/..."
  }
}
```

## 10. Test JoyVASA Truc Tiep Khong Qua API

Dung de debug model co chay khong:

```bash
cd /opt/app
/opt/venv/bin/python joyvasa_wrapper.py \
  -r /opt/joyvasa/JoyVASA/assets/examples/imgs/joyvasa_001.png \
  -a /opt/joyvasa/JoyVASA/assets/examples/audios/joyvasa_001.wav \
  -o /tmp/test_joyvasa.mp4 \
  --animation_mode human \
  --quality_mode fast
```

Neu thanh cong:

```bash
ls -lh /tmp/test_joyvasa.mp4
```

## 11. Update Code Sau Nay

Neu chi sua `main.py`:

```powershell
$PORT = 2291
$VPS = "root@n2.ckey.vn"
scp -P $PORT .\main.py ${VPS}:/opt/app/main.py
ssh -p $PORT $VPS "supervisorctl restart highlight-api"
```

Neu sua wrapper test:

```powershell
scp -P $PORT .\joyvasa_wrapper.py ${VPS}:/opt/app/joyvasa_wrapper.py
```

Neu sua setup script, chi upload lai script. Khong can chay setup lai neu env/model da on.

## 12. Khi Nao Dung File Nao

```text
setup_full.sh
  Dung lan dau tren VPS moi. Clone JoyVASA, cai env, tai weights.

setup_api_only.sh
  Dung khi VPS da co /opt/joyvasa/JoyVASA va weights roi, chi muon cai/cap nhat API env.

setup.sh
setup_joyvasa_fast.sh
  Chi la alias ve setup_full.sh de tranh chay nham stack cu.

main.py
  Server FastAPI that su.

joyvasa_wrapper.py
  File test CLI truc tiep. API production khong goi file nay.
```

## 13. Troubleshooting Nhanh

Service khong chay:

```bash
supervisorctl status highlight-api
tail -100 /var/log/highlight-api.err.log
```

Khong thay GPU:

```bash
nvidia-smi
/opt/venv/bin/python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NO GPU')"
```

JoyVASA path loi:

```bash
ls -la /opt/joyvasa/JoyVASA
cat /opt/app/.env | grep JOYVASA_REPO_PATH
```

Cloudinary upload fail:

```bash
cat /opt/app/.env | grep CLOUDINARY
supervisorctl restart highlight-api
```

Het disk:

```bash
df -h
du -sh /opt/joyvasa /opt/venv /opt/outputs /opt/mascot_temp /opt/models
```

Clear temp:

```bash
find /opt/mascot_temp -type f -mtime +1 -delete
find /opt/outputs -type f -mtime +1 -delete
```

## 14. Luong Chay Tom Tat

```text
1. VPS boot len, co GPU.
2. Chay setup_full.sh.
3. setup clone JoyVASA vao /opt/joyvasa/JoyVASA.
4. setup cai Python env vao /opt/venv.
5. setup tao supervisor service highlight-api.
6. Dien key vao /opt/app/.env.
7. Restart highlight-api.
8. main.py start, load san human JoyVASA pipeline.
9. Backend goi POST /mascot.
10. API download video_url + mascot_image_url.
11. JoyVASA generate mascot video.
12. FFmpeg render overlay/replace.
13. Upload Cloudinary.
14. Check /jobs/status/{job_id} de lay download_url.
```
