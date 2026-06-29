# JoyVASA VPS Deploy

Huong dan tung buoc tu luc mua VPS GPU den luc goi API nam o [`VPS_DEPLOY_GUIDE.md`](./VPS_DEPLOY_GUIDE.md).

Folder nay deploy API mascot tu `lastest_colab.ipynb` len VPS. Ban moi chay JoyVASA in-process trong FastAPI, khong con goi JoyVASA qua subprocess rieng nua. `subprocess` trong `main.py` chi con dung cho `ffmpeg/ffprobe`.

## Kien truc moi

- API app: `/opt/app/main.py`
- Python env duy nhat: `/opt/venv`
- JoyVASA repo: `/opt/joyvasa/JoyVASA`
- Output: `/opt/outputs`
- Temp: `/opt/mascot_temp`
- Background cache: `/opt/mascot_bg_cache`
- Service: `highlight-api` tren port `1434`

Ly do dung mot env/process: JoyVASA pipeline duoc load vao FastAPI startup/lazy load, tranh viec spawn process con lam ton RAM/VRAM va de crash tren VPS RAM thap.

## File chinh

- `main.py`: FastAPI app lay tu `lastest_colab.ipynb`, da doi default path sang VPS.
- `setup_full.sh`: setup tu dau: system packages, `/opt/venv`, JoyVASA repo, weights, supervisor.
- `setup_api_only.sh`: dung khi VPS da co `/opt/joyvasa/JoyVASA`, chi cai/cap nhat API env va supervisor.
- `setup_joyvasa_fast.sh` va `setup.sh`: alias ve `setup_full.sh` de tranh chay nham stack cu.
- `joyvasa_wrapper.py`: chi de test CLI truc tiep, khong phai bridge subprocess nua.

## Deploy lan dau

Chay tu may local trong folder `deploy-model`:

```powershell
$PORT = 2291
$VPS = "root@n2.ckey.vn"

ssh -p $PORT $VPS "mkdir -p /opt/app /opt/joyvasa /opt/outputs /opt/mascot_temp /opt/mascot_bg_cache"
scp -P $PORT .\setup_full.sh ${VPS}:~/setup_full.sh
scp -P $PORT .\main.py ${VPS}:/opt/app/main.py
scp -P $PORT .\joyvasa_wrapper.py ${VPS}:/opt/app/joyvasa_wrapper.py
ssh -p $PORT $VPS "sed -i 's/\r$//' ~/setup_full.sh && bash ~/setup_full.sh && supervisorctl restart highlight-api"
```

Neu VPS da co JoyVASA weights roi:

```powershell
scp -P $PORT .\setup_api_only.sh ${VPS}:~/setup_api_only.sh
scp -P $PORT .\main.py ${VPS}:/opt/app/main.py
ssh -p $PORT $VPS "sed -i 's/\r$//' ~/setup_api_only.sh && bash ~/setup_api_only.sh && supervisorctl restart highlight-api"
```

## Environment can set tren VPS

Sua `/opt/app/.env` hoac supervisor `environment` neu can:

```bash
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
QSTASH_TOKEN=...
JOYVASA_STARTUP_MODE=fast        # ultrafast | fast | balanced | quality
LOAD_REMBG_ON_STARTUP=false
```

`main.py` tu load `/opt/app/.env` luc startup, nen sua file xong chi can `supervisorctl restart highlight-api`.

## API payload moi

`POST /mascot` nhan `multipart/form-data`:

```text
user_id: string
video_url: string
mascot_image_url: string
origin_file_name: string
audio: optional file
position: bottom-right | bottom-left | top-right | top-left | center | replace
scale: float, default 0.25
animation_mode: human | animal
quality_mode: ultrafast | fast | balanced | quality
remove_background: boolean
bg_mode: original | green_screen
bg_quality_mode: fast | clean
```

API tra ve `job_id`, check bang:

```bash
curl http://localhost:1434/jobs/status/<job_id>
```

## Lenh van hanh

```bash
supervisorctl status highlight-api
supervisorctl restart highlight-api
supervisorctl tail -f highlight-api
curl http://localhost:1434/
nvidia-smi
```

Test JoyVASA truc tiep, khong qua HTTP:

```bash
cd /opt/app
/opt/venv/bin/python joyvasa_wrapper.py \
  -r /opt/joyvasa/JoyVASA/assets/examples/imgs/joyvasa_001.png \
  -a /opt/joyvasa/JoyVASA/assets/examples/audios/joyvasa_001.wav \
  -o /tmp/test_joyvasa.mp4 \
  --animation_mode human \
  --quality_mode fast
```

## Troubleshooting

- `JoyVASA not available`: kiem tra `JOYVASA_REPO_PATH=/opt/joyvasa/JoyVASA` va file repo ton tai.
- Cloudinary upload fail: set `CLOUDINARY_*` vao supervisor environment roi `supervisorctl restart highlight-api`.
- Animal mode fail: XPose build co the loi; human mode van chay. Cai lai build deps roi chay lai `setup_full.sh`.
- CUDA false: kiem tra driver bang `nvidia-smi`, sau do test `/opt/venv/bin/python -c "import torch; print(torch.cuda.is_available())"`.
