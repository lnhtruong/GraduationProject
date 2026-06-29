# pyright: reportMissingImports=false

import os
import sys
import time
import uuid
import shutil
import subprocess
import requests
import threading
import json
import hashlib
from io import BytesIO
from typing import Dict, Any, Optional

import torch
import cloudinary
import cloudinary.uploader

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from qstash import QStash
except Exception:
    QStash = None


def load_env_file(path: str = "/opt/app/.env"):
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            raw = line.strip()
            if not raw or raw.startswith("#") or "=" not in raw:
                continue
            key, value = raw.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file()


# =============================================================================
# CONFIG
# =============================================================================

QSTASH_TOKEN = os.getenv("QSTASH_TOKEN", "")
qstash_client = QStash(QSTASH_TOKEN) if QSTASH_TOKEN and QStash else None

CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

if CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
        secure=True,
    )
else:
    print("WARNING: Cloudinary env is missing. Upload will fail until env is set.")

JOYVASA_REPO_PATH = os.getenv("JOYVASA_REPO_PATH", "/opt/joyvasa/JoyVASA")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "/opt/outputs")
TEMP_DIR = os.getenv("TEMP_DIR", "/opt/mascot_temp")
BG_CACHE_DIR = os.getenv("BG_CACHE_DIR", "/opt/mascot_bg_cache")

# ultrafast | fast | balanced | quality
JOYVASA_STARTUP_MODE = os.getenv("JOYVASA_STARTUP_MODE", "fast").lower()

# remove-bg models
REMBG_FAST_MODEL = os.getenv("REMBG_FAST_MODEL", "u2netp")
REMBG_CLEAN_MODEL = os.getenv("REMBG_CLEAN_MODEL", "isnet-general-use")
LOAD_REMBG_ON_STARTUP = os.getenv("LOAD_REMBG_ON_STARTUP", "false").lower() == "true"

pipeline_run_lock = threading.Lock()
pipeline_load_lock = threading.Lock()
rembg_lock = threading.Lock()

# cache nhiều session rembg theo model
_rembg_sessions: Dict[str, Any] = {}


# =============================================================================
# PRESETS
# =============================================================================

STARTUP_PRESETS = {
    "ultrafast": {
        "flag_use_half_precision": True,
        "source_max_dim": 384,
        "source_division": 2,
        "animation_region": "lip",
        "is_smooth_motion": False,
        "flag_do_torch_compile": False,
        "flag_stitching": False,
        "flag_pasteback": False,
        "flag_normalize_lip": False,
        "flag_relative_motion": False,
        "cfg_scale": 2.0,
        "driving_multiplier": 0.9,
    },
    "fast": {
        "flag_use_half_precision": True,
        "source_max_dim": 512,
        "source_division": 2,
        "animation_region": "lip",
        "is_smooth_motion": False,
        "flag_do_torch_compile": False,
        "flag_stitching": False,
        "flag_pasteback": False,
        "flag_normalize_lip": False,
        "flag_relative_motion": False,
        "cfg_scale": 2.3,
        "driving_multiplier": 1.0,
    },
    "balanced": {
        "flag_use_half_precision": True,
        "source_max_dim": 768,
        "source_division": 2,
        "animation_region": "all",
        "is_smooth_motion": True,
        "flag_do_torch_compile": False,
        "flag_stitching": False,
        "flag_pasteback": False,
        "flag_normalize_lip": True,
        "flag_relative_motion": True,
        "cfg_scale": 2.8,
        "driving_multiplier": 1.1,
    },
    "quality": {
        "flag_use_half_precision": True,
        "source_max_dim": 1280,
        "source_division": 2,
        "animation_region": "all",
        "is_smooth_motion": True,
        "flag_do_torch_compile": False,
        "flag_stitching": True,
        "flag_pasteback": False,
        "flag_normalize_lip": True,
        "flag_relative_motion": True,
        "cfg_scale": 2.8,
        "driving_multiplier": 1.1,
    },
}

HUMAN_RUNTIME_PRESETS = {
    "ultrafast": {
        "flag_normalize_lip": False,
        "flag_relative_motion": False,
        "driving_multiplier": 0.9,
        "driving_option": "expression-friendly",
        "flag_do_crop": True,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 2.0,
    },
    "fast": {
        "flag_normalize_lip": False,
        "flag_relative_motion": False,
        "driving_multiplier": 1.0,
        "driving_option": "expression-friendly",
        "flag_do_crop": True,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 2.3,
    },
    "balanced": {
        "flag_normalize_lip": True,
        "flag_relative_motion": True,
        "driving_multiplier": 1.1,
        "driving_option": "expression-friendly",
        "flag_do_crop": True,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 2.8,
    },
    "quality": {
        "flag_normalize_lip": True,
        "flag_relative_motion": True,
        "driving_multiplier": 1.1,
        "driving_option": "expression-friendly",
        "flag_do_crop": True,
        "crop_scale": 3.0,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": True,
        "flag_pasteback": False,
        "cfg_scale": 2.8,
    },
}

ANIMAL_RUNTIME_PRESETS = {
    "ultrafast": {
        "flag_normalize_lip": False,
        "flag_relative_motion": False,
        "driving_multiplier": 0.9,
        "driving_option": "expression-friendly",
        "flag_do_crop": False,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 2.5,
    },
    "fast": {
        "flag_normalize_lip": False,
        "flag_relative_motion": False,
        "driving_multiplier": 1.0,
        "driving_option": "expression-friendly",
        "flag_do_crop": False,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 3.0,
    },
    "balanced": {
        "flag_normalize_lip": False,
        "flag_relative_motion": True,
        "driving_multiplier": 1.0,
        "driving_option": "expression-friendly",
        "flag_do_crop": False,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 4.0,
    },
    "quality": {
        "flag_normalize_lip": False,
        "flag_relative_motion": True,
        "driving_multiplier": 1.0,
        "driving_option": "expression-friendly",
        "flag_do_crop": False,
        "crop_scale": 2.3,
        "vx_ratio": 0.0,
        "vy_ratio": -0.125,
        "flag_stitching": False,
        "flag_pasteback": False,
        "cfg_scale": 4.0,
    },
}

# remove background preset
BG_REMOVE_PRESETS = {
    "fast": {
        "rembg_model": REMBG_FAST_MODEL,
        "alpha_contract_px": 0,
        "alpha_blur_px": 0.4,
        "chromakey_similarity": 0.24,
        "chromakey_blend": 0.04,
    },
    "clean": {
        "rembg_model": REMBG_CLEAN_MODEL,
        "alpha_contract_px": 1,
        "alpha_blur_px": 0.8,
        "chromakey_similarity": 0.28,
        "chromakey_blend": 0.02,
    },
}


# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(title="AI Mascot Video Generator - Optimized Human/Animal + BG Remove")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: Dict[str, Dict[str, Any]] = {}


# =============================================================================
# COMMON UTILS
# =============================================================================

def clean_filename(filename: Optional[str], fallback: str = "video.mp4") -> str:
    raw = (filename or fallback).strip().replace("\\", "/").split("/")[-1]
    return raw or fallback


def get_original_basename(filename: Optional[str], fallback: str = "video") -> str:
    return os.path.splitext(clean_filename(filename, f"{fallback}.mp4"))[0].strip() or fallback


def strip_highlight_suffix(name: Optional[str], fallback: str = "video") -> str:
    base = get_original_basename(name, fallback)
    if base.lower().endswith("_highlight"):
        base = base[:-len("_highlight")].strip()
    return base or fallback


def set_if_exists(obj, name: str, value):
    if hasattr(obj, name):
        setattr(obj, name, value)


def partial_fields(target_class, kwargs):
    return target_class(**{k: v for k, v in kwargs.items() if hasattr(target_class, k)})


def run_cmd(cmd, check=True, cwd=None):
    print(f"  CMD: {' '.join(str(x) for x in cmd)}")
    t0 = time.perf_counter()
    res = subprocess.run(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        cwd=cwd,
    )
    dt = time.perf_counter() - t0
    print(f"  CMD finished in {dt:.2f}s, returncode={res.returncode}")
    if res.returncode != 0:
        print(f"  STDERR: {res.stderr}")
        if check:
            raise RuntimeError(f"Command failed: {' '.join(str(x) for x in cmd)}\n{res.stderr}")
    return res


def download_file_from_url(url: str, local_path: str, timeout: int = 600):
    print(f"  Downloading: {url}")
    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    resp = requests.get(url, stream=True, timeout=timeout)
    resp.raise_for_status()

    with open(local_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

    print(f"  Downloaded: {local_path}")


def extract_audio_from_video(video_path: str, audio_out_path: str) -> bool:
    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "a:0",
            "-show_entries", "stream=codec_type",
            "-of", "csv=p=0",
            video_path,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    if probe.returncode != 0 or "audio" not in probe.stdout.lower():
        print(f"  No audio track found in {video_path}")
        return False

    os.makedirs(os.path.dirname(audio_out_path), exist_ok=True)

    run_cmd([
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        audio_out_path,
    ])

    return os.path.exists(audio_out_path) and os.path.getsize(audio_out_path) > 0


def upload_to_cloudinary(
    local_file_path: str,
    user_id: str,
    folder_name: str = "mascot_videos",
    job_id: str = "",
    file_type: str = "mascot",
    source_original_filename: str = "",
):
    print(f"  Uploading to Cloudinary: {local_file_path}")

    if not (CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
        raise RuntimeError("Cloudinary env is missing")

    original_base = get_original_basename(source_original_filename or os.path.basename(local_file_path))

    resp = cloudinary.uploader.upload(
        local_file_path,
        resource_type="video",
        folder=folder_name,
        public_id=f"{file_type}_{job_id}" if job_id else os.path.splitext(os.path.basename(local_file_path))[0],
        filename_override=original_base,
        context={
            "user_id": str(user_id),
            "type": file_type,
            "job_id": job_id,
        },
    )

    url = resp.get("secure_url")
    if not url:
        raise RuntimeError(f"Cloudinary did not return secure_url: {resp}")

    print(f"  Cloudinary OK: {url}")
    return url


def hash_file(path: str) -> str:
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def normalize_hex_color(value: str, default: str = "00FF00") -> str:
    value = (value or default).strip().replace("#", "").replace("0x", "")
    if len(value) != 6:
        return default
    try:
        int(value, 16)
        return value.upper()
    except Exception:
        return default


def hex_to_rgb(value: str):
    value = normalize_hex_color(value)
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16)


def get_bg_remove_preset(bg_quality_mode: str):
    mode = (bg_quality_mode or "fast").lower()
    return BG_REMOVE_PRESETS.get(mode, BG_REMOVE_PRESETS["fast"]).copy()


# =============================================================================
# BACKGROUND REMOVE + GREEN SCREEN PREPROCESS
# =============================================================================

def get_rembg_session(model_name: str):
    global _rembg_sessions

    model_name = model_name or REMBG_FAST_MODEL

    if model_name in _rembg_sessions:
        return _rembg_sessions[model_name]

    with rembg_lock:
        if model_name in _rembg_sessions:
            return _rembg_sessions[model_name]

        print(f"Loading rembg session on CPU: {model_name}")
        t0 = time.perf_counter()

        try:
            from rembg import new_session
            session = new_session(
                model_name,
                providers=["CPUExecutionProvider"],
            )
        except Exception as e:
            raise RuntimeError(
                "rembg is not installed or failed to load. "
                "Install with: pip install rembg onnxruntime"
            ) from e

        _rembg_sessions[model_name] = session
        print(f"rembg session loaded in {time.perf_counter() - t0:.2f}s")
        return session


def remove_bg_to_rgba(input_path: str, rembg_model: str):
    from PIL import Image
    from rembg import remove

    session = get_rembg_session(rembg_model)
    with open(input_path, "rb") as f:
        input_bytes = f.read()

    output_bytes = remove(
        input_bytes,
        session=session,
        alpha_matting=False,
        post_process_mask=False,
    )
    return Image.open(BytesIO(output_bytes)).convert("RGBA")


def refine_alpha_edges(rgba_img, alpha_contract_px: int = 1, alpha_blur_px: float = 0.8):
    from PIL import ImageFilter

    rgba = rgba_img.convert("RGBA")
    r, g, b, a = rgba.split()

    for _ in range(max(0, int(alpha_contract_px))):
        a = a.filter(ImageFilter.MinFilter(3))

    if alpha_blur_px and alpha_blur_px > 0:
        a = a.filter(ImageFilter.GaussianBlur(alpha_blur_px))

    rgba.putalpha(a)
    return rgba


def composite_rgba_on_green(
    rgba_img,
    output_path: str,
    green_hex: str = "00FF00",
    alpha_contract_px: int = 1,
    alpha_blur_px: float = 0.8,
):
    from PIL import Image

    green_hex = normalize_hex_color(green_hex)
    rgba_refined = refine_alpha_edges(
        rgba_img,
        alpha_contract_px=alpha_contract_px,
        alpha_blur_px=alpha_blur_px,
    )

    r, g, b = hex_to_rgb(green_hex)
    bg = Image.new("RGBA", rgba_refined.size, (r, g, b, 255))
    composed = Image.alpha_composite(bg, rgba_refined)
    composed.convert("RGB").save(output_path, "PNG", optimize=True)
    return output_path


def prepare_mascot_reference_image(
    job_id: str,
    input_path: str,
    remove_background: bool = False,
    bg_mode: str = "original",
    green_screen_color: str = "00FF00",
    bg_quality_mode: str = "fast",
    alpha_contract_px: Optional[int] = None,
    alpha_blur_px: Optional[float] = None,
) -> str:
    bg_mode = (bg_mode or "original").lower()
    green_screen_color = normalize_hex_color(green_screen_color)
    preset = get_bg_remove_preset(bg_quality_mode)

    if alpha_contract_px is None:
        alpha_contract_px = preset["alpha_contract_px"]
    if alpha_blur_px is None:
        alpha_blur_px = preset["alpha_blur_px"]

    rembg_model = preset["rembg_model"]

    if not remove_background and bg_mode != "green_screen":
        return input_path

    os.makedirs(BG_CACHE_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)

    key = (
        f"{hash_file(input_path)}|{rembg_model}|{remove_background}|{bg_mode}|"
        f"{green_screen_color}|{bg_quality_mode}|{alpha_contract_px}|{alpha_blur_px}"
    )
    cache_path = os.path.join(BG_CACHE_DIR, f"{hashlib.sha1(key.encode()).hexdigest()}.png")
    out_path = os.path.join(TEMP_DIR, f"prepared_mascot_{job_id}.png")

    if os.path.exists(cache_path) and os.path.getsize(cache_path) > 0:
        shutil.copy2(cache_path, out_path)
        print(f"[{job_id}] Using cached mascot ref: {out_path}")
        return out_path

    t0 = time.perf_counter()

    if remove_background:
        print(f"[{job_id}] Removing mascot background once with rembg ({rembg_model})...")
        rgba = remove_bg_to_rgba(input_path, rembg_model=rembg_model)
    else:
        from PIL import Image
        rgba = Image.open(input_path).convert("RGBA")

    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)

    composite_rgba_on_green(
        rgba_img=rgba,
        output_path=cache_path,
        green_hex=green_screen_color,
        alpha_contract_px=alpha_contract_px,
        alpha_blur_px=alpha_blur_px,
    )

    shutil.copy2(cache_path, out_path)
    print(f"[{job_id}] Prepared green-screen mascot in {time.perf_counter() - t0:.2f}s: {out_path}")
    return out_path


# =============================================================================
# JOYVASA PIPELINE
# =============================================================================

def get_startup_preset():
    return STARTUP_PRESETS.get(JOYVASA_STARTUP_MODE, STARTUP_PRESETS["fast"])


def get_runtime_preset(quality_mode: str, animation_mode: str):
    mode = (quality_mode or "fast").lower()
    animation_mode = (animation_mode or "human").lower()

    if animation_mode == "animal":
        return ANIMAL_RUNTIME_PRESETS.get(mode, ANIMAL_RUNTIME_PRESETS["fast"]).copy()
    return HUMAN_RUNTIME_PRESETS.get(mode, HUMAN_RUNTIME_PRESETS["fast"]).copy()


def build_joyvasa_args(ArgumentConfig, animation_mode: str):
    args = ArgumentConfig()
    startup_preset = get_startup_preset()
    animation_mode = (animation_mode or "human").lower()

    set_if_exists(args, "animation_mode", animation_mode)
    set_if_exists(args, "output_dir", OUTPUT_DIR)
    set_if_exists(args, "gradio_temp_dir", TEMP_DIR)
    set_if_exists(args, "device_id", 0)
    set_if_exists(args, "flag_force_cpu", False)
    set_if_exists(args, "flag_use_half_precision", startup_preset["flag_use_half_precision"])
    set_if_exists(args, "source_max_dim", startup_preset["source_max_dim"])
    set_if_exists(args, "source_division", startup_preset["source_division"])
    set_if_exists(args, "flag_do_torch_compile", startup_preset["flag_do_torch_compile"])

    if animation_mode == "animal":
        set_if_exists(args, "animation_region", "all")
        set_if_exists(args, "is_smooth_motion", False)
        set_if_exists(args, "flag_stitching", False)
        set_if_exists(args, "flag_pasteback", False)
        set_if_exists(args, "flag_normalize_lip", False)
        set_if_exists(args, "flag_relative_motion", False)
        set_if_exists(args, "cfg_mode", "incremental")
        set_if_exists(args, "cfg_scale", 3.0)
        set_if_exists(args, "driving_option", "expression-friendly")
        set_if_exists(args, "driving_multiplier", 1.0)
        set_if_exists(args, "flag_do_crop", False)
        set_if_exists(args, "scale", 2.3)
        set_if_exists(args, "vx_ratio", 0.0)
        set_if_exists(args, "vy_ratio", -0.125)
    else:
        set_if_exists(args, "animation_region", startup_preset["animation_region"])
        set_if_exists(args, "is_smooth_motion", startup_preset["is_smooth_motion"])
        set_if_exists(args, "flag_stitching", startup_preset["flag_stitching"])
        set_if_exists(args, "flag_pasteback", startup_preset["flag_pasteback"])
        set_if_exists(args, "flag_normalize_lip", startup_preset["flag_normalize_lip"])
        set_if_exists(args, "flag_relative_motion", startup_preset["flag_relative_motion"])
        set_if_exists(args, "cfg_mode", "incremental")
        set_if_exists(args, "cfg_scale", startup_preset["cfg_scale"])
        set_if_exists(args, "driving_option", "expression-friendly")
        set_if_exists(args, "driving_multiplier", startup_preset["driving_multiplier"])
        set_if_exists(args, "flag_do_crop", True)
        set_if_exists(args, "scale", 2.3)
        set_if_exists(args, "vx_ratio", 0.0)
        set_if_exists(args, "vy_ratio", -0.125)

    return args


def load_joyvasa_pipeline_by_mode(animation_mode: str):
    animation_mode = (animation_mode or "human").lower()

    if animation_mode not in ("human", "animal"):
        raise RuntimeError(f"Invalid animation_mode: {animation_mode}")
    if not os.path.exists(JOYVASA_REPO_PATH):
        raise RuntimeError(f"JoyVASA not found: {JOYVASA_REPO_PATH}")

    if JOYVASA_REPO_PATH not in sys.path:
        sys.path.insert(0, JOYVASA_REPO_PATH)

    os.chdir(JOYVASA_REPO_PATH)

    from src.config.argument_config import ArgumentConfig
    from src.config.inference_config import InferenceConfig
    from src.config.crop_config import CropConfig

    if animation_mode == "animal":
        from src.live_portrait_wmg_pipeline_animal import LivePortraitPipelineAnimal
        PipelineClass = LivePortraitPipelineAnimal
    else:
        from src.live_portrait_wmg_pipeline import LivePortraitPipeline
        PipelineClass = LivePortraitPipeline

    args = build_joyvasa_args(ArgumentConfig, animation_mode)
    inference_cfg = partial_fields(InferenceConfig, args.__dict__)
    crop_cfg = partial_fields(CropConfig, args.__dict__)

    pipeline = PipelineClass(
        inference_cfg=inference_cfg,
        crop_cfg=crop_cfg,
    )
    return {"args": args, "pipeline": pipeline}


def get_or_load_pipeline(animation_mode: str):
    animation_mode = (animation_mode or "human").lower()

    if animation_mode not in ("human", "animal"):
        raise RuntimeError("animation_mode must be 'human' or 'animal'")

    if not hasattr(app.state, "joyvasa_pipelines"):
        app.state.joyvasa_pipelines = {}

    if animation_mode in app.state.joyvasa_pipelines:
        return app.state.joyvasa_pipelines[animation_mode]

    with pipeline_load_lock:
        if animation_mode in app.state.joyvasa_pipelines:
            return app.state.joyvasa_pipelines[animation_mode]

        print(f"Lazy loading JoyVASA pipeline: {animation_mode}")
        t0 = time.perf_counter()
        loaded = load_joyvasa_pipeline_by_mode(animation_mode)
        app.state.joyvasa_pipelines[animation_mode] = loaded
        print(f"JoyVASA pipeline '{animation_mode}' loaded in {time.perf_counter() - t0:.2f}s")
        return loaded


def find_latest_mp4(search_dirs, min_mtime: float):
    mp4_files = []

    for d in search_dirs:
        if not d or not os.path.exists(d):
            continue

        for root, _, files in os.walk(d):
            for f in files:
                if f.lower().endswith(".mp4"):
                    p = os.path.join(root, f)
                    try:
                        if os.path.getmtime(p) >= min_mtime:
                            mp4_files.append(p)
                    except Exception:
                        pass

    if not mp4_files:
        return None

    return max(mp4_files, key=os.path.getmtime)


def create_mascot_video(
    job_id: str,
    mascot_image_path: str,
    audio_path: str,
    animation_mode: str = "human",
    quality_mode: str = "fast",
    cfg_scale: Optional[float] = None,
    driving_multiplier: Optional[float] = None,
    flag_stitching: Optional[bool] = None,
    flag_pasteback: Optional[bool] = None,
    flag_normalize_lip: Optional[bool] = None,
    flag_relative_motion: Optional[bool] = None,
    flag_do_crop: Optional[bool] = None,
    crop_scale: Optional[float] = None,
    vx_ratio: Optional[float] = None,
    vy_ratio: Optional[float] = None,
):
    animation_mode = (animation_mode or "human").lower()

    if animation_mode not in ("human", "animal"):
        raise RuntimeError("animation_mode must be 'human' or 'animal'")

    selected = get_or_load_pipeline(animation_mode)
    selected_args = selected["args"]
    selected_pipeline = selected["pipeline"]
    preset = get_runtime_preset(quality_mode, animation_mode)

    output_dir = os.path.join(OUTPUT_DIR, f"mascot_raw_{job_id}")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"mascot_raw_{job_id}.mp4")

    cfg_scale = cfg_scale if cfg_scale is not None else preset["cfg_scale"]
    driving_multiplier = driving_multiplier if driving_multiplier is not None else preset["driving_multiplier"]
    flag_stitching = flag_stitching if flag_stitching is not None else preset["flag_stitching"]
    flag_pasteback = flag_pasteback if flag_pasteback is not None else preset["flag_pasteback"]
    flag_normalize_lip = flag_normalize_lip if flag_normalize_lip is not None else preset["flag_normalize_lip"]
    flag_relative_motion = flag_relative_motion if flag_relative_motion is not None else preset["flag_relative_motion"]
    flag_do_crop = flag_do_crop if flag_do_crop is not None else preset["flag_do_crop"]
    crop_scale = crop_scale if crop_scale is not None else preset["crop_scale"]
    vx_ratio = vx_ratio if vx_ratio is not None else preset["vx_ratio"]
    vy_ratio = vy_ratio if vy_ratio is not None else preset["vy_ratio"]

    print(f"[{job_id}] JoyVASA direct pipeline")
    print(f"[{job_id}] animation_mode={animation_mode}, startup_mode={JOYVASA_STARTUP_MODE}, request_quality={quality_mode}")
    print(f"[{job_id}] cfg_scale={cfg_scale}, driving_multiplier={driving_multiplier}")
    print(f"[{job_id}] do_crop={flag_do_crop}, stitching={flag_stitching}, pasteback={flag_pasteback}")

    t0 = time.perf_counter()

    with pipeline_run_lock:
        os.chdir(JOYVASA_REPO_PATH)

        set_if_exists(selected_args, "animation_mode", animation_mode)
        set_if_exists(selected_args, "reference", os.path.abspath(mascot_image_path))
        set_if_exists(selected_args, "audio", os.path.abspath(audio_path))
        set_if_exists(selected_args, "output_dir", output_dir)
        set_if_exists(selected_args, "gradio_temp_dir", TEMP_DIR)
        set_if_exists(selected_args, "flag_normalize_lip", bool(flag_normalize_lip))
        set_if_exists(selected_args, "flag_relative_motion", bool(flag_relative_motion))
        set_if_exists(selected_args, "driving_multiplier", float(driving_multiplier))
        set_if_exists(selected_args, "driving_option", preset["driving_option"])
        set_if_exists(selected_args, "flag_do_crop", bool(flag_do_crop))
        set_if_exists(selected_args, "scale", float(crop_scale))
        set_if_exists(selected_args, "vx_ratio", float(vx_ratio))
        set_if_exists(selected_args, "vy_ratio", float(vy_ratio))
        set_if_exists(selected_args, "flag_stitching", bool(flag_stitching))
        set_if_exists(selected_args, "flag_pasteback", bool(flag_pasteback))
        set_if_exists(selected_args, "cfg_scale", float(cfg_scale))

        try:
            with torch.inference_mode():
                result = selected_pipeline.execute(selected_args)
        except Exception as e:
            err = str(e)
            if "No face detected" in err and bool(flag_do_crop):
                print(f"[{job_id}] No face detected with crop=True. Retry with flag_do_crop=False...")
                set_if_exists(selected_args, "flag_do_crop", False)
                with torch.inference_mode():
                    result = selected_pipeline.execute(selected_args)
            else:
                raise

    print(f"[{job_id}] JoyVASA finished in {time.perf_counter() - t0:.2f}s")

    candidate = None

    if isinstance(result, str):
        candidate = result
    elif isinstance(result, (list, tuple)) and len(result) > 0:
        candidate = result[0]

    if candidate and os.path.exists(candidate):
        shutil.copy2(candidate, output_path)
        print(f"[{job_id}] Mascot video created: {output_path}")
        return output_path

    latest = find_latest_mp4([output_dir, TEMP_DIR, "/tmp"], t0)
    if not latest:
        raise RuntimeError("JoyVASA produced no mp4 output")

    shutil.copy2(latest, output_path)
    print(f"[{job_id}] Mascot video created: {output_path}")
    return output_path


# =============================================================================
# FFMPEG FINAL RENDER
# =============================================================================

def escape_drawtext_text(text: str) -> str:
    text = str(text or "")
    text = text.replace("\\", "\\\\")
    text = text.replace(":", "\\:")
    text = text.replace("'", "\\'")
    text = text.replace("%", "\\%")
    text = text.replace("\n", "\\n")
    return text


def parse_text_overlays(text_overlays_raw: str):
    if not text_overlays_raw:
        return []

    try:
        data = json.loads(text_overlays_raw)
        return data if isinstance(data, list) else []
    except Exception as e:
        print(f"  text_overlays parse failed: {e}")
        return []


def build_drawtext_filters(current_label: str, text_overlays):
    filters = []

    if text_overlays and isinstance(text_overlays, list):
        for idx, overlay in enumerate(text_overlays):
            if not isinstance(overlay, dict):
                continue

            text = escape_drawtext_text(overlay.get("text", ""))
            x = overlay.get("x", 10)
            y = overlay.get("y", 10)
            fontsize = overlay.get("fontsize", 24)
            fontcolor = overlay.get("fontcolor", "white")

            enable_expr = ""
            start = overlay.get("start", None)
            end = overlay.get("end", None)

            if start is not None and end is not None:
                enable_expr = f":enable='between(t,{float(start)},{float(end)})'"
            elif start is not None:
                enable_expr = f":enable='gte(t,{float(start)})'"
            elif end is not None:
                enable_expr = f":enable='lte(t,{float(end)})'"

            out_label = f"[txt{idx + 1}]"

            filters.append(
                f"{current_label}drawtext="
                f"text='{text}':"
                f"x={x}:"
                f"y={y}:"
                f"fontsize={fontsize}:"
                f"fontcolor={fontcolor}"
                f"{enable_expr}"
                f"{out_label}"
            )
            current_label = out_label

    return filters, current_label


def render_final_video_once(
    main_video: str,
    mascot_video: str,
    output_video: str,
    position: str = "bottom-right",
    margin_x: int = 40,
    margin_y: int = 40,
    overlay_scale: float = 0.25,
    brightness: Optional[float] = None,
    contrast: Optional[float] = None,
    saturation: Optional[float] = None,
    gamma: Optional[float] = None,
    text_overlays=None,
    use_chromakey: bool = False,
    chromakey_color: str = "00FF00",
    chromakey_similarity: float = 0.24,
    chromakey_blend: float = 0.04,
):
    positions = {
        "bottom-right": f"W-w-{margin_x}:H-h-{margin_y}",
        "bottom-left": f"{margin_x}:H-h-{margin_y}",
        "top-right": f"W-w-{margin_x}:{margin_y}",
        "top-left": f"{margin_x}:{margin_y}",
        "center": "(W-w)/2:(H-h)/2",
    }
    overlay_pos = positions.get(position, positions["bottom-right"])

    filters = []
    base_label = "[0:v]"

    eq_parts = []
    if brightness is not None:
        eq_parts.append(f"brightness={brightness}")
    if contrast is not None:
        eq_parts.append(f"contrast={contrast}")
    if saturation is not None:
        eq_parts.append(f"saturation={saturation}")
    if gamma is not None:
        eq_parts.append(f"gamma={gamma}")

    if eq_parts:
        filters.append(f"{base_label}eq={':'.join(eq_parts)}[base]")
        base_label = "[base]"

    chromakey_color = normalize_hex_color(chromakey_color)

    if use_chromakey:
        filters.append(
            f"[1:v]"
            f"scale=iw*{overlay_scale}:ih*{overlay_scale},"
            f"chromakey=0x{chromakey_color}:{chromakey_similarity}:{chromakey_blend},"
            f"format=rgba,"
            f"gblur=sigma=0.3"
            f"[pip]"
        )
    else:
        filters.append(f"[1:v]scale=iw*{overlay_scale}:ih*{overlay_scale}[pip]")

    filters.append(f"{base_label}[pip]overlay={overlay_pos}:shortest=1[v0]")
    current_label = "[v0]"

    text_filters, current_label = build_drawtext_filters(current_label, text_overlays)
    filters.extend(text_filters)

    filter_complex = ";".join(filters)
    os.makedirs(os.path.dirname(output_video), exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-i", main_video,
        "-i", mascot_video,
        "-filter_complex", filter_complex,
        "-map", current_label,
        "-map", "0:a?",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-c:a", "aac",
        "-shortest",
        output_video,
    ]

    run_cmd(cmd)


def render_replace_video_once(
    mascot_video: str,
    output_video: str,
    brightness: Optional[float] = None,
    contrast: Optional[float] = None,
    saturation: Optional[float] = None,
    gamma: Optional[float] = None,
    text_overlays=None,
    use_chromakey: bool = False,
    chromakey_color: str = "00FF00",
    chromakey_similarity: float = 0.24,
    chromakey_blend: float = 0.04,
):
    filters = []
    current_label = "[0:v]"

    if use_chromakey:
        chromakey_color = normalize_hex_color(chromakey_color)
        filters.append(
            f"{current_label}"
            f"chromakey=0x{chromakey_color}:{chromakey_similarity}:{chromakey_blend},"
            f"format=rgba,"
            f"gblur=sigma=0.3"
            f"[ck]"
        )
        current_label = "[ck]"

    eq_parts = []
    if brightness is not None:
        eq_parts.append(f"brightness={brightness}")
    if contrast is not None:
        eq_parts.append(f"contrast={contrast}")
    if saturation is not None:
        eq_parts.append(f"saturation={saturation}")
    if gamma is not None:
        eq_parts.append(f"gamma={gamma}")

    if eq_parts:
        filters.append(f"{current_label}eq={':'.join(eq_parts)}[v0]")
        current_label = "[v0]"

    text_filters, current_label = build_drawtext_filters(current_label, text_overlays)
    filters.extend(text_filters)

    if not filters:
        shutil.copy2(mascot_video, output_video)
        return

    filter_complex = ";".join(filters)

    cmd = [
        "ffmpeg", "-y",
        "-i", mascot_video,
        "-filter_complex", filter_complex,
        "-map", current_label,
        "-map", "0:a?",
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-c:a", "aac",
        "-shortest",
        output_video,
    ]

    run_cmd(cmd)


# =============================================================================
# BACKGROUND TASK
# =============================================================================

def process_mascot_in_background(
    job_id,
    user_id,
    video_path,
    mascot_image_path,
    origin_file_name,
    audio_path=None,
    position="bottom-right",
    margin_x=40,
    margin_y=40,
    scale=0.25,
    text_overlays_raw="",
    brightness=None,
    contrast=None,
    saturation=None,
    gamma=None,
    remove_background=False,
    bg_mode="original",
    green_screen_color="00FF00",
    bg_quality_mode="fast",
    chromakey_similarity=None,
    chromakey_blend=None,
    alpha_contract_px=None,
    alpha_blur_px=None,
    animation_mode="human",
    quality_mode="fast",
    cfg_scale=None,
    driving_multiplier=None,
    flag_stitching=None,
    flag_pasteback=None,
    flag_normalize_lip=None,
    flag_relative_motion=None,
    flag_do_crop=None,
    crop_scale=None,
    vx_ratio=None,
    vy_ratio=None,
):
    source_original_basename = strip_highlight_suffix(origin_file_name)
    output_filename = f"mascot_{job_id}.mp4"
    output_video_path = os.path.join(OUTPUT_DIR, output_filename)
    extracted_audio_path = None
    prepared_mascot_path = None
    mascot_video_full_path = None

    bg_preset = get_bg_remove_preset(bg_quality_mode)
    if chromakey_similarity is None:
        chromakey_similarity = bg_preset["chromakey_similarity"]
    if chromakey_blend is None:
        chromakey_blend = bg_preset["chromakey_blend"]

    total_stages = 4 if remove_background or bg_mode == "green_screen" else 3
    t_job = time.perf_counter()

    try:
        jobs[job_id]["status"] = "processing"

        stage_idx = 1
        if remove_background or bg_mode == "green_screen":
            jobs[job_id]["stage"] = f"{stage_idx}/{total_stages}: Preparing green-screen mascot image"
            t = time.perf_counter()

            prepared_mascot_path = prepare_mascot_reference_image(
                job_id=job_id,
                input_path=mascot_image_path,
                remove_background=bool(remove_background),
                bg_mode=bg_mode,
                green_screen_color=green_screen_color,
                bg_quality_mode=bg_quality_mode,
                alpha_contract_px=alpha_contract_px,
                alpha_blur_px=alpha_blur_px,
            )

            print(f"[{job_id}] TIME background preprocess: {time.perf_counter() - t:.2f}s")
            stage_idx += 1
        else:
            prepared_mascot_path = mascot_image_path

        jobs[job_id]["stage"] = f"{stage_idx}/{total_stages}: Creating mascot video from image"

        driving_audio = audio_path
        if not driving_audio:
            extracted_audio_path = os.path.join(TEMP_DIR, f"extracted_audio_{job_id}.wav")
            if not extract_audio_from_video(video_path, extracted_audio_path):
                raise RuntimeError("No audio supplied and input video has no audio track. JoyVASA requires audio to drive the mascot.")
            driving_audio = extracted_audio_path

        t = time.perf_counter()
        mascot_video_full_path = create_mascot_video(
            job_id=job_id,
            mascot_image_path=prepared_mascot_path,
            audio_path=driving_audio,
            animation_mode=animation_mode,
            quality_mode=quality_mode,
            cfg_scale=cfg_scale,
            driving_multiplier=driving_multiplier,
            flag_stitching=flag_stitching,
            flag_pasteback=flag_pasteback,
            flag_normalize_lip=flag_normalize_lip,
            flag_relative_motion=flag_relative_motion,
            flag_do_crop=flag_do_crop,
            crop_scale=crop_scale,
            vx_ratio=vx_ratio,
            vy_ratio=vy_ratio,
        )
        print(f"[{job_id}] TIME JoyVASA: {time.perf_counter() - t:.2f}s")
        stage_idx += 1

        jobs[job_id]["stage"] = f"{stage_idx}/{total_stages}: Rendering final video"
        text_overlays = parse_text_overlays(text_overlays_raw)
        use_chromakey = bool(remove_background) and (bg_mode == "green_screen")

        t = time.perf_counter()
        if position == "replace":
            render_replace_video_once(
                mascot_video=mascot_video_full_path,
                output_video=output_video_path,
                brightness=brightness,
                contrast=contrast,
                saturation=saturation,
                gamma=gamma,
                text_overlays=text_overlays,
                use_chromakey=use_chromakey,
                chromakey_color=green_screen_color,
                chromakey_similarity=float(chromakey_similarity),
                chromakey_blend=float(chromakey_blend),
            )
        else:
            render_final_video_once(
                main_video=video_path,
                mascot_video=mascot_video_full_path,
                output_video=output_video_path,
                position=position,
                margin_x=margin_x,
                margin_y=margin_y,
                overlay_scale=scale,
                brightness=brightness,
                contrast=contrast,
                saturation=saturation,
                gamma=gamma,
                text_overlays=text_overlays,
                use_chromakey=use_chromakey,
                chromakey_color=green_screen_color,
                chromakey_similarity=float(chromakey_similarity),
                chromakey_blend=float(chromakey_blend),
            )
        print(f"[{job_id}] TIME FFmpeg final render: {time.perf_counter() - t:.2f}s")
        stage_idx += 1

        jobs[job_id]["stage"] = f"{stage_idx}/{total_stages}: Uploading to cloud"
        t = time.perf_counter()
        cloud_url = upload_to_cloudinary(
            local_file_path=output_video_path,
            user_id=user_id,
            folder_name=f"jobs/{job_id}",
            job_id=job_id,
            file_type="mascot",
            source_original_filename=source_original_basename,
        )
        print(f"[{job_id}] TIME upload: {time.perf_counter() - t:.2f}s")

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["stage"] = "Completed"
        jobs[job_id]["result"] = {
            "output_filename": output_filename,
            "download_url": cloud_url,
            "source_original_filename": source_original_basename,
        }
        jobs[job_id]["type"] = "mascot"
        jobs[job_id]["animation_mode"] = animation_mode
        jobs[job_id]["quality_mode"] = quality_mode
        jobs[job_id]["remove_background"] = bool(remove_background)
        jobs[job_id]["bg_mode"] = bg_mode
        jobs[job_id]["bg_quality_mode"] = bg_quality_mode

        if qstash_client:
            try:
                qstash_client.message.publish_json(
                    url_group="ai-results",
                    body={
                        "event": "completed",
                        "job_id": job_id,
                        "user_id": user_id,
                        "type": "mascot",
                        "animation_mode": animation_mode,
                        "url": cloud_url,
                        "video_url": cloud_url,
                    },
                )
            except Exception as qe:
                print(f"  QStash push failed: {qe}")
        else:
            print("  QStash skipped: QSTASH_TOKEN is missing")

        print(f"[{job_id}] Mascot job completed!")
        print(f"[{job_id}] TIME total: {time.perf_counter() - t_job:.2f}s")

    except Exception as e:
        print(f"[{job_id}] FAILED: {e}")

        jobs[job_id]["status"] = "failed"
        jobs[job_id]["stage"] = "Failed"
        jobs[job_id]["result"] = {"error": str(e)}
        jobs[job_id]["animation_mode"] = animation_mode
        jobs[job_id]["quality_mode"] = quality_mode
        jobs[job_id]["remove_background"] = bool(remove_background)
        jobs[job_id]["bg_mode"] = bg_mode
        jobs[job_id]["bg_quality_mode"] = bg_quality_mode

        if qstash_client:
            try:
                qstash_client.message.publish_json(
                    url_group="ai-results",
                    body={
                        "event": "job_failed",
                        "job_id": job_id,
                        "user_id": user_id,
                        "type": "mascot",
                        "animation_mode": animation_mode,
                        "error_message": str(e),
                    },
                )
            except Exception as qe:
                print(f"  QStash failed-push failed: {qe}")

    finally:
        cleanup_paths = [video_path, mascot_image_path, audio_path, extracted_audio_path]
        if prepared_mascot_path and prepared_mascot_path != mascot_image_path and prepared_mascot_path.startswith(TEMP_DIR):
            cleanup_paths.append(prepared_mascot_path)

        for p in cleanup_paths:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

        mascot_temp_dir = os.path.join(OUTPUT_DIR, f"mascot_raw_{job_id}")
        if os.path.exists(mascot_temp_dir):
            try:
                shutil.rmtree(mascot_temp_dir)
            except Exception:
                pass

        if os.path.exists(output_video_path):
            try:
                os.remove(output_video_path)
            except Exception:
                pass


# =============================================================================
# ROUTES
# =============================================================================

@app.post("/mascot", status_code=202)
async def create_mascot_job(
    background_tasks: BackgroundTasks,

    user_id: str = Form(...),
    video_url: str = Form(...),
    mascot_image_url: str = Form(...),
    origin_file_name: str = Form(...),

    audio: UploadFile = File(None),

    position: str = Form("bottom-right"),
    margin_x: int = Form(40),
    margin_y: int = Form(40),
    scale: float = Form(0.25),
    text_overlays: str = Form(""),

    brightness: Optional[float] = Form(None),
    contrast: Optional[float] = Form(None),
    saturation: Optional[float] = Form(None),
    gamma: Optional[float] = Form(None),

    # remove background / green screen
    remove_background: bool = Form(False),
    bg_mode: str = Form("original"),           # original | green_screen
    bg_quality_mode: str = Form("fast"),       # fast | clean
    green_screen_color: str = Form("00FF00"),
    chromakey_similarity: Optional[float] = Form(None),
    chromakey_blend: Optional[float] = Form(None),
    alpha_contract_px: Optional[int] = Form(None),
    alpha_blur_px: Optional[float] = Form(None),

    # JoyVASA
    animation_mode: str = Form("human"),       # human | animal
    quality_mode: str = Form("fast"),          # ultrafast | fast | balanced | quality
    cfg_scale: Optional[float] = Form(None),
    driving_multiplier: Optional[float] = Form(None),
    flag_stitching: Optional[bool] = Form(None),
    flag_pasteback: Optional[bool] = Form(None),
    flag_normalize_lip: Optional[bool] = Form(None),
    flag_relative_motion: Optional[bool] = Form(None),
    flag_do_crop: Optional[bool] = Form(None),
    crop_scale: Optional[float] = Form(None),
    vx_ratio: Optional[float] = Form(None),
    vy_ratio: Optional[float] = Form(None),
):
    job_id = str(uuid.uuid4())
    source_original_basename = strip_highlight_suffix(origin_file_name)
    animation_mode = (animation_mode or "human").lower()
    quality_mode = (quality_mode or "fast").lower()
    bg_mode = (bg_mode or "original").lower()
    bg_quality_mode = (bg_quality_mode or "fast").lower()

    if animation_mode not in ("human", "animal"):
        raise HTTPException(status_code=400, detail="animation_mode must be 'human' or 'animal'")
    if quality_mode not in ("ultrafast", "fast", "balanced", "quality"):
        raise HTTPException(status_code=400, detail="quality_mode must be 'ultrafast', 'fast', 'balanced' or 'quality'")
    if bg_mode not in ("original", "green_screen"):
        raise HTTPException(status_code=400, detail="bg_mode must be 'original' or 'green_screen'")
    if bg_quality_mode not in ("fast", "clean"):
        raise HTTPException(status_code=400, detail="bg_quality_mode must be 'fast' or 'clean'")

    if remove_background and bg_mode == "original":
        bg_mode = "green_screen"

    green_screen_color = normalize_hex_color(green_screen_color)

    if not mascot_image_url:
        raise HTTPException(status_code=400, detail="mascot_image_url is required")
    if not os.path.exists(JOYVASA_REPO_PATH):
        raise HTTPException(status_code=503, detail=f"JoyVASA not available: {JOYVASA_REPO_PATH}")

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(BG_CACHE_DIR, exist_ok=True)

    temp_video = os.path.join(TEMP_DIR, f"temp_video_{job_id}.mp4")
    try:
        download_file_from_url(video_url, temp_video, timeout=600)
    except Exception as e:
        if os.path.exists(temp_video):
            os.remove(temp_video)
        raise HTTPException(status_code=400, detail=f"Video download failed: {e}")

    ext = os.path.splitext(mascot_image_url.split("?")[0])[1] or ".png"
    mascot_image_path = os.path.join(TEMP_DIR, f"temp_mascot_{job_id}{ext}")
    try:
        download_file_from_url(mascot_image_url, mascot_image_path, timeout=120)
    except Exception as e:
        for p in [temp_video, mascot_image_path]:
            if p and os.path.exists(p):
                os.remove(p)
        raise HTTPException(status_code=400, detail=f"Mascot image download failed: {e}")

    temp_audio_path = None
    if audio and audio.filename:
        audio_content = await audio.read()
        if audio_content:
            audio_ext = os.path.splitext(audio.filename)[1] or ".wav"
            temp_audio_path = os.path.join(TEMP_DIR, f"temp_audio_{job_id}{audio_ext}")
            with open(temp_audio_path, "wb") as f:
                f.write(audio_content)

    jobs[job_id] = {
        "status": "pending",
        "stage": "Queued",
        "result": None,
        "source_original_filename": source_original_basename,
        "type": "mascot",
        "animation_mode": animation_mode,
        "quality_mode": quality_mode,
        "remove_background": bool(remove_background),
        "bg_mode": bg_mode,
        "bg_quality_mode": bg_quality_mode,
    }

    print(
        f"[{job_id}] mascot job queued: "
        f"animation_mode={animation_mode}, quality_mode={quality_mode}, "
        f"remove_background={remove_background}, bg_mode={bg_mode}, bg_quality_mode={bg_quality_mode}, "
        f"pos={position}, overlay_scale={scale}, has_audio={temp_audio_path is not None}"
    )

    background_tasks.add_task(
        process_mascot_in_background,
        job_id, user_id, temp_video, mascot_image_path, origin_file_name,
        temp_audio_path, position, margin_x, margin_y, scale,
        text_overlays, brightness, contrast, saturation, gamma,
        remove_background, bg_mode, green_screen_color, bg_quality_mode,
        chromakey_similarity, chromakey_blend, alpha_contract_px, alpha_blur_px,
        animation_mode, quality_mode, cfg_scale, driving_multiplier,
        flag_stitching, flag_pasteback, flag_normalize_lip, flag_relative_motion,
        flag_do_crop, crop_scale, vx_ratio, vy_ratio,
    )

    return {
        "job_id": job_id,
        "status": "pending",
        "source_original_filename": source_original_basename,
        "animation_mode": animation_mode,
        "quality_mode": quality_mode,
        "remove_background": bool(remove_background),
        "bg_mode": bg_mode,
        "bg_quality_mode": bg_quality_mode,
        "startup_mode": JOYVASA_STARTUP_MODE,
    }


@app.get("/jobs/status/{job_id}")
def get_job_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/download/{job_id}")
def download_video(job_id: str):
    job = jobs.get(job_id)
    if not job or job.get("status") != "completed":
        raise HTTPException(status_code=404, detail="Not ready")

    result = job.get("result", {})
    filename = result.get("output_filename")
    if not filename:
        raise HTTPException(status_code=404, detail="No output file")

    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=404,
            detail={
                "message": "File not found on local disk. Use Cloudinary download_url instead.",
                "download_url": result.get("download_url"),
            },
        )

    return FileResponse(path=filepath, media_type="video/mp4")


@app.get("/")
def home():
    loaded_modes = list(getattr(app.state, "joyvasa_pipelines", {}).keys())
    return {
        "service": "AI Mascot Video Generator",
        "version": "7.0-optimized-bg-remove-fast-clean",
        "device": getattr(app.state, "device", None),
        "joyvasa_path": JOYVASA_REPO_PATH,
        "startup_mode": JOYVASA_STARTUP_MODE,
        "rembg_fast_model": REMBG_FAST_MODEL,
        "rembg_clean_model": REMBG_CLEAN_MODEL,
        "output_dir": OUTPUT_DIR,
        "temp_dir": TEMP_DIR,
        "bg_cache_dir": BG_CACHE_DIR,
        "loaded_modes": loaded_modes,
        "pipeline_loaded": hasattr(app.state, "joyvasa_pipelines"),
        "note": "Use FormData: animation_mode=human|animal, remove_background=true, bg_mode=green_screen, bg_quality_mode=fast|clean",
        "endpoints": {
            "create_mascot": "POST /mascot",
            "job_status": "GET /jobs/status/{job_id}",
            "download": "GET /download/{job_id}",
        },
    }


# =============================================================================
# STARTUP
# =============================================================================

@app.on_event("startup")
async def startup_event():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    os.makedirs(BG_CACHE_DIR, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    app.state.device = device
    app.state.joyvasa_pipelines = {}

    print("=" * 80)
    print("Mascot server starting...")
    print(f"Device: {device}")
    print(f"JoyVASA path: {JOYVASA_REPO_PATH}")
    print(f"Startup mode: {JOYVASA_STARTUP_MODE}")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Temp dir: {TEMP_DIR}")
    print(f"BG cache dir: {BG_CACHE_DIR}")
    print(f"rembg fast model: {REMBG_FAST_MODEL}")
    print(f"rembg clean model: {REMBG_CLEAN_MODEL}")

    if device != "cuda":
        print("WARNING: CUDA not available. Mascot generation will be very slow.")

    if not os.path.exists(JOYVASA_REPO_PATH):
        print("JoyVASA: NOT FOUND")
        print("=" * 80)
        return

    if LOAD_REMBG_ON_STARTUP:
        try:
            get_rembg_session(REMBG_FAST_MODEL)
        except Exception as e:
            print(f"WARNING: rembg startup load failed: {e}")
            print("Background removal will fail until rembg is installed/fixed.")

    print("Loading default JoyVASA human pipeline...")
    t0 = time.perf_counter()
    app.state.joyvasa_pipelines["human"] = load_joyvasa_pipeline_by_mode("human")
    print(f"Human pipeline loaded in {time.perf_counter() - t0:.2f}s")
    print("Animal pipeline will be lazy-loaded when API receives animation_mode=animal")
    print("Mascot server ready!")
    print("=" * 80)
