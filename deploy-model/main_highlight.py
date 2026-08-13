# --- IMPORTS ---
import os, time, uuid, shutil, re, json, subprocess, logging, threading
from typing import Dict, Any, List, Optional
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
import torch
import numpy as np
import cloudinary, cloudinary.uploader
from faster_whisper import WhisperModel
from sentence_transformers import SentenceTransformer, util
from transformers import AutoTokenizer, AutoModelForCausalLM, logging as hf_logging

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

from qstash import QStash
from openai import OpenAI, BadRequestError

import unicodedata
from fontTools.ttLib import TTFont
from typing import Any, Dict, List


# ============================================================================
# CONFIG
# ============================================================================
hf_logging.set_verbosity_error()


def load_env_file(path: str = None):
    """Load KEY=VALUE lines from a .env file into os.environ (does not override already-set vars)."""
    path = path or os.environ.get("HIGHLIGHT_ENV_FILE", "/opt/app_highlight/.env")
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


OPENAI_API_KEY    = os.environ.get("OPENAI_API_KEY", "")
OPENAI_MODEL      = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")
QSTASH_TOKEN      = os.environ.get("QSTASH_TOKEN", "")
QSTASH_URL_GROUP  = os.environ.get("QSTASH_URL_GROUP", "ai-results")
CLOUDINARY_NAME   = os.environ.get("CLOUDINARY_NAME", "")
CLOUDINARY_KEY    = os.environ.get("CLOUDINARY_KEY", "")
CLOUDINARY_SECRET = os.environ.get("CLOUDINARY_SECRET", "")
WHISPER_MODEL     = os.environ.get("WHISPER_MODEL", "base")
LLM_MODEL_ID      = os.environ.get("LLM_MODEL_ID", "Qwen/Qwen2.5-1.5B-Instruct")
EMBED_MODEL_ID    = os.environ.get(
    "EMBED_MODEL_ID", "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
)
OUTPUT_DIR        = os.environ.get("OUTPUT_DIR", "outputs")
TEMP_DIR          = os.environ.get("TEMP_DIR", "/tmp")

# Multi-topic highlight (ported from old pipeline, see implement-notes.html)
MIN_TOPIC_DURATION_SEC = 20
OUTLINE_CHUNK_SIZE     = 1500  # subtitle lines per outline LLM call, keeps prompt under tokenizer max_length
MAX_RENDER_WORKERS     = int(os.environ.get("MAX_RENDER_WORKERS", "2"))

# GPU_LOCK serializes all calls that touch the shared whisper/llm/embed_model
# singletons on app.state (transcribe, llm.generate, embed_model.encode).
# FastAPI BackgroundTasks from concurrent requests can run on different
# threads, so two jobs hitting the same CUDA context at once can corrupt
# model state or crash the process. This was missing in the pre-multi
# version of this file (each request's background task ran unlocked); the
# multi-topic pipeline below does enough extra LLM/embedding calls that the
# risk of overlap goes up, so the lock was added and applied everywhere the
# shared models are touched, not just in the new code path.
GPU_LOCK = threading.Lock()

# GPU_LOCK alone only prevents CORRUPTION (two calls stepping on the same
# model instance at once) — it does not stop the server from accepting
# unlimited concurrent jobs that all pile up waiting on that lock, each
# holding its own decoded audio/video buffers in memory while it waits.
# On a single-GPU Colab runtime that piling-up is what actually causes OOM
# and multi-minute stalls, not the brief per-call lock contention. This
# semaphore adds job-level backpressure on top of GPU_LOCK: it wraps the
# ENTIRE GPU-heavy background task (transcribe / highlight / highlight-multi)
# so only MAX_CONCURRENT_GPU_JOBS of them run at a time; anything beyond
# that queues before even starting, the same way the old notebook's
# `_highlight_sem_thread` did. /generate-quiz is NOT gated by this — it only
# calls OpenAI over HTTP and never touches the local Whisper/Qwen/embedding
# models, so it can't contend for GPU state in the first place.
MAX_CONCURRENT_GPU_JOBS = int(os.environ.get("MAX_CONCURRENT_GPU_JOBS", "1"))
GPU_JOB_SEM = threading.BoundedSemaphore(MAX_CONCURRENT_GPU_JOBS)

cloudinary.config(
    cloud_name=CLOUDINARY_NAME, api_key=CLOUDINARY_KEY,
    api_secret=CLOUDINARY_SECRET, secure=True,
)

qstash_client = QStash(QSTASH_TOKEN) if QSTASH_TOKEN else None
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None


def openai_chat_create(**kwargs):
    """Wraps openai_client.chat.completions.create() — some newer models
    (o1/o3/o4-mini/gpt-5 family) reject any non-default `temperature`
    ("Unsupported value: 'temperature' does not support 0.2 with this
    model. Only the default (1) value is supported."). Rather than hardcode
    which OPENAI_MODEL values do/don't support it, retry once without
    `temperature` specifically on that error so this keeps working no
    matter which model OPENAI_MODEL is set to."""
    try:
        return openai_client.chat.completions.create(**kwargs)
    except BadRequestError as e:
        if "temperature" in str(e) and "temperature" in kwargs:
            kwargs = {k: v for k, v in kwargs.items() if k != "temperature"}
            return openai_client.chat.completions.create(**kwargs)
        raise

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
log = logging.getLogger("unified")

os.makedirs(OUTPUT_DIR, exist_ok=True)
jobs: Dict[str, Dict[str, Any]] = {}

# ============================================================
# SUBTITLE CONFIG
# ============================================================

SUBTITLE_FONT_NAME = os.environ.get("SUBTITLE_FONT_NAME", "Noto Sans")
SUBTITLE_FORCE_STYLE = os.environ.get(
    "SUBTITLE_FORCE_STYLE",
    "FontName=Noto Sans,FontSize=20,PrimaryColour=&H00FFFFFF,"
    "OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2,MarginV=24",
)

SUBTITLE_FONT_DIR = ""

# ============================================================================
# APP + STARTUP
# ============================================================================
app = FastAPI(title="Transcribe + Highlight + Quiz unified API")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=False,
    allow_methods=["*"], allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    app.state.device = DEVICE
    log.info("Device: %s", DEVICE)

    test_video = check_subtitle_runtime()

    app.state.subtitle_test_video = test_video

    # Whisper (transcribe)
    compute = "float16" if DEVICE == "cuda" else "int8"
    log.info("Loading Whisper=%s compute=%s", WHISPER_MODEL, compute)
    app.state.whisper = WhisperModel(WHISPER_MODEL, device=DEVICE, compute_type=compute)

    # Embedding (highlight prefilter + grouping)
    log.info("Loading Embedding=%s", EMBED_MODEL_ID)
    app.state.embed_model = SentenceTransformer(EMBED_MODEL_ID, device=DEVICE)

    # LLM (highlight scoring — local Qwen)
    log.info("Loading LLM=%s", LLM_MODEL_ID)
    tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_ID, use_fast=True)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    llm = AutoModelForCausalLM.from_pretrained(
        LLM_MODEL_ID,
        torch_dtype=torch.float16 if DEVICE == "cuda" else torch.float32,
        device_map="auto" if DEVICE == "cuda" else None,
        low_cpu_mem_usage=True,
    )
    llm.eval()
    app.state.tokenizer = tokenizer
    app.state.llm = llm

    log.info("🚀 Server ready! Whisper=%s | LLM=%s | OpenAI=%s | Device=%s",
             WHISPER_MODEL, LLM_MODEL_ID, OPENAI_MODEL, DEVICE)


# ============================================================================
# COMMON HELPERS
# ============================================================================
def run_cmd(cmd, check=True, cwd=None):
    res = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd)
    if res.returncode != 0 and check:
        log.error("CMD failed: %s | err: %s", " ".join(cmd), res.stderr[-500:])
        raise RuntimeError(res.stderr[-500:])
    return res

def check_subtitle_runtime():
    global SUBTITLE_FONT_DIR

    # 1. Kiểm tra font Regular
    regular_result = subprocess.run(
        [
            "fc-match",
            "-f",
            "%{family[0]}|%{file}\n",
            f"{SUBTITLE_FONT_NAME}:style=Regular",
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    regular_line = regular_result.stdout.strip()
    regular_family, regular_file = regular_line.split("|", 1)

    if regular_family.strip().lower() != SUBTITLE_FONT_NAME.lower():
        raise RuntimeError(
            f"Font fallback detected. "
            f"Expected {SUBTITLE_FONT_NAME}, "
            f"got {regular_family}"
        )

    # 2. Kiểm tra font Bold
    bold_result = subprocess.run(
        [
            "fc-match",
            "-f",
            "%{family[0]}|%{file}\n",
            f"{SUBTITLE_FONT_NAME}:style=Bold",
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    bold_line = bold_result.stdout.strip()
    bold_family, bold_file = bold_line.split("|", 1)

    if bold_family.strip().lower() != SUBTITLE_FONT_NAME.lower():
        raise RuntimeError(
            f"Bold font fallback detected. "
            f"Expected {SUBTITLE_FONT_NAME}, "
            f"got {bold_family}"
        )

    regular_file = regular_file.strip()
    bold_file = bold_file.strip()

    if not os.path.isfile(regular_file):
        raise RuntimeError(
            f"Regular font file not found: {regular_file}"
        )

    if not os.path.isfile(bold_file):
        raise RuntimeError(
            f"Bold font file not found: {bold_file}"
        )

    # Cho libass biết chính xác thư mục chứa Noto Sans.
    SUBTITLE_FONT_DIR = os.path.dirname(bold_file)

    # 3. Kiểm tra FFmpeg có subtitles/libass
    filter_result = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-filters",
        ],
        capture_output=True,
        text=True,
        check=True,
    )

    if "subtitles" not in filter_result.stdout:
        raise RuntimeError(
            "FFmpeg subtitles filter is unavailable"
        )

    # 4. Render thử tiếng Việt + tiếng Anh
    test_dir = "/tmp/subtitle_test"
    os.makedirs(test_dir, exist_ok=True)

    test_srt = os.path.join(
        test_dir,
        "test.srt",
    )

    test_video = os.path.join(
        test_dir,
        "test.mp4",
    )

    with open(
        test_srt,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(
            "1\n"
            "00:00:00,200 --> 00:00:04,800\n"
            "Tiếng Việt: Nguyễn Ánh, trường học, "
            "ă â ê ô ơ ư đ. English subtitle test.\n\n"
        )

    subtitle_filter = (
        f"subtitles=filename='{test_srt}':"
        f"fontsdir='{SUBTITLE_FONT_DIR}':"
        f"force_style='{SUBTITLE_FORCE_STYLE}'"
    )

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-hide_banner",
            "-loglevel",
            "error",
            "-f",
            "lavfi",
            "-i",
            "color=c=gray:s=640x360:d=5:r=25",
            "-vf",
            subtitle_filter,
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            test_video,
        ],
        cwd=test_dir,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            "Subtitle test render failed:\n"
            + result.stderr
        )

    if not os.path.isfile(test_video):
        raise RuntimeError(
            "Subtitle test output was not created"
        )

    print("✅ Subtitle runtime OK")
    print("Regular font:", regular_file)
    print("Bold font:", bold_file)
    print("Font directory:", SUBTITLE_FONT_DIR)
    print("Test video:", test_video)

    return test_video

def get_subtitle_filter(srt_filename):
    if not SUBTITLE_FONT_DIR:
        raise RuntimeError(
            "Subtitle runtime has not been initialized"
        )
    # Ép đường dẫn SRT thành absolute path
    abs_srt_path = os.path.abspath(srt_filename)

    return (
        f"subtitles=filename='{abs_srt_path}':"
        f"fontsdir='{SUBTITLE_FONT_DIR}':"
        f"force_style='{SUBTITLE_FORCE_STYLE}'"
    )

def parse_srt_time(s):
    h, m, rest = s.split(":")
    sec, ms = rest.split(",")
    return int(h)*3600 + int(m)*60 + int(sec) + int(ms)/1000.0


def parse_srt_time_to_ms(s):
    return int(parse_srt_time(s) * 1000)


def seconds_to_srt_time(seconds):
    h = int(seconds // 3600); m = int((seconds % 3600) // 60)
    s = int(seconds % 60); ms = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def srt_to_segments(file_path):
    """Seconds-based segments for highlight pipeline."""
    with open(file_path, "r", encoding="utf-8") as f:
        raw = f.read().lstrip("﻿").replace("\r\n", "\n").strip()
    segs = []
    for blk in re.split(r"\n\s*\n", raw):
        lines = [ln.strip() for ln in blk.splitlines() if ln.strip()]
        if len(lines) < 2: continue
        if lines[0].isdigit():
            idx, time_line, text_lines = int(lines[0]), lines[1], lines[2:]
        else:
            idx, time_line, text_lines = len(segs)+1, lines[0], lines[1:]
        if "-->" not in time_line: continue
        a, b = [t.strip() for t in time_line.split("-->")]
        segs.append({
            "index": idx,
            "start": parse_srt_time(a),
            "end": parse_srt_time(b),
            "text": " ".join(text_lines),
        })
    return sorted(segs, key=lambda x: x["start"])


def parse_srt_ms(srt_text):
    """ms-based parse for quiz."""
    srt_text = srt_text.lstrip("﻿").replace("\r\n", "\n").replace("\r", "\n")
    out = []
    for blk in re.split(r"\n\s*\n", srt_text.strip()):
        lines = [ln.strip() for ln in blk.splitlines() if ln.strip()]
        if len(lines) < 2: continue
        if lines[0].isdigit():
            idx, time_line, text_lines = int(lines[0]), lines[1], lines[2:]
        else:
            idx, time_line, text_lines = len(out)+1, lines[0], lines[1:]
        if "-->" not in time_line: continue
        a, b = [t.strip() for t in time_line.split("-->")]
        out.append({"index": idx, "start_ms": parse_srt_time_to_ms(a),
                    "end_ms": parse_srt_time_to_ms(b), "text": " ".join(text_lines)})
    return out


def save_srt(selected_groups, all_segments, out_path):
    """Lưu SRT từ selected groups (giữ index gốc)."""
    seg_by_idx = {s["index"]: s for s in all_segments}
    with open(out_path, "w", encoding="utf-8") as f:
        cnt = 1
        for g in selected_groups:
            for idx in g["indices"]:
                seg = seg_by_idx.get(idx)
                if not seg: continue
                f.write(f"{cnt}\n")
                f.write(f"{seconds_to_srt_time(seg['start'])} --> {seconds_to_srt_time(seg['end'])}\n")
                f.write(seg['text'] + "\n\n")
                cnt += 1

def ms_to_srt_time(ms):
    seconds = ms / 1000.0
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms_rem = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02}:{m:02}:{s:02},{ms_rem:03}"


# ============================================================================
# VIDEO / AUDIO HELPERS
# ============================================================================
def download_video_from_url(url, out_path):
    """Tải video về local (cần khi cần render highlight)."""
    parsed = urlparse(url)
    path_lower = parsed.path.lower()
    if path_lower.endswith(".m3u8"):
        run_cmd(["ffmpeg", "-y", "-i", url, "-c", "copy", "-bsf:a", "aac_adtstoasc", out_path])
        return out_path
    if any(path_lower.endswith(ext) for ext in (".mp4", ".mkv", ".webm", ".mov")):
        with requests.get(url, stream=True, timeout=120,
                          headers={"User-Agent": "Mozilla/5.0"}) as r:
            r.raise_for_status()
            with open(out_path, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 20):
                    if chunk: f.write(chunk)
        return out_path
    # fallback: ffmpeg generic remux
    run_cmd(["ffmpeg", "-y", "-i", url, "-c", "copy", out_path])
    return out_path


def transcribe_video_to_srt(video_source, srt_out_path, language=None):
    """Whisper transcribe. video_source = local path HOẶC URL (ffmpeg stream)."""
    audio_path = os.path.join(OUTPUT_DIR, f"audio_{uuid.uuid4().hex}.wav")
    is_url = video_source.startswith(("http://", "https://"))
    cmd = ["ffmpeg", "-y"]
    if is_url:
        cmd += ["-user_agent", "Mozilla/5.0"]
    cmd += ["-i", video_source, "-vn",
            "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1", audio_path]
    run_cmd(cmd)

    with GPU_LOCK:
        segments_gen, _ = app.state.whisper.transcribe(
            audio_path, beam_size=5, vad_filter=True, language=language,
        )
        # Drain the lazy generator INSIDE the lock — faster-whisper's internal
        # feature-extractor state is shared, so a concurrent transcribe() call
        # from another job could otherwise interleave audio chunks mid-iteration.
        segments = list(segments_gen)
    with open(srt_out_path, "w", encoding="utf-8") as f:
        for idx, seg in enumerate(segments, 1):
            f.write(f"{idx}\n{seconds_to_srt_time(seg.start)} --> {seconds_to_srt_time(seg.end)}\n{seg.text.strip()}\n\n")
    if os.path.exists(audio_path):
        try: os.remove(audio_path)
        except: pass
    return srt_out_path


# ============================================================================
# CLOUDINARY + QSTASH
# ============================================================================
def upload_video_to_cloudinary(local_file, user_id, job_id, job_type, source_filename=""):
    """Upload video + truyền `context.custom` để media_service webhook nhận job_id/user_id."""
    folder = f"users/{user_id}/jobs/{job_id}"
    # Cloudinary context format: pipe-separated key=value pairs
    # Backend reads: payload.context.custom.{job_id, user_id, type}
    ctx_parts = [
        f"job_id={job_id}",
        f"user_id={user_id}",
        f"type={job_type}",  # 'highlight' | 'mascot' | 'long'
    ]
    if source_filename:
        # Escape | trong filename theo cloudinary spec
        safe_name = source_filename.replace("|", " ").replace("=", " ")
        ctx_parts.append(f"source_original_filename={safe_name}")
    resp = cloudinary.uploader.upload(
        local_file, resource_type="video", folder=folder,
        public_id=f"{job_id}_{job_type}",
        context="|".join(ctx_parts),
        use_filename=False, unique_filename=False, overwrite=True,
    )
    return resp.get("secure_url", ""), resp.get("duration")


def upload_srt_to_cloudinary(srt_path, user_id, job_id):
    """Upload SRT + context để webhook map về đúng job_id (handleCloudinaryRawSrt)."""
    folder = f"users/{user_id}/jobs/{job_id}/subtitles"
    ctx = f"job_id={job_id}|user_id={user_id}|type=subtitle"
    resp = cloudinary.uploader.upload(
        srt_path, resource_type="raw", folder=folder,
        public_id=f"{job_id}_subtitle.srt",
        context=ctx,
        use_filename=False, unique_filename=False, overwrite=True,
    )
    return resp.get("secure_url", "")


def get_video_duration_seconds(path):
    """ffprobe duration để gửi kèm completed event."""
    try:
        res = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True,
        )
        return float(res.stdout.strip()) if res.returncode == 0 else None
    except Exception:
        return None


def download_srt_from_url(url, out_path):
    r = requests.get(url, timeout=60, headers={"User-Agent": "Mozilla/5.0"})
    if r.status_code != 200:
        raise RuntimeError(f"SRT HTTP {r.status_code} from {url[:120]}... body[:200]={r.text[:200]!r}")
    body = r.content
    if not body or len(body) < 50:
        raise RuntimeError(f"SRT too small ({len(body)} bytes) ct={r.headers.get('content-type','?')}")
    head = body[:2000].decode("utf-8", errors="replace")
    if "-->" not in head:
        raise RuntimeError(
            f"Not SRT format ({len(body)}B) ct={r.headers.get('content-type','?')} first200={head[:200]!r}"
        )
    with open(out_path, "wb") as f: f.write(body)
    return out_path


def qstash_publish(body):
    if not qstash_client:
        log.warning("QStash skipped — QSTASH_TOKEN empty")
        return
    try:
        qstash_client.message.publish_json(url_group=QSTASH_URL_GROUP, body=body)
        log.info("[%s] QStash: event=%s type=%s", body.get("job_id","?"), body.get("event"), body.get("type"))
    except Exception as e:
        log.warning("QStash publish failed: %s", e)


# ============================================================================
# HIGHLIGHT SELECTION (Qwen + Embedding)
# ============================================================================
def group_adjacent_by_content(segments, sim_threshold, max_batch_duration, embed_model, device):
    if not segments: return []
    with GPU_LOCK:
        emb = embed_model.encode([s["text"] for s in segments], convert_to_tensor=True, device=device)
    groups, cur, cur_start = [], [segments[0]], segments[0]["start"]
    for i in range(1, len(segments)):
        duration_if_added = segments[i]["end"] - cur_start
        with GPU_LOCK:
            sim = util.cos_sim(
                embed_model.encode(" ".join([s["text"] for s in cur]),
                                   convert_to_tensor=True, device=device),
                emb[i]).item()
        if (duration_if_added <= max_batch_duration * 1.1) and \
           ((cur[-1]["end"] - cur_start) < max_batch_duration * 0.1 or sim >= sim_threshold):
            cur.append(segments[i])
        else:
            groups.append(cur)
            cur, cur_start = [segments[i]], segments[i]["start"]
    if cur: groups.append(cur)
    return groups


def prefilter_groups(groups, topic_prompt, keep_top_k, embed_model, device):
    texts = [" ".join([s["text"] for s in g]) for g in groups]
    if not texts: return []
    with GPU_LOCK:
        group_embs = embed_model.encode(texts, convert_to_tensor=True, device=device)
        prompt_emb = embed_model.encode(topic_prompt, convert_to_tensor=True, device=device)
        sims = util.cos_sim(group_embs, prompt_emb).cpu().numpy().flatten()
    return [g for g, _ in sorted(list(zip(groups, sims)), key=lambda x: x[1], reverse=True)[:keep_top_k]]


def create_scoring_prompt_v2(group_texts, topic_config):
    numbered = "\n".join([
        f"[{i}] {text[:300]}..." if len(text) > 300 else f"[{i}] {text}"
        for i, text in enumerate(group_texts)
    ])
    return f"""You are evaluating video segments for creating EDUCATIONAL highlight clips.
TOPIC: {topic_config['topic']}.
INCLUDE: {", ".join(topic_config['include'])}.
EXCLUDE: {", ".join(topic_config['exclude'])}.

Score each segment on how well it works as a STANDALONE teaching clip:
- 10: a complete, self-contained explanation / definition / demo / key insight / conclusion
- 8-9: high-value teaching content, mostly self-contained
- 6-7: useful but partial (depends on surrounding context)
- 3-5: weak - a sentence fragment, vague, or only loosely on-topic
- 0-2: greeting, sponsor read, filler, sign-off, off-topic, or anything in EXCLUDE

SEGMENTS TO RATE:
{numbered}
INSTRUCTIONS: Rate ALL {len(group_texts)} segments. Output exactly ONE score per line as <number>. No other text.
OUTPUT:"""


def parse_scores_robust(response, expected_count):
    scores = []
    for num_str in re.findall(r'(\d+(?:\.\d+)?)', response):
        try:
            sc = float(num_str)
            if 0 <= sc <= 10:
                scores.append(sc)
                if len(scores) >= expected_count: break
        except: continue
    while len(scores) < expected_count:
        scores.append(0.0)
    return scores[:expected_count]


def score_groups_batch_improved(groups, topic_config, llm, tokenizer, max_groups_per_call=20):
    group_texts = [" ".join(s["text"] for s in g) for g in groups]
    scores = []
    for i in range(0, len(group_texts), max_groups_per_call):
        part = group_texts[i:i+max_groups_per_call]
        prompt = create_scoring_prompt_v2(part, topic_config)
        try:
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True).to(llm.device)
            with GPU_LOCK:
                out = llm.generate(**inputs, max_new_tokens=128, do_sample=False,
                                   pad_token_id=tokenizer.eos_token_id)
            decoded = tokenizer.decode(out[0], skip_special_tokens=True)
            scores.extend(parse_scores_robust(decoded, len(part)))
        except Exception:
            scores.extend([0.0] * len(part))
    return scores


def pipeline_select_highlight_local(srt_path, topic_config, embed_model, llm, tokenizer, device,
                                    max_total_duration=180, score_threshold=5.0):
    """Local Qwen + embedding selection. Returns (selected_groups, all_segments)."""
    params = dict(
        sim_threshold=0.3, max_batch_duration=40.0,
        keep_top_k_prefilter=100, max_groups_for_llm_call=20,
    )
    segments = srt_to_segments(srt_path)
    if not segments: return [], []
    groups = group_adjacent_by_content(segments, params["sim_threshold"],
                                        params["max_batch_duration"], embed_model, device)
    groups_pref = prefilter_groups(groups, topic_config["topic"],
                                    params["keep_top_k_prefilter"], embed_model, device)
    llm_scores = score_groups_batch_improved(groups_pref, topic_config, llm, tokenizer,
                                              params["max_groups_for_llm_call"])
    results = []
    for g, sc in zip(groups_pref, llm_scores):
        results.append({
            "indices": [s["index"] for s in g],
            "start": g[0]["start"], "end": g[-1]["end"],
            "duration": g[-1]["end"] - g[0]["start"], "score_raw": sc,
        })
    selected, total = [], 0
    for r in sorted(results, key=lambda x: x["score_raw"], reverse=True):
        if r["score_raw"] >= score_threshold and total + r["duration"] <= max_total_duration:
            selected.append(r)
            total += r["duration"]
    return sorted(selected, key=lambda x: x["start"]), segments


# ============================================================================
# HIGHLIGHT SELECTION (OpenAI mode — Python rewrite của old node subprocess)
# ============================================================================
# ============================================================================
# OpenAI highlight selection — two stages:
#   Stage A (extract_anchors_openai): read the WHOLE transcript once, ground
#   itself in evidence, and produce structured "anchors" (core teaching
#   points with importance, signaling cues, non-core/filler segments to
#   drop, and dependency chains between points) — based on Mayer's
#   Cognitive Theory of Multimedia Learning.
#   Stage B (select_highlight_openai): ONE call, given those anchors as
#   guidance, picks the ranges it judges best for coherence/context. It is
#   NOT asked to hit target_min/target_max exactly — that would mean
#   re-prompting it in a loop until its own duration bookkeeping happens to
#   land right, which is slow, expensive (each retry resends the whole
#   transcript), and unreliable (a small model tends to echo its previous
#   answer instead of genuinely exploring more content).
# Instead, CODE closes the gap deterministically and for free: if Stage B's
# picks fall short of target_min, unused anchors' core_points (highest
# importance first) are pulled in and expanded into real index ranges,
# using the SAME rendered_duration() math the renderer will use — until the
# target is met or anchors run out. Overshoot past target_max is trimmed
# the same way regardless of which stage produced the excess.
# ============================================================================
ANCHOR_EXTRACTION_SYSTEM = """You are an expert evaluator of educational content, well-versed in the
Cognitive Theory of Multimedia Learning (Mayer). Evaluate objectively,
grounded only in evidence quoted from the provided text, without inferring
beyond the data.

Principles:
- Rely only on the content provided. Do not use background knowledge to
  "guess" things not present in the text.
- Every judgment must cite a specific timestamp or sentence as evidence.
- Quote all evidence VERBATIM in the original language of the transcript
  (Vietnamese or English). Do NOT translate quotes. Write the "content",
  "quote", "description", and "reason" fields in the transcript's language.
- Stay neutral with respect to presentation style or length.
- State evidence and reasoning before any score or verdict.
- Output ONLY valid JSON. Do not write any prose outside the JSON.

# TASK
Below is the full transcript, as indexed lines "[index] start-end: text".
Read all of it and extract a set of "reference anchors" — the basis for
later choosing which parts belong in a highlight cut of this video.

# STEPS
1. Read the entire transcript; identify the overall topic and the video's
   learning objective (or main message, if it isn't a tutorial).
2. List the CORE POINTS: ideas without which a viewer would not grasp the
   content. Each with the line index, a short verbatim quote, and an
   importance level (high|medium). BE THOROUGH AND GRANULAR — every
   distinct idea, step, definition, or example the speaker explains is its
   own core_point; do not collapse several distinct ideas into one entry.
   As a rough guide, a substantive lecture/tutorial should yield roughly
   one core_point per 1-2 minutes of substantive (non-filler) content —
   e.g. a 20-30 minute technical video should typically produce at least
   10-15 core_points, not just a handful. Err on the side of listing more,
   smaller points rather than fewer, broad ones.
3. List the SIGNALING CUES: places where the speaker states importance
   ("the most important point is...", "note that...", "the definition of
   ... is ..."), introduces a key term, or emphasizes via repetition. Each
   with the line index.
4. List the NON-CORE SEGMENTS (filler / off-topic): greetings, digressions,
   ads, redundant repetition — what a good cut SHOULD drop. Each with the
   line index.
5. Identify the REASONING CHAIN: do core points depend on one another
   (point B is only understandable if point A was heard first)? State
   those dependencies by id.

# OUTPUT FORMAT (JSON only)
{
  "topic": "...",
  "learning_objective": "...",
  "core_points": [
    {"id": "C1", "content": "...", "index": 12, "quote": "...", "importance": "high|medium"}
  ],
  "signaling_cues": [
    {"id": "S1", "type": "key_term|emphasis|definition", "content": "...", "index": 20, "quote": "..."}
  ],
  "non_core_segments": [
    {"id": "F1", "type": "greeting|digression|ad|redundancy", "index": 1, "description": "..."}
  ],
  "reasoning_chain": [
    {"dependency": "C2 requires C1", "reason": "..."}
  ]
}
"""

HIGHLIGHT_OPENAI_SYSTEM = """You select segments from a video transcript to build an educational highlight reel. You are given both the full indexed transcript AND a pre-analysis ("anchors") of it — core points with importance, signaling cues, non-core/filler segments to avoid, and dependency chains between core points.

GOAL: aim for a total selected duration around target_min-target_max seconds (given in the user message) by picking MULTIPLE distinct ranges spread across the video, not just the single strongest moment. Exact compliance with the target is handled downstream in code — focus your effort on picking genuinely good, coherent content, not on arithmetic.

HOW TO USE THE ANCHORS:
- Prioritize high-importance core_points first, then medium.
- Respect reasoning_chain: if you include a core_point that depends on another, include (or at least lead into) that prerequisite too, so a viewer isn't dropped into the middle of an idea without its setup.
- Never select indices flagged in non_core_segments.
- Treat signaling_cues as extra evidence a nearby passage matters.
- The anchors are guidance, not an exhaustive or exclusive list — you may pick strong content beyond what's listed as a core_point.

OTHER RULES:
1. Output ONLY valid JSON, no markdown.
2. Each range should cover one coherent idea, explanation, or moment — not an arbitrary slice.
3. Each range MUST contain at least 5 consecutive subtitle indices (or all available if the relevant passage is shorter). Never pick a single isolated subtitle.
4. Skip greetings, sponsor reads, filler, sign-offs, idle chatter, and any warm-up before the substantive content begins.
5. End each range on a COMPLETE sentence — never cut mid-sentence; if the last subtitle ends abruptly, extend forward 1-2 indices.
6. In "reason", write the ONE core idea that range covers (one short sentence), not a generic label.

OUTPUT SCHEMA:
{
  "ranges": [
    { "indices": [12, 13, 14, 15, 16], "reason": "<core idea this range covers>" }
  ]
}
"""

def rendered_duration(indices, by_idx):
    """Actual seconds that will end up on screen for a set of picked
    indices — i.e. the SAME merge-then-sum logic render_highlight uses.
    NOT `last.end - first.start`: that's the span between two points, which
    silently explodes if a "range" bundles indices from far-apart parts of
    the transcript (only the picked indices are rendered, not everything
    between them)."""
    picked_segs = sorted((by_idx[i] for i in indices), key=lambda s: s["start"])
    merged = merge_segments_for_video(picked_segs)
    return sum(s["end"] - s["start"] for s in merged)

def extract_anchors_openai(transcript_block):
    """Stage A: one-shot analysis of the whole transcript into structured,
    evidence-grounded anchors. Returns the parsed dict, or None if the model
    didn't return usable JSON (Stage B then just falls back to the raw
    transcript alone)."""
    for attempt in range(2):
        resp = openai_chat_create(
            model=OPENAI_MODEL,
            response_format={"type": "json_object"},
            temperature=0.2,
            messages=[
                {"role": "system", "content": ANCHOR_EXTRACTION_SYSTEM},
                {"role": "user", "content": f"# TRANSCRIPT\n{transcript_block}"},
            ],
        )
        try:
            return json.loads(resp.choices[0].message.content)
        except json.JSONDecodeError:
            if attempt == 0:
                log.info("  [anchors] malformed JSON, retrying once...", flush=True)
    return None

def expand_index_to_range(idx, valid_indices, blocked_indices, min_size=15):
    """Turn a single anchor index into a window of real segment indices for
    rendering, skipping anything flagged as non-core, widening outward
    until it has at least min_size indices (or runs out of transcript).
    min_size=15 (not the spec's 5-index minimum) because at ~1-2s per
    subtitle line, a 5-index window is only ~10s — with a video yielding
    ~12-15 core_points, using ALL of them at that size still can't reach a
    150-180s target. 15 gives each anchor a more realistic ~20-30s."""
    window = 4
    while window <= 60:
        candidates = sorted(
            i for i in valid_indices
            if abs(i - idx) <= window and i not in blocked_indices
        )
        if len(candidates) >= min_size or window >= 60:
            return candidates
        window += 4
    return []

def _extend_pass(selected, picked_indices, by_idx, blocked):
    """One growth pass: extend every selected range by 1 index on each end
    where possible. Returns True if anything was added."""
    made_progress = False
    for g in selected:
        lo, hi = min(g["indices"]), max(g["indices"])
        nxt = hi + 1
        if nxt in by_idx and nxt not in picked_indices and nxt not in blocked:
            g["indices"].append(nxt)
            g["end"] = by_idx[nxt]["end"]
            picked_indices.add(nxt)
            made_progress = True
        prv = lo - 1
        if prv in by_idx and prv not in picked_indices and prv not in blocked:
            g["indices"].insert(0, prv)
            g["start"] = by_idx[prv]["start"]
            picked_indices.add(prv)
            made_progress = True
    return made_progress

def extend_ranges_to_target_min(selected, picked_indices, by_idx, blocked, target_min):
    """Last-resort, zero-API-cost fallback: if even using every anchor
    still falls short, grow each already-selected range outward by one
    index at a time across repeated passes, until target_min is met or the
    transcript has nothing left to give.

    Phase 1 avoids non_core_segments, same as everywhere else. But this is
    the FINAL fallback — if a video has an unusually large non_core list
    (Stage A being aggressive about flagging filler) and phase 1 stalls
    with the target still unmet, phase 2 drops that restriction and grows
    into anything adjacent, because landing a few seconds under a hard
    numeric requirement is worse than a clip whose last second or two
    wasn't flagged as core. This is what actually makes the "guarantees
    compliance" claim true."""
    total_duration = rendered_duration(picked_indices, by_idx)
    if total_duration >= target_min or not selected:
        return total_duration

    while total_duration < target_min and _extend_pass(selected, picked_indices, by_idx, blocked):
        total_duration = rendered_duration(picked_indices, by_idx)

    if total_duration < target_min:
        log.info("  [select] anchors + non-core-respecting growth still short — "
              "last resort: growing into non-core-flagged lines too", flush=True)
        while total_duration < target_min and _extend_pass(selected, picked_indices, by_idx, set()):
            total_duration = rendered_duration(picked_indices, by_idx)

    return total_duration

def pad_to_target_min(selected, picked_indices, anchors, by_idx, target_min):
    """Code-side, zero-API-cost fill: if Stage B's picks fall short of
    target_min, pull in unused anchors' core_points (highest importance
    first) and expand each into a real index range, using the exact same
    duration math the renderer uses. If anchors run out before reaching
    target_min, falls back to extend_ranges_to_target_min. Replaces asking
    the model to retry, which was slow (resends the whole transcript each
    time), costly, and unreliable (it tended to just echo its previous
    answer)."""
    blocked = {seg["index"] for seg in (anchors or {}).get("non_core_segments", []) if "index" in seg}

    if anchors:
        importance_rank = {"high": 0, "medium": 1}
        candidates = sorted(
            (cp for cp in anchors.get("core_points", [])
             if "index" in cp and cp["index"] in by_idx and cp["index"] not in picked_indices),
            key=lambda cp: (importance_rank.get(cp.get("importance"), 2), cp["index"]),
        )
        valid_indices = set(by_idx.keys())
        total_duration = rendered_duration(picked_indices, by_idx)

        for cp in candidates:
            if total_duration >= target_min:
                break
            new_indices = [i for i in expand_index_to_range(cp["index"], valid_indices, blocked)
                            if i not in picked_indices]
            if not new_indices:
                continue
            selected.append({
                "indices": sorted(new_indices),
                "start": by_idx[min(new_indices)]["start"],
                "end": by_idx[max(new_indices)]["end"],
            })
            picked_indices.update(new_indices)
            total_duration = rendered_duration(picked_indices, by_idx)
    else:
        total_duration = rendered_duration(picked_indices, by_idx)

    if total_duration < target_min:
        total_duration = extend_ranges_to_target_min(selected, picked_indices, by_idx, blocked, target_min)

    return total_duration


def pipeline_select_highlight_openai(srt_path, topic, target_min=100, target_max=300,
                                      keep_indices=None, remove_indices=None):
    """Stage B: 2-stage call (Anchors -> Select) + Code padding to strict duration.

    keep_indices/remove_indices: SRT indices from a prior keep/remove
    selection (already validated by _create_highlight_job — no conflicts,
    all in-range, keep duration <= target_max). remove_indices are
    hard-filtered out before anything else runs, so the LLM never sees that
    content; keep_indices are surfaced in the prompt and then force-included
    in the result regardless of what the model picked.
    """
    keep_indices = set(keep_indices or [])
    remove_indices = set(remove_indices or [])

    segments = srt_to_segments(srt_path)
    if remove_indices:
        segments = [s for s in segments if s["index"] not in remove_indices]
    if not segments: return [], []
    by_idx = {s["index"]: s for s in segments}
    transcript_block = "\n".join(
        f"[{s['index']}] {s['start']:.1f}-{s['end']:.1f}s: {s['text']}" for s in segments
    )

    anchors = extract_anchors_openai(transcript_block)
    anchors_block = (
        f"\nANCHORS (pre-analysis of this transcript):\n{json.dumps(anchors, ensure_ascii=False)}\n"
        if anchors else ""
    )
    if anchors:
        log.info("[anchors] %d core points, %d non-core segments",
                 len(anchors.get('core_points', [])), len(anchors.get('non_core_segments', [])))
    else:
        log.warning("[anchors] extraction failed/empty — Stage B proceeds on raw transcript only")

    keep_list = sorted(i for i in keep_indices if i in by_idx)
    keep_block = (
        f"\nMANDATORY: transcript indices {keep_list} MUST be included in your "
        f"selected ranges no matter what — weave a coherent selection around them.\n"
        if keep_list else ""
    )

    user_prompt = (
        f"TOPIC: {topic}\n"
        f"TARGET DURATION: around {target_min}-{target_max} seconds.\n"
        f"{anchors_block}"
        f"{keep_block}\n"
        f"TRANSCRIPT:\n{transcript_block}\n\nPick the best ranges. Return JSON."
    )

    selected = []
    picked_indices = set()

    if not openai_client:
        raise RuntimeError("OPENAI_API_KEY not set — cannot use isOpenAI mode")

    for attempt in range(2):
        resp = openai_chat_create(
            model=OPENAI_MODEL,
            response_format={"type": "json_object"},
            temperature=0.3,
            messages=[
                {"role": "system", "content": HIGHLIGHT_OPENAI_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
        )
        try:
            data = json.loads(resp.choices[0].message.content)
            break
        except json.JSONDecodeError:
            if attempt == 0:
                log.warning("[select] malformed JSON, retrying once...")
            data = {}

    for r in data.get("ranges", []):
        indices = sorted(i for i in r.get("indices", []) if i in by_idx)
        if not indices or picked_indices.intersection(indices):
            continue
        selected.append({
            "indices": indices,
            "start": by_idx[indices[0]]["start"],
            "end": by_idx[indices[-1]]["end"],
            "reason": r.get("reason", "")
        })
        picked_indices.update(indices)

    # ---- force-include: guarantee every keep index is in the result,
    #      regardless of whether the model picked it (mirrors the existing
    #      pad_to_target_min core_points mechanism, but unconditional) ----
    missing_keep = sorted(i for i in keep_list if i not in picked_indices)
    if missing_keep:
        selected.append({
            "indices": missing_keep,
            "start": by_idx[missing_keep[0]]["start"],
            "end": by_idx[missing_keep[-1]]["end"],
            "reason": "forced (user-selected keep range)",
            "forced": True,
        })
        picked_indices.update(missing_keep)
    for r in selected:
        if keep_indices.intersection(r["indices"]):
            r["forced"] = True

    total_duration = rendered_duration(picked_indices, by_idx)
    log.info("[select] model picked %d range(s), %.0fs (target %d-%ds)",
             len(selected), total_duration, target_min, target_max)

    if total_duration < target_min:
        total_duration = pad_to_target_min(selected, picked_indices, anchors, by_idx, target_min)
        log.info("[select] after code padding: %d range(s), %.0fs", len(selected), total_duration)

    if total_duration > target_max:
        # Keep-derived ("forced") ranges are never dropped here — the
        # keep-duration-vs-target_max check in _create_highlight_job already
        # guarantees forced content alone fits within target_max, so this
        # loop always has a non-forced range left to drop until it does.
        while total_duration > target_max and any(not r.get("forced") for r in selected):
            for i in range(len(selected) - 1, -1, -1):
                if not selected[i].get("forced"):
                    dropped = selected.pop(i)
                    picked_indices.difference_update(dropped["indices"])
                    break
            total_duration = rendered_duration(picked_indices, by_idx)
        log.info("[select] trimmed back to %d range(s), %.0fs (target_max=%ds)",
                 len(selected), total_duration, target_max)

    return sorted(selected, key=lambda x: x["start"]), segments


# ============================================================================
# MULTI-TOPIC HIGHLIGHT (ported from the old Colab notebook + hardened)
# ----------------------------------------------------------------------------
# Flow: transcribe ONCE -> outline the transcript into topics (LLM) -> merge
# topics that are too short to be useful -> ONE batched LLM call selects the
# best subtitle range per topic -> per topic: clamp to target duration, cut +
# burn subtitles, upload to Cloudinary. Render/upload for each topic runs in
# a small thread pool since ffmpeg (CPU-bound) and the Cloudinary upload
# (network-bound) both release the GIL.
#
# This subsystem is intentionally self-contained (its own prompts, its own
# `_call_llm` JSON-calling helper, its own render function
# `split_and_burn_subs`) instead of reusing the single-output helpers above
# (`score_groups_batch_improved`, `split_and_burn_ass`). See
# implement-notes.html for why: the single-output path scores loosely-grouped
# segments with a 0-10 rubric, while multi-topic needs the LLM to return
# structured per-topic JSON ranges, and its renderer needs a windowed
# single-pass ffmpeg call (see split_and_burn_subs) to stay fast when called
# once per topic instead of once per job.
# ============================================================================

OUTLINE_PROMPT = """\
## Role
You are an expert video analyst.

Your job is to analyze a full transcript and split it into as many meaningful topics as possible for highlight selection.

## Video Context
- Topic: {{TOPIC}}
- Sections to focus on: {{INCLUDE}}
- Sections to ignore: {{EXCLUDE}}

## Input
A transcript in the format:

[sequence_number] text

Sequence numbers are original SRT indices.

## Task

Read the full transcript and identify all meaningful topics relevant to the video context.

A topic can be:
- a major concept
- an explanation
- an example
- a demonstration
- a strong statement
- a memorable moment
- a key insight
- a conclusion
- an important transition

Prefer splitting into more useful topics rather than combining too many ideas into one large section.

## Rules

- The FIRST topic (topic_id=1) MUST be where the speaker starts explaining the main subject/thesis
- Do NOT make greetings, jokes, casual banter, sponsor reads, or "hey guys welcome back" the first topic
- If the video starts with greetings or jokes before the real content, set topic_id=1's start_index AFTER those sections
- Split generously - prefer more meaningful topics over fewer broad chapters
- Aim for 6-12 topics for normal videos, and more if the content is long or dense
- Do not merge unrelated ideas into one topic
- Do not cut in the middle of an important explanation or story
- Topics should follow transcript order naturally
- Topics must not overlap
- Cover all relevant in-scope content with minimal large gaps
- Skip sponsor reads, filler chatter, jokes, casual banter, and irrelevant sections
- Only include topics within Sections to focus on
- Skip anything listed in Sections to ignore
- start_index and end_index must be real SRT sequence numbers from the transcript
- Do NOT invent indices
- Add small buffer:
  - set start_index a few lines before the topic begins
  - set end_index a few lines after the topic ends

## Output

Return only valid JSON. No markdown fences, no commentary.

{
  "topics": [
    {
      "topic_id": 1,
      "title": "Short descriptive title",
      "description": "What this topic covers and why it matters",
      "start_index": 1,
      "end_index": 24
    }
  ]
}
"""

SELECT_ALL_TOPICS_PROMPT = """\
You are a video editor. Select the best subtitle ranges for EACH topic listed below to create highlight clips.

Topics (process every one, in order):
{topics_block}

Full transcript (format: [index] text):
{transcript}

PER-TOPIC SELECTION RULES:
1. For each topic, choose ranges ONLY within that topic's [start_index, end_index] window.
2. Pick the CORE educational passage - minimum 5 consecutive subtitles (or all if the topic block is shorter).
3. Never select a single isolated subtitle.
4. Start AFTER warm-up phrases ("so today", "let me show you", "alright guys", "in this video").
5. End on a COMPLETE sentence; if the last subtitle ends abruptly, extend forward 1-2 indices.
6. SKIP greetings, filler ("so yeah", "you know"), sponsor reads, sign-offs.
7. [INTRO] topic: include setup/context even if it feels like warm-up; do not skip the first meaningful subtitle.
8. [CONCLUSION] topic: extend through the end; include final summary/takeaway/closing statement.
9. Ranges across topics must NOT overlap.

QUALITY STEP (per topic, do this BEFORE writing ranges):
- Identify the CORE THESIS: the single sentence that best states what the speaker is teaching in this topic.
- Choose ranges so they include and surround that thesis with enough setup and payoff to stand alone.
- Write that thesis into the "core_idea" field (one short sentence).

Return ONLY valid JSON, no explanation, no markdown fences:
{{
  "topics": [
    {{"topic_id": <int>, "core_idea": "<one short sentence>", "ranges": [[start_index, end_index]]}}
  ]
}}
Include EVERY topic_id from the input list, in the same order.
"""


def _extract_json(text):
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for ch in ["{", "["]:
        pos = text.find(ch)
        if pos != -1:
            try:
                return json.loads(text[pos:])
            except json.JSONDecodeError:
                pass
    for pat in [r"\{[\s\S]*\}", r"\[[\s\S]*\]"]:
        matches = list(re.finditer(pat, text))
        for m in reversed(matches):
            try:
                return json.loads(m.group())
            except json.JSONDecodeError:
                continue
    raise ValueError(f"No valid JSON found. Raw (first 300):\n{text[:300]}")


def _validate_outline_data(data):
    """Return a cleaned topics list. Accepts {"topics": [...]}, or a bare list.
    Drops rows that cannot be salvaged (missing/non-numeric indices, empty title)."""
    if isinstance(data, list):
        rows = data
    elif isinstance(data, dict):
        rows = data.get("topics", [])
    else:
        raise ValueError(f"Outline response not dict/list: {type(data).__name__}")
    if not isinstance(rows, list):
        raise ValueError(f"Outline 'topics' is not a list: {type(rows).__name__}")
    cleaned = []
    for r in rows:
        if not isinstance(r, dict):
            continue
        try:
            si = int(r.get("start_index"))
            ei = int(r.get("end_index"))
        except (TypeError, ValueError):
            continue
        title = str(r.get("title") or "").strip()
        if not title or ei < si:
            continue
        cleaned.append({
            "topic_id": int(r.get("topic_id", 0) or 0),
            "title": title,
            "description": str(r.get("description") or ""),
            "start_index": si,
            "end_index": ei,
        })
    return cleaned


def _gpu_cleanup():
    """Release fragmented GPU memory + Python refs between LLM calls."""
    import gc as _gc
    if hasattr(torch, "cuda") and torch.cuda.is_available():
        torch.cuda.empty_cache()
    _gc.collect()


def _call_llm(system_msg, user_msg, use_openai, llm, tokenizer,
              max_attempts=3, temperature=0, max_new_tokens=4096):
    """Call local Qwen or OpenAI with retry + JSON extraction.

    - Retry schedules temperature slightly higher each attempt and appends a
      "your previous output was invalid JSON" hint, so a retry has an actual
      chance to recover instead of repeating the same broken output.
    - Local branch runs under GPU_LOCK so a concurrent whisper.transcribe /
      embed_model.encode from another job cannot interleave on the same
      model instance / VRAM pool.
    """
    last_err = None
    raw = ""
    parse_err_hint = ""
    for attempt in range(1, max_attempts + 1):
        _gpu_cleanup()
        inputs = out = None
        if temperature > 0:
            eff_temp = min(1.0, temperature + 0.1 * (attempt - 1))
        else:
            eff_temp = 0.0 if attempt == 1 else min(0.3, 0.1 * (attempt - 1))
        sys_aug = system_msg + ("\n\n" + parse_err_hint if parse_err_hint else "")
        try:
            if use_openai:
                if not openai_client:
                    raise RuntimeError("OPENAI_API_KEY not set — cannot use isOpenAI mode")
                resp = openai_chat_create(
                    model=OPENAI_MODEL,
                    messages=[{"role": "system", "content": sys_aug}, {"role": "user", "content": user_msg}],
                    temperature=eff_temp, max_tokens=max_new_tokens,
                    response_format={"type": "json_object"},
                )
                raw = resp.choices[0].message.content or ""
            else:
                messages = [{"role": "system", "content": sys_aug}, {"role": "user", "content": user_msg}]
                text_input = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
                _prev_side = tokenizer.truncation_side
                tokenizer.truncation_side = "left"
                try:
                    inputs = tokenizer(text_input, return_tensors="pt", truncation=True, max_length=16384).to(llm.device)
                finally:
                    tokenizer.truncation_side = _prev_side
                with GPU_LOCK:
                    with torch.inference_mode():
                        out = llm.generate(
                            **inputs, max_new_tokens=max_new_tokens,
                            temperature=max(eff_temp, 0.01),
                            do_sample=eff_temp > 0, top_p=0.95,
                            pad_token_id=tokenizer.pad_token_id,
                        )
                    raw = tokenizer.decode(out[0][inputs["input_ids"].shape[-1]:], skip_special_tokens=True)
            return _extract_json(raw)
        except ValueError as ve:
            last_err = ve
            parse_err_hint = (
                "Your previous output could not be parsed as JSON. Return ONLY a "
                "single JSON object/array — no markdown fences, no commentary."
            )
            log.warning("LLM attempt %d JSON parse fail. Raw[:300]: %s", attempt, raw[:300] if raw else "<empty>")
            if attempt < max_attempts:
                time.sleep(1)
        except Exception as e:
            last_err = e
            log.warning("LLM attempt %d failed: %s", attempt, e)
            if attempt < max_attempts:
                time.sleep(1)
        finally:
            if inputs is not None:
                del inputs
            if out is not None:
                del out
            _gpu_cleanup()
    raise last_err


def _run_outline_single(segs_chunk, outline_prompt, use_openai, llm, tokenizer, temperature):
    """One outline LLM call on a contiguous slice of subtitles."""
    if not segs_chunk:
        return []
    min_idx = segs_chunk[0]["index"]
    max_idx = segs_chunk[-1]["index"]
    sampled = "\n".join(f"[{s['index']}] {s['text']}" for s in segs_chunk)
    header = f"Subtitle index range: [{min_idx}-{max_idx}] ({len(segs_chunk)} subtitles)\n\n"
    data = _call_llm(outline_prompt, f"## Transcript\n\n{header}{sampled}", use_openai, llm, tokenizer, temperature=temperature)
    topics_raw = _validate_outline_data(data)
    out = []
    for t in topics_raw:
        si = t["start_index"]; ei = t["end_index"]
        if ei < min_idx or si > max_idx:
            continue
        t["start_index"] = max(si, min_idx)
        t["end_index"] = min(ei, max_idx)
        out.append(t)
    return out


def _merge_thin_topics(topics, segs, target_min):
    """Merge adjacent topics whose subtitle-block duration is shorter than
    target_min, so a technical video that the LLM splits into many tiny
    subtopics doesn't end up having half of them silently skipped downstream
    for being too short to hit target_min on their own."""
    if not topics or len(topics) <= 1:
        return topics
    sorted_t = sorted(topics, key=lambda t: t["start_index"])
    by_idx = {s["index"]: s for s in segs}

    def _block_dur(s_idx, e_idx):
        return sum(by_idx[i]["end"] - by_idx[i]["start"]
                   for i in range(s_idx, e_idx + 1) if i in by_idx)

    merged = []
    cur = None
    for t in sorted_t:
        if cur is None:
            cur = dict(t)
            continue
        cur_dur = _block_dur(cur["start_index"], cur["end_index"])
        if cur_dur < target_min:
            cur["end_index"] = max(cur["end_index"], t["end_index"])
            cur["title"] = f"{cur['title']} + {t.get('title','')}".strip(" +")[:200]
            cur_desc = cur.get("description", "")
            t_desc = t.get("description", "")
            if t_desc and t_desc not in cur_desc:
                cur["description"] = f"{cur_desc} | {t_desc}".strip(" |")
        else:
            merged.append(cur)
            cur = dict(t)
    if cur is not None:
        if merged and _block_dur(cur["start_index"], cur["end_index"]) < target_min:
            prev = merged[-1]
            prev["end_index"] = max(prev["end_index"], cur["end_index"])
            prev["title"] = f"{prev['title']} + {cur.get('title','')}".strip(" +")[:200]
            prev_desc = prev.get("description", "")
            cur_desc = cur.get("description", "")
            if cur_desc and cur_desc not in prev_desc:
                prev["description"] = f"{prev_desc} | {cur_desc}".strip(" |")
        else:
            merged.append(cur)

    for i, t in enumerate(merged, 1):
        t["topic_id"] = i

    if len(merged) < len(sorted_t):
        log.info("[thin-merge] %d topics -> %d after merging thin adjacent (target_min=%ss)", len(sorted_t), len(merged), target_min)
    return merged


def _merge_outline_topics(all_topics, overlap_threshold=0.6):
    """Merge topics from multiple outline chunks: drop near-duplicates, renumber sequentially."""
    if not all_topics:
        return []
    sorted_t = sorted(all_topics, key=lambda x: (x["start_index"], x["end_index"]))
    kept = []
    for t in sorted_t:
        s, e = t["start_index"], t["end_index"]
        is_dup = False
        for k in kept:
            ks, ke = k["start_index"], k["end_index"]
            inter = max(0, min(e, ke) - max(s, ks) + 1)
            shorter = min(e - s + 1, ke - ks + 1)
            if shorter > 0 and inter / shorter >= overlap_threshold:
                if (e - s) > (ke - ks) * 1.3:
                    k.update({"start_index": s, "end_index": e, "title": t.get("title", k.get("title", "")), "description": t.get("description", k.get("description", ""))})
                is_dup = True
                break
        if not is_dup:
            kept.append(t)
    for i, t in enumerate(kept, 1):
        t["topic_id"] = i
    return kept


def _run_outline(segs, topic_config, use_openai, llm, tokenizer, temperature=0):
    topic = topic_config.get("topic", "")
    include = ", ".join(topic_config.get("include", [])) or "all"
    exclude = ", ".join(topic_config.get("exclude", [])) or "none"
    outline_prompt = (
        OUTLINE_PROMPT
        .replace("{{TOPIC}}", topic)
        .replace("{{INCLUDE}}", include)
        .replace("{{EXCLUDE}}", exclude)
    )
    if not segs:
        return []
    min_idx = segs[0]["index"]
    max_idx = segs[-1]["index"]
    log.info("[outline] %d subtitles [%s-%s]", len(segs), min_idx, max_idx)

    if len(segs) <= OUTLINE_CHUNK_SIZE:
        valid = _run_outline_single(segs, outline_prompt, use_openai, llm, tokenizer, temperature)
        for i, t in enumerate(valid, 1):
            t["topic_id"] = i
        log.info("[outline] %d valid topics (1 call)", len(valid))
        return valid

    # Chunk WITH overlap so the LLM sees full local context per call; 50%
    # overlap gives the merge step enough context to dedup topics that
    # straddle a chunk boundary.
    chunks = []
    step = max(1, OUTLINE_CHUNK_SIZE // 2)
    i = 0
    while i < len(segs):
        chunks.append(segs[i:i + OUTLINE_CHUNK_SIZE])
        if i + OUTLINE_CHUNK_SIZE >= len(segs):
            break
        i += step
    log.info("[outline] chunked: %d calls (size=%s, step=%s, overlap=50%%)", len(chunks), OUTLINE_CHUNK_SIZE, step)

    all_topics = []
    failed_chunks = []
    for ci, chunk in enumerate(chunks, 1):
        cmin = chunk[0]["index"]; cmax = chunk[-1]["index"]
        log.info("[outline] chunk %d/%d [%s-%s] (%d lines)", ci, len(chunks), cmin, cmax, len(chunk))
        partial = []
        try:
            partial = _run_outline_single(chunk, outline_prompt, use_openai, llm, tokenizer, temperature)
        except Exception as e:
            log.warning("outline chunk %d failed once (%s); retrying with temp=0", ci, e)
            try:
                partial = _run_outline_single(chunk, outline_prompt, use_openai, llm, tokenizer, 0)
            except Exception as e2:
                log.warning("outline chunk %d failed twice (%s); using fallback topic spanning the chunk", ci, e2)
                failed_chunks.append((cmin, cmax))
        if partial:
            all_topics.extend(partial)

    for cmin, cmax in failed_chunks:
        all_topics.append({
            "topic_id": 0, "title": f"Section {cmin}-{cmax}",
            "description": "Auto-generated fallback (LLM outline failed for this chunk)",
            "start_index": cmin, "end_index": cmax,
        })

    merged = _merge_outline_topics(all_topics)
    log.info("[outline] %d valid topics (merged from %d candidates)", len(merged), len(all_topics))
    return merged


def _score_segs(seg_objs, query_text, embed_model):
    """Cosine-similarity scores (one per seg) against query_text. Falls back
    to keyword overlap if embed_model is None."""
    if not seg_objs:
        return []
    if embed_model is not None and query_text:
        try:
            texts = [s["text"] for s in seg_objs]
            with GPU_LOCK:
                emb_q = embed_model.encode(query_text, convert_to_tensor=True)
                emb_s = embed_model.encode(texts, convert_to_tensor=True, batch_size=32)
                sims = util.cos_sim(emb_q, emb_s).squeeze(0).tolist()
            return sims
        except Exception as e:
            log.warning("[score] embed failed (%s); falling back to keyword overlap", e)
    q_words = set(w.lower() for w in (query_text or "").split() if len(w) > 2)
    return [
        sum(1 for w in s["text"].lower().split() if w in q_words) / max(1, len(s["text"].split()))
        for s in seg_objs
    ]


def _clamp_to_target(selected, segs, target_min, target_max, query_text="", embed_model=None):
    """Trim/extend so the rendered VIDEO duration sits in [target_min, target_max].
    Ranks each subtitle by similarity to the topic query, keeps the top-scored
    ones until the real ffmpeg-merged duration crosses target_max (or adds
    nearby subtitles if under target_min). Time order is preserved on output."""
    if not selected:
        return selected
    by_idx = {s["index"]: s for s in segs}
    valid = sorted(set(i for i in selected if i in by_idx))
    if not valid:
        return selected

    def _vdur(idxs):
        seg_objs = [by_idx[i] for i in sorted(idxs) if i in by_idx]
        merged = merge_segments_for_video(seg_objs)
        return sum(m["end"] - m["start"] for m in merged)

    dur = _vdur(valid)

    if dur > target_max:
        seg_objs = [by_idx[i] for i in valid]
        scores = _score_segs(seg_objs, query_text, embed_model)
        ranked = sorted(zip(valid, scores), key=lambda p: p[1], reverse=True)
        kept = set()
        for idx, _ in ranked:
            kept.add(idx)
            if _vdur(kept) > target_max:
                kept.discard(idx)
        if len(kept) < 5:
            for idx, _ in ranked:
                kept.add(idx)
                if len(kept) >= 5 or _vdur(kept) > target_max:
                    break

        # Bridge small gaps so we don't end up with N tiny ffmpeg cuts.
        BRIDGE_GAP_SEC = 2.0
        kept_sorted = sorted(kept)
        bridged = set(kept_sorted)
        for a, b in zip(kept_sorted, kept_sorted[1:]):
            sa, sb = by_idx[a], by_idx[b]
            if 0 < sb["start"] - sa["end"] <= BRIDGE_GAP_SEC:
                for s in segs:
                    if a < s["index"] < b:
                        bridged.add(s["index"])
        if _vdur(bridged) > target_max:
            kept_idx_set = set(kept)
            removable = sorted(
                [(s, i) for i, s in zip(valid, scores) if i in bridged and i in kept_idx_set],
                key=lambda p: p[0],
            )
            ri = 0
            while _vdur(bridged) > target_max and ri < len(removable):
                _, drop_idx = removable[ri]
                bridged.discard(drop_idx)
                ri += 1
        return sorted(bridged)

    if dur < target_min:
        sel_set = set(valid)
        lo, hi = valid[0], valid[-1]
        candidates = [s for s in segs if s["index"] not in sel_set and lo - 300 <= s["index"] <= hi + 300]
        if not candidates:
            return valid
        cand_scores = _score_segs(candidates, query_text, embed_model)
        for sc, s in sorted(zip(cand_scores, candidates), key=lambda p: p[0], reverse=True):
            sel_set.add(s["index"])
            if _vdur(sel_set) >= target_min:
                break
        return sorted(sel_set)

    return valid


def _ensure_complete_ending(indices, segs, max_extend=2):
    """Extend the selection by up to `max_extend` subtitles if the last one
    looks like it ends mid-sentence (ends on a connector word)."""
    if not indices:
        return indices
    by_idx = {s["index"]: s for s in segs}
    all_sorted = sorted(s["index"] for s in segs)
    idx_to_pos = {v: i for i, v in enumerate(all_sorted)}
    MID_SENTENCE = re.compile(
        r"\b(and|or|but|so|because|that|which|who|when|if|the|a|an|to|of|in|on|at|"
        r"va|hoac|nhung|vi|nen|de|cua|trong|tren|voi|la|co|duoc|nay|do)$",
        re.IGNORECASE,
    )
    extended = list(indices)
    for _ in range(max_extend):
        last_seg = by_idx.get(extended[-1])
        if not last_seg:
            break
        if not MID_SENTENCE.search(last_seg["text"].strip()):
            break
        pos = idx_to_pos.get(extended[-1], -1)
        if pos < 0 or pos + 1 >= len(all_sorted):
            break
        next_idx = all_sorted[pos + 1]
        if next_idx in set(extended):
            break
        extended.append(next_idx)
    return extended


def _run_select_all_topics(segs, topics_raw, use_openai, llm, tokenizer, temperature=0):
    """Single LLM call that selects ranges for ALL topics at once.
    Returns dict: {topic_id: sorted list of valid indices}."""
    if not topics_raw:
        return {}
    sorted_topics = sorted(topics_raw, key=lambda t: t["topic_id"])
    first_tid = sorted_topics[0]["topic_id"]
    last_tid = sorted_topics[-1]["topic_id"]
    valid_set = {s["index"] for s in segs}

    lines = []
    for t in sorted_topics:
        tag = ""
        if t["topic_id"] == first_tid:
            tag = " [INTRO]"
        elif t["topic_id"] == last_tid:
            tag = " [CONCLUSION]"
        lines.append(
            f"- topic_id={t['topic_id']}{tag} | window=[{t['start_index']},{t['end_index']}] | "
            f"title: {t.get('title','')} | description: {t.get('description','')}"
        )
    topics_block = "\n".join(lines)

    # OpenAI (128k context) can afford one big call; local Qwen needs a
    # smaller cap, so fall back to per-topic windows on long transcripts.
    SELECT_BATCH_MAX_LINES = 8000 if use_openai else 2000
    if len(segs) > SELECT_BATCH_MAX_LINES:
        log.info("[select-batch] transcript too long (%d lines) for one call; switching to per-topic windows", len(segs))
        out = {}
        for t in sorted_topics:
            tid = t["topic_id"]
            window = [s for s in segs if t["start_index"] <= s["index"] <= t["end_index"]]
            if not window:
                continue
            local_topics_block = next((ln for ln in lines if ln.startswith(f"- topic_id={tid}")), "")
            local_transcript = "\n".join(f"[{s['index']}] {s['text']}" for s in window)
            local_user = SELECT_ALL_TOPICS_PROMPT.format(topics_block=local_topics_block, transcript=local_transcript)
            try:
                data = _call_llm(
                    "You select subtitle indices for one topic. Return ONLY valid JSON with key 'topics'.",
                    local_user, use_openai, llm, tokenizer, temperature=temperature,
                    max_new_tokens=1024,
                )
                items = data.get("topics") if isinstance(data, dict) else None
                if isinstance(items, list):
                    for item in items:
                        if not isinstance(item, dict) or item.get("topic_id") != tid:
                            continue
                        ranges = item.get("ranges") or []
                        idxs = []
                        for r in ranges:
                            if isinstance(r, list) and len(r) == 2:
                                idxs.extend(range(int(r[0]), int(r[1]) + 1))
                            elif isinstance(r, int):
                                idxs.append(r)
                        lo, hi = t["start_index"], t["end_index"]
                        window_valid = {s["index"] for s in window}
                        idxs = [i for i in idxs if lo <= i <= hi and i in window_valid]
                        if idxs:
                            out[tid] = sorted(set(idxs))
            except Exception as e:
                log.warning("topic %s per-window call failed: %s", tid, e)
        for t in sorted_topics:
            tid = t["topic_id"]
            if tid not in out or len(out[tid]) <= 1:
                slice_idx = sorted({s["index"] for s in segs if t["start_index"] <= s["index"] <= t["end_index"]})
                if slice_idx:
                    out[tid] = slice_idx
                    log.info("topic %s: fallback to full window (%d segs)", tid, len(slice_idx))
        return out

    transcript = "\n".join(f"[{s['index']}] {s['text']}" for s in segs)
    user_msg = SELECT_ALL_TOPICS_PROMPT.format(topics_block=topics_block, transcript=transcript)

    log.info("[select-batch] 1 LLM call for %d topics...", len(sorted_topics))
    out = {}
    try:
        data = _call_llm(
            "You select subtitle indices for multiple topics. Return ONLY valid JSON with key 'topics'.",
            user_msg, use_openai, llm, tokenizer, temperature=temperature,
            max_new_tokens=2048,
        )
        items = data.get("topics") if isinstance(data, dict) else None
        if isinstance(items, list):
            for item in items:
                if not isinstance(item, dict):
                    continue
                tid = item.get("topic_id")
                ranges = item.get("ranges") or []
                indices = []
                for r in ranges:
                    if isinstance(r, list) and len(r) == 2:
                        indices.extend(range(int(r[0]), int(r[1]) + 1))
                    elif isinstance(r, int):
                        indices.append(r)
                t_meta = next((x for x in sorted_topics if x["topic_id"] == tid), None)
                if t_meta:
                    lo, hi = t_meta["start_index"], t_meta["end_index"]
                    indices = [i for i in indices if lo <= i <= hi and i in valid_set]
                else:
                    indices = [i for i in indices if i in valid_set]
                if indices:
                    out[tid] = sorted(set(indices))
    except Exception as e:
        log.warning("[select-batch] failed: %s", e)

    for t in sorted_topics:
        tid = t["topic_id"]
        if tid not in out or len(out[tid]) <= 1:
            slice_idx = sorted({s["index"] for s in segs if t["start_index"] <= s["index"] <= t["end_index"]})
            if slice_idx:
                out[tid] = slice_idx
                log.info("topic %s: fallback to full window (%d segs)", tid, len(slice_idx))
    return out


def split_and_burn_subs(input_video, srt_file, output_video, window_start=None, window_end=None):
    """Cut selected segments and burn subtitles in a SINGLE ffmpeg pass, used
    by the multi-topic pipeline (one call per topic).

    Uses select/aselect with between(t,a,b) to keep multiple windows from the
    source, then setpts/asetpts to re-pack PTS so the output timeline starts
    at 0 and runs contiguously — one encode per call instead of the
    N-encode-then-concat approach in split_and_burn_ass.

    window_start/window_end (seconds, SOURCE timeline) let the caller say
    "only decode this slice of the source": we pass them as input-side
    -ss/-to (a near-instant demuxer seek on keyframes) and shift every
    between()/subtitle timestamp by that amount. Without this, rendering N
    topic clips from one long source would re-decode the ENTIRE source video
    N times — this is what makes parallel multi-topic rendering fast enough
    to be worth parallelizing at all.
    """
    temp_dir = os.path.join(TEMP_DIR, f"tmp_{uuid.uuid4()}")
    os.makedirs(temp_dir, exist_ok=True)
    input_abs = os.path.abspath(input_video)
    output_abs = os.path.abspath(output_video)

    segments = srt_to_segments(srt_file)
    video_segments = merge_segments_for_video(segments)
    if not video_segments:
        shutil.rmtree(temp_dir, ignore_errors=True)
        return

    if window_start is None:
        window_start = max(0.0, min(seg["start"] for seg in video_segments) - 1.0)
    if window_end is None:
        window_end = max(seg["end"] for seg in video_segments) + 1.0
    window_start = max(0.0, float(window_start))
    window_end = max(window_start + 0.1, float(window_end))
    shift = window_start

    out_srt = os.path.join(temp_dir, "subs.srt")
    cumulative = 0.0
    blocks = []
    si = 1
    for seg_v in video_segments:
        v_start, v_end = seg_v["start"], seg_v["end"]
        v_dur = max(0.0, v_end - v_start)
        for s in segments:
            if s["start"] >= v_end or s["end"] <= v_start:
                continue
            vis_start = max(s["start"], v_start)
            vis_end = min(s["end"], v_end)
            # Skip <0.3s fragments — word-level timestamp slivers near a cut
            # boundary that just flash unreadably.
            if vis_end - vis_start < 0.3:
                continue
            rel_start = cumulative + (vis_start - v_start)
            rel_end = cumulative + (vis_end - v_start)
            # Pad to a minimum readable duration so a sub never flashes for <0.6s.
            if rel_end - rel_start < 0.6:
                rel_end = min(cumulative + v_dur, rel_start + 0.6)
            if rel_end <= rel_start:
                continue
            blocks.append(
                f"{si}\n{seconds_to_srt_time(rel_start)} --> {seconds_to_srt_time(rel_end)}\n{s['text']}\n"
            )
            si += 1
        cumulative += v_dur

    with open(out_srt, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))

    # -ss on input resets t=0 at window_start, so between() must be expressed
    # in window-local time (= src - shift).
    select_expr = "+".join(
        f"between(t,{max(0.0, seg['start']-shift):.3f},{max(0.0, seg['end']-shift):.3f})"
        for seg in video_segments
    )

    subtitle_filter = get_subtitle_filter(out_srt)

    vf = (
        f"select='{select_expr}',"
        f"setpts=N/FRAME_RATE/TB,"
        f"{subtitle_filter}"
    )
    af = f"aselect='{select_expr}',asetpts=N/SR/TB"

    cmd = [
        "ffmpeg", "-y",
        "-ss", f"{window_start:.3f}",
        "-to", f"{window_end:.3f}",
        "-i", input_abs,
        "-vf", vf,
        "-af", af,
        "-c:v", "libx264", "-preset", "ultrafast",
        "-c:a", "aac",
        output_abs,
    ]
    run_cmd(cmd, cwd=temp_dir)
    shutil.rmtree(temp_dir, ignore_errors=True)


def _build_topic_config(topic, include_keywords, exclude_keywords):
    return {
        "topic": topic,
        "include": [k.strip() for k in include_keywords.split(",") if k.strip()],
        "exclude": [k.strip() for k in exclude_keywords.split(",") if k.strip()] if exclude_keywords else [],
    }


def upload_topic_video_to_cloudinary(local_file, user_id, job_id, topic_id, source_filename=""):
    """Same context-string convention as upload_video_to_cloudinary, plus
    topic_id so the webhook/back end can tell topic videos of the same job
    apart. Kept as a separate function (rather than overloading
    upload_video_to_cloudinary) so the existing single-output upload path is
    untouched."""
    folder = f"users/{user_id}/jobs/{job_id}/topics/{topic_id}"
    ctx_parts = [
        f"job_id={job_id}", f"user_id={user_id}",
        "type=highlight_topic", f"topic_id={topic_id}",
    ]
    if source_filename:
        safe_name = source_filename.replace("|", " ").replace("=", " ")
        ctx_parts.append(f"source_original_filename={safe_name}")
    resp = cloudinary.uploader.upload(
        local_file, resource_type="video", folder=folder,
        public_id=f"{job_id}_topic{topic_id}",
        context="|".join(ctx_parts),
        use_filename=False, unique_filename=False, overwrite=True,
    )
    return resp.get("secure_url", ""), resp.get("duration")


def upload_topic_srt_to_cloudinary(srt_path, user_id, job_id, topic_id):
    folder = f"users/{user_id}/jobs/{job_id}/topics/{topic_id}/subtitles"
    ctx = f"job_id={job_id}|user_id={user_id}|type=subtitle|topic_id={topic_id}"
    resp = cloudinary.uploader.upload(
        srt_path, resource_type="raw", folder=folder,
        public_id=f"{job_id}_topic{topic_id}_subtitle.srt",
        context=ctx, use_filename=False, unique_filename=False, overwrite=True,
    )
    return resp.get("secure_url", "")


def highlight_pipeline_multi(
    full_srt_path, video_path, job_id, user_id, topic_config,
    target_min=60, target_max=180,
    use_openai=False, llm=None, tokenizer=None, embed_model=None,
    source_original_filename="",
):
    """Multi-output: one highlight video per topic.
    Returns a list of dicts: {topic_id, title, description, download_url, srt_url, duration}.
    """
    log.info("HIGHLIGHT MULTI-OUTPUT PIPELINE start job=%s", job_id)
    segs = srt_to_segments(full_srt_path)

    # 1. Outline
    topics_raw = _run_outline(segs, topic_config, use_openai, llm, tokenizer, temperature=0)
    if not topics_raw:
        log.warning("[%s] outline produced no topics — aborting multi pipeline", job_id)
        return []

    # 1b. Merge thin adjacent topics up front so we don't burn an LLM select
    # call + ffmpeg pass on a block that would just get skipped later.
    topics_raw = _merge_thin_topics(topics_raw, segs, target_min)

    n_topics = len(topics_raw)
    by_idx = {s["index"]: s for s in segs}
    results = []

    sorted_topics = sorted(topics_raw, key=lambda t: t["topic_id"])
    log.info("[multi] %d topics after thin-merge — will attempt to render up to %d videos", n_topics, n_topics)

    # Batched selection: 1 LLM call for all topics.
    selections = _run_select_all_topics(segs, sorted_topics, use_openai, llm, tokenizer, temperature=0)

    user_topic = topic_config.get("topic", "") if topic_config else ""

    # ------------------------------------------------------------------
    # Phase A: build per-topic SRT + render plan. Serial because clamp/embed
    # touches GPU_LOCK internally; keeping this loop single-threaded avoids
    # holding the lock from multiple threads at once for no benefit (the
    # calls are all short — the expensive part is the ffmpeg render, which
    # IS parallelized in Phase B below).
    # ------------------------------------------------------------------
    render_plan = []
    for ti, t in enumerate(sorted_topics):
        tid = t["topic_id"]
        title = t.get("title", f"Topic {tid}")
        log.info("[%s] topic %d/%d: %s", job_id, ti + 1, n_topics, title)

        slice_segs = [s for s in segs if t["start_index"] <= s["index"] <= t["end_index"]]
        if not slice_segs:
            continue

        selected = list(selections.get(tid, []))
        if len(selected) <= 1 and len(slice_segs) >= 5:
            mid = len(slice_segs) // 2
            seed_count = min(8, len(slice_segs))
            start = max(0, mid - seed_count // 2)
            selected = sorted({slice_segs[i]["index"] for i in range(start, start + seed_count)})

        topic_total = sum(s["end"] - s["start"] for s in slice_segs)
        if topic_total < target_min:
            log.info("[%s] topic %s block only %.1fs < target_min=%ss, skipping", job_id, tid, topic_total, target_min)
            continue

        topic_query = " | ".join(s for s in [user_topic, title, t.get("description", "")] if s).strip()

        selected = _clamp_to_target(selected, segs, target_min, target_max, topic_query, embed_model)
        selected = _ensure_complete_ending(selected, segs)
        cur_dur = sum(by_idx[i]["end"] - by_idx[i]["start"] for i in selected if i in by_idx)
        if cur_dur > target_max:
            selected = _clamp_to_target(selected, segs, target_min, target_max, topic_query, embed_model)
        if not selected:
            continue

        dur = sum(by_idx[i]["end"] - by_idx[i]["start"] for i in selected if i in by_idx)
        if dur < MIN_TOPIC_DURATION_SEC:
            log.info("[%s] topic %s too short after clamp (%.1fs), skipping", job_id, tid, dur)
            continue

        topic_srt = os.path.join(OUTPUT_DIR, f"topic_{job_id}_{tid}.srt")
        srt_blocks, cnt = [], 1
        win_start_src = win_end_src = None
        for i in selected:
            s = by_idx.get(i)
            if not s:
                continue
            if win_start_src is None or s["start"] < win_start_src:
                win_start_src = s["start"]
            if win_end_src is None or s["end"] > win_end_src:
                win_end_src = s["end"]
            srt_blocks.append(f"{cnt}\n{seconds_to_srt_time(s['start'])} --> {seconds_to_srt_time(s['end'])}\n{s['text']}")
            cnt += 1
        with open(topic_srt, "w", encoding="utf-8") as f:
            f.write("\n\n".join(srt_blocks))

        safe_title = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')[:30] or f"topic{tid}"
        safeid = uuid.uuid4().hex[:6]
        topic_output = os.path.join(OUTPUT_DIR, f"highlight_{job_id}_{safe_title}_{safeid}.mp4")

        render_plan.append({
            "tid": tid, "title": title, "description": t.get("description", ""),
            "topic_srt": topic_srt, "topic_output": topic_output,
            "window_start": max(0.0, (win_start_src or 0.0) - 1.0),
            "window_end": (win_end_src or 0.0) + 1.0,
            "duration": dur,
        })

    # ------------------------------------------------------------------
    # Phase B: parallel render + upload. ffmpeg (libx264) is CPU-bound and
    # Cloudinary upload is network-bound, so a small thread pool overlaps
    # them across topics. MAX_RENDER_WORKERS=2 is a reasonable default for
    # Colab's ~2-4 vCPU runtimes; raise via env if you have more cores.
    # ------------------------------------------------------------------
    def _render_and_upload(plan):
        tid = plan["tid"]
        try:
            split_and_burn_subs(
                video_path, plan["topic_srt"], plan["topic_output"],
                window_start=plan["window_start"], window_end=plan["window_end"],
            )
            cloud_url, cld_duration = upload_topic_video_to_cloudinary(
                plan["topic_output"], user_id, job_id, tid, source_original_filename,
            )
            srt_url = upload_topic_srt_to_cloudinary(plan["topic_srt"], user_id, job_id, tid)
            return {
                "topic_id": tid,
                "title": plan["title"],
                "description": plan["description"],
                "download_url": cloud_url,
                "srt_url": srt_url,
                "duration": round(cld_duration or plan["duration"], 1),
            }
        finally:
            for p in [plan["topic_srt"], plan["topic_output"]]:
                if p and os.path.exists(p):
                    try: os.remove(p)
                    except OSError: pass

    if not render_plan:
        log.warning("[%s] multi-output done: 0 topic videos created", job_id)
        return []

    if MAX_RENDER_WORKERS <= 1 or len(render_plan) == 1:
        for plan in render_plan:
            try:
                r = _render_and_upload(plan)
                if r:
                    results.append(r)
            except Exception as e:
                log.error("[%s] topic %s render/upload FAILED: %s", job_id, plan["tid"], e)
    else:
        with ThreadPoolExecutor(max_workers=min(MAX_RENDER_WORKERS, len(render_plan))) as ex:
            future_to_tid = {ex.submit(_render_and_upload, plan): plan["tid"] for plan in render_plan}
            for fut in as_completed(future_to_tid):
                tid = future_to_tid[fut]
                try:
                    r = fut.result()
                    if r:
                        results.append(r)
                except Exception as e:
                    log.error("[%s] topic %s render/upload FAILED: %s", job_id, tid, e)
        # Parallel completion order is nondeterministic; sort for a stable response.
        results.sort(key=lambda r: r["topic_id"])

    log.info("[%s] multi-output done: %d topic videos created", job_id, len(results))
    return results


# ============================================================================
# RENDER: cut video + burn-in subtitles
# ============================================================================
def merge_segments_for_video(segments, gap_threshold=0.5):
    if not segments: return []
    merged = [segments[0].copy()]
    for seg in segments[1:]:
        if seg["end"] - seg["start"] <= 0 or seg["start"] - merged[-1]["end"] <= gap_threshold:
            merged[-1]["end"] = max(merged[-1]["end"], seg["end"])
        else:
            merged.append(seg.copy())
    return merged


def split_and_burn_ass(input_video, srt_file, output_video):
    """Bản render single-pass siêu tốc, kế thừa từ run_batch.py nhưng xài chung UI filter của hệ thống"""
    temp_dir = os.path.join(TEMP_DIR, f"tmp_{uuid.uuid4()}")
    os.makedirs(temp_dir, exist_ok=True)
    input_abs = os.path.abspath(input_video)
    output_abs = os.path.abspath(output_video)

    segments = srt_to_segments(srt_file)
    video_segments = merge_segments_for_video(segments)

    if not video_segments:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise ValueError("No highlight segments to render")

    window_start = max(0.0, min(seg["start"] for seg in video_segments) - 1.0)
    window_end = max(seg["end"] for seg in video_segments) + 1.0
    shift = window_start

    # Build lại SRT liên tục theo trục thời gian mới
    out_srt = os.path.join(temp_dir, "subs.srt")
    cumulative = 0.0
    blocks = []
    si = 1
    for seg_v in video_segments:
        v_start, v_end = seg_v["start"], seg_v["end"]
        v_dur = max(0.0, v_end - v_start)
        for s in segments:
            if s["start"] >= v_end or s["end"] <= v_start:
                continue
            vis_start = max(s["start"], v_start)
            vis_end = min(s["end"], v_end)
            if vis_end - vis_start < 0.3:
                continue
            rel_start = cumulative + (vis_start - v_start)
            rel_end = cumulative + (vis_end - v_start)
            if rel_end - rel_start < 0.6:
                rel_end = min(cumulative + v_dur, rel_start + 0.6)
            if rel_end <= rel_start:
                continue
            blocks.append(f"{si}\n{seconds_to_srt_time(rel_start)} --> {seconds_to_srt_time(rel_end)}\n{s['text']}\n")
            si += 1
        cumulative += v_dur

    with open(out_srt, "w", encoding="utf-8") as f:
        f.write("\n".join(blocks))

    select_expr = "+".join(
        f"between(t,{max(0.0, seg['start']-shift):.3f},{max(0.0, seg['end']-shift):.3f})"
        for seg in video_segments
    )

    # Dùng UI Subtitle gốc của hệ thống (bo góc xịn)
    subtitle_filter = get_subtitle_filter(out_srt)

    vf = (
        f"select='{select_expr}',"
        f"setpts=N/FRAME_RATE/TB,"
        f"{subtitle_filter}"
    )
    af = f"aselect='{select_expr}',asetpts=N/SR/TB"

    run_cmd([
        "ffmpeg", "-y",
        "-ss", f"{window_start:.3f}",
        "-to", f"{window_end:.3f}",
        "-i", input_abs,
        "-vf", vf,
        "-af", af,
        "-c:v", "libx264", "-preset", "ultrafast",
        "-c:a", "aac",
        output_abs,
    ], cwd=temp_dir)

    shutil.rmtree(temp_dir, ignore_errors=True)


# ============================================================================
# QUIZ — gọi OpenAI gen quiz từ SRT (chuyển từ transcribe_quiz_main.py)
# ============================================================================
QUIZ_SYSTEM_PROMPT = """You are an expert educational content creator. Generate multiple-choice quiz questions from a video transcript. Every question MUST be answerable directly from the transcript; if something is not clearly stated, do not ask about it.

CONTENT RULES:
1. Each question tests ONE concrete fact, concept, or step that is explicitly stated in the transcript.
2. Each question is self-contained: NO "according to the speaker", NO pronouns like "this/it/he" referring to unseen context. Someone who did not watch the video must still understand the question.
3. Type mix: ~70% "mcq", ~30% "true_false". For "true_false", keep roughly half the answers True and half False.
4. Difficulty: easy = recall one stated fact; medium = combine two stated facts or apply a stated rule; hard = reason over a relationship that is explicitly supported. Distribute ~30% easy, ~50% medium, ~20% hard.
5. Skip intros, greetings, sponsor reads, and sign-offs.

OPTION RULES:
6. "mcq": exactly 4 options. "true_false": exactly 2 options ("True", "False").
7. Exactly ONE option is correct. Wrong options must be plausible and reflect common misconceptions about the same topic.
8. Keep all options similar in length and style — do NOT make the correct one longer or more detailed. No "All of the above" / "None of the above".
9. Vary the position of the correct option across questions; do not always place it in the same slot.

SCHEMA RULES (must be internally consistent):
10. "options" = array of objects {"optionText": string, "isCorrect": boolean, "orderIndex": integer starting at 1}. Exactly one option has "isCorrect": true.
11. "correct_index" = 0-based index of the correct option in the array (the one with "isCorrect": true).
12. "evidence" = a timestamp copied from the transcript line that proves the answer, format "HH:MM:SS,mmm", NO square brackets.  WRONG: "[00:01:23,456]"  RIGHT: "00:01:23,456".
13. "explanation" = one sentence saying why the correct option is right, based only on the transcript.
14. Write every field (question, options, explanation) in the SAME language as the transcript.

OUTPUT FORMAT:
{
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "...",
      "options": [
        { "optionText": "...", "isCorrect": false, "orderIndex": 1 },
        { "optionText": "...", "isCorrect": true, "orderIndex": 2 },
        { "optionText": "...", "isCorrect": false, "orderIndex": 3 },
        { "optionText": "...", "isCorrect": false, "orderIndex": 4 }
      ],
      "correct_index": 1,
      "explanation": "...",
      "evidence": "HH:MM:SS,mmm"
    }
  ]
}
"""


def build_quiz_user_prompt(srt_items, n, difficulty):
    lines = [f"[{ms_to_srt_time(it['start_ms'])}] {it['text']}" for it in srt_items]
    return f"""Generate up to {n} questions (prefer fewer, well-grounded questions over inventing unsupported ones). Difficulty: {difficulty}.
Max valid srt_index = {srt_items[-1]['index']} — DO NOT cite indices beyond this.

TRANSCRIPT:
{chr(10).join(lines)}

Return JSON."""


def chunk_srt_for_context(srt_items, max_chars=100000):
    """gpt-4o-mini context 128k → có thể fit 30k-50k SRT entries → ít khi cần chia."""
    chunks, cur, cur_chars = [], [], 0
    for it in srt_items:
        lc = len(it["text"]) + 30
        if cur_chars + lc > max_chars and cur:
            chunks.append(cur); cur, cur_chars = [], 0
        cur.append(it); cur_chars += lc
    if cur: chunks.append(cur)
    return chunks


def validate_questions(questions, srt_items):
    out = []
    for q in questions:
        if not isinstance(q, dict): continue
        # Check xem có đủ các trường bắt buộc của BE khóa học không
        if not all(k in q for k in ("id", "type", "question", "options", "correct_index", "evidence")):
            continue
        # Check type hợp lệ
        if q["type"] not in ("mcq", "true_false", "short_text"):
            continue
        # Ép options phải là 1 list
        if not isinstance(q["options"], list) or len(q["options"]) == 0:
            continue

        out.append(q)
    return out


def call_openai_quiz(srt_items, num_questions, difficulty):
    if not openai_client:
        raise RuntimeError("OPENAI_API_KEY not set")
    chunks = chunk_srt_for_context(srt_items, max_chars=100000)
    log.info("Quiz: %d entries → %d chunk(s) → target %d questions", len(srt_items), len(chunks), num_questions)
    per = max(1, num_questions // len(chunks))
    rem = num_questions - per * len(chunks)
    all_q = []
    for i, ch in enumerate(chunks):
        n = per + (1 if i < rem else 0)
        resp = openai_chat_create(
            model=OPENAI_MODEL,
            response_format={"type": "json_object"},
            temperature=0.4,
            messages=[
                {"role": "system", "content": QUIZ_SYSTEM_PROMPT},
                {"role": "user", "content": build_quiz_user_prompt(ch, n, difficulty)},
            ],
        )
        try:
            data = json.loads(resp.choices[0].message.content)
            all_q.extend(data.get("questions", []))
        except json.JSONDecodeError as e:
            log.warning("Chunk %d JSON fail: %s", i, e)
    return {"questions": validate_questions(all_q, srt_items),
            "total": len(all_q), "model": OPENAI_MODEL}


# ============================================================================
# BACKGROUND TASKS
# ============================================================================
def _stage(job_id, user_id, jtype, msg):
    if job_id in jobs:
        jobs[job_id]["stage"] = msg
        jobs[job_id]["status"] = "processing"
    log.info("[%s] %s", job_id, msg)
    qstash_publish({"event": "stage_update", "job_id": job_id, "user_id": user_id,
                    "type": jtype, "stage": msg, "status": "processing"})


def process_transcribe(job_id, user_id, video_url, source_filename, language, video_id=None):
    """GPU_JOB_SEM: this always calls Whisper locally (no OpenAI option for
    transcription), so it's gated by the same job-level semaphore as the
    highlight pipelines to avoid piling multiple GPU jobs into VRAM at once."""
    srt_path = os.path.join(OUTPUT_DIR, f"subtitle_{job_id}.srt")
    video_local = None
    with GPU_JOB_SEM:
        try:
            url_path = urlparse(video_url).path.lower()
            if url_path.endswith(".m3u8"):
                _stage(job_id, user_id, "subtitle", "1/2: Downloading HLS")
                video_local = os.path.join(OUTPUT_DIR, f"video_{job_id}.mp4")
                download_video_from_url(video_url, video_local)
                src = video_local
            else:
                _stage(job_id, user_id, "subtitle", "1/2: Streaming + transcribing")
                src = video_url
            transcribe_video_to_srt(src, srt_path, language=language)

            _stage(job_id, user_id, "subtitle", "2/2: Uploading SRT")
            srt_url = upload_srt_to_cloudinary(srt_path, user_id, job_id)

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result"] = {
                "srt_url": srt_url,
                "source_original_filename": source_filename,
                "video_id": video_id,
            }
            jobs[job_id]["type"] = "subtitle"
            # `video_id`: media_service webhook ưu tiên update videos WHERE id=<video_id>
            # (thay vì findOrCreate by job_id → tránh orphan row)
            qstash_publish({
                "event": "completed", "job_id": job_id, "user_id": user_id,
                "type": "subtitle", "srt_url": srt_url,
                "source_original_filename": source_filename,
                "video_id": video_id,
            })
        except Exception as e:
            log.exception("[%s] Transcribe failed", job_id)
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["result"] = {"error": str(e)}
            qstash_publish({"event": "job_failed", "job_id": job_id, "user_id": user_id,
                            "type": "subtitle", "status": "failed", "error_message": str(e)})
        finally:
            for p in (video_local, srt_path):
                if p and os.path.exists(p):
                    try: os.remove(p)
                    except: pass


def process_highlight(job_id, user_id, video_url, source_filename, topic,
                       include_keywords, exclude_keywords, is_openai,
                       srt_url, language, target_min, target_max,
                       keep_indices=None, remove_indices=None, video_id=None):
    """Pipeline highlight với optional srt_url.

    keep_indices/remove_indices: SRT indices already validated by
    _create_highlight_job (only ever non-empty when is_openai=True — see
    that function's pipeline-mode gate). Threaded through to
    pipeline_select_highlight_openai(); ignored by the local pipeline.

    video_id: ID của row `videos` nguồn (nếu FE gửi kèm) — chỉ được echo
    lại vào webhook payload để backend lưu `original_video_id`, không ảnh
    hưởng logic render.

    srt_url is None  →  transcribe + select + render
    srt_url provided →  use it directly + select + render (skip transcribe)

    GPU_JOB_SEM: gates the whole job so at most MAX_CONCURRENT_GPU_JOBS
    highlight/transcribe jobs run at once (see comment near GPU_JOB_SEM).
    """
    video_path = os.path.join(OUTPUT_DIR, f"video_{job_id}.mp4")
    full_srt = os.path.join(OUTPUT_DIR, f"full_{job_id}.srt")
    selected_srt = os.path.join(OUTPUT_DIR, f"selected_{job_id}.srt")
    output_video = os.path.join(OUTPUT_DIR, f"highlight_{job_id}.mp4")

    with GPU_JOB_SEM:
        try:
            # ---- Step 1: get SRT ----
            if srt_url:
                _stage(job_id, user_id, "highlight", "1/4: Downloading provided SRT")
                download_srt_from_url(srt_url, full_srt)
                # Vẫn cần video để render
                _stage(job_id, user_id, "highlight", "1b/4: Downloading video for render")
                download_video_from_url(video_url, video_path)
            else:
                _stage(job_id, user_id, "highlight", "1/4: Downloading + transcribing video")
                download_video_from_url(video_url, video_path)
                transcribe_video_to_srt(video_path, full_srt, language=language)

            # ---- Step 2: select highlight ----
            _stage(job_id, user_id, "highlight",
                   f"2/4: Selecting highlights ({'OpenAI' if is_openai else 'local Qwen'})")

            if is_openai:
                selected_groups, all_segments = pipeline_select_highlight_openai(
                    full_srt, topic, target_min, target_max,
                    keep_indices=keep_indices, remove_indices=remove_indices,
                )
            else:
                topic_config = {
                    "topic": topic,
                    "include": [k.strip() for k in include_keywords.split(",") if k.strip()],
                    "exclude": [k.strip() for k in exclude_keywords.split(",") if k.strip()],
                }
                selected_groups, all_segments = pipeline_select_highlight_local(
                    full_srt, topic_config, app.state.embed_model,
                    app.state.llm, app.state.tokenizer, app.state.device,
                    max_total_duration=target_max,
                )

            if not selected_groups:
                raise ValueError("No highlight segments selected (score too low or no topic match)")
            save_srt(selected_groups, all_segments, selected_srt)

            # ---- Step 3: render ----
            _stage(job_id, user_id, "highlight", "3/4: Rendering + burning subtitles")
            split_and_burn_ass(video_path, selected_srt, output_video)

            # ---- Step 4: upload video ----
            _stage(job_id, user_id, "highlight", "4/4: Uploading highlight video")
            video_cloud_url, cld_duration = upload_video_to_cloudinary(
                output_video, user_id, job_id, "highlight", source_filename,
            )
            # ffprobe fallback nếu Cloudinary chưa kịp probe
            duration = cld_duration or get_video_duration_seconds(output_video)

            # Upload luôn selected_srt (thay vì chỉ xoá đi như trước) — đây chính
            # là danh sách đoạn đang có trong highlight, dùng làm srt_raw_url của
            # video này để feature "chỉnh sửa đoạn" (xoá bớt) đọc lại sau này.
            # Chỉ upload cho single-output; timestamp trong file này là timestamp
            # gốc của video nguồn (save_srt() không re-base timeline).
            selected_srt_cloud_url = upload_srt_to_cloudinary(selected_srt, user_id, job_id)

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result"] = {
                "download_url": video_cloud_url,
                "source_original_filename": source_filename,
                "duration": duration,
                "selected_count": len(selected_groups),
                "selected_duration_s": sum(g["end"] - g["start"] for g in selected_groups),
                "used_provided_srt": bool(srt_url),
                "mode": "openai" if is_openai else "local",
            }
            jobs[job_id]["type"] = "highlight"
            qstash_publish({
                "event": "completed", "job_id": job_id, "user_id": user_id,
                "type": "highlight",
                # Backend đọc `payload.url ?? payload.video_url` — gửi cả 2 cho an toàn
                "video_url": video_cloud_url,
                "url": video_cloud_url,
                "duration": duration,
                "source_original_filename": source_filename,
                "video_id": video_id,          # ID video nguồn — backend lưu original_video_id
                "srt_url": selected_srt_cloud_url,   # đoạn hiện có trong highlight — backend lưu srt_raw_url
            })
        except Exception as e:
            log.exception("[%s] Highlight failed", job_id)
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["result"] = {"error": str(e)}
            qstash_publish({"event": "job_failed", "job_id": job_id, "user_id": user_id,
                            "type": "highlight", "status": "failed", "error_message": str(e)})
        finally:
            for p in (video_path, full_srt, selected_srt, output_video):
                if os.path.exists(p):
                    try: os.remove(p)
                    except: pass


def process_highlight_multi(job_id, user_id, video_url, source_filename, topic,
                            include_keywords, exclude_keywords, is_openai,
                            srt_url, language, target_min, target_max,
                            keep_indices=None, remove_indices=None, video_id=None):
    """Multi-output highlight: transcribe ONCE, outline into topics, then
    render + upload one video per topic. See highlight_pipeline_multi() for
    the actual outline/select/render logic; this wrapper only handles the
    job lifecycle (stage updates, download/transcribe, cleanup, QStash),
    mirroring process_highlight()'s structure so both are easy to compare.

    video_id: accepted only so this shares a call signature with
    process_highlight() at the _create_highlight_job() call site — deliberately
    unused here. Multi-output highlights must NOT get original_video_id
    persisted (out of scope, spec FR-008 — segment removal is single-output
    only); this parameter is intentionally never echoed into this function's
    webhook payload.

    Same srt_url skip-transcribe option as process_highlight(), added here
    for parity even though the old notebook's multi pipeline always
    transcribed inline.

    keep_indices/remove_indices: accepted only for call-site parity with
    process_highlight (_create_highlight_job dispatches to whichever
    function via the same argument tuple) — unused here, since keep/remove
    selection is only supported for the single-output OpenAI pipeline
    (_create_highlight_job rejects isMultiOutput=true + keep/remove before
    a job is ever created).

    GPU_JOB_SEM: gates the whole job (same semaphore as process_highlight /
    process_transcribe) — this is the heaviest of the three (outline +
    batched select + per-topic clamp all call the LLM/embedding models), so
    it benefits the most from not overlapping with another GPU job.
    """
    video_path = os.path.join(OUTPUT_DIR, f"video_{job_id}.mp4")
    full_srt = os.path.join(OUTPUT_DIR, f"full_{job_id}.srt")

    with GPU_JOB_SEM:
        try:
            # ---- Step 1: get SRT ----
            if srt_url:
                _stage(job_id, user_id, "highlight-multi", "1/3: Downloading provided SRT")
                download_srt_from_url(srt_url, full_srt)
                _stage(job_id, user_id, "highlight-multi", "1b/3: Downloading video for render")
                download_video_from_url(video_url, video_path)
            else:
                _stage(job_id, user_id, "highlight-multi", "1/3: Downloading + transcribing video")
                download_video_from_url(video_url, video_path)
                transcribe_video_to_srt(video_path, full_srt, language=language)

            # ---- Step 2: outline + select + render per topic ----
            _stage(job_id, user_id, "highlight-multi",
                   f"2/3: Outlining + rendering topic videos ({'OpenAI' if is_openai else 'local Qwen'})")
            topic_config = _build_topic_config(topic, include_keywords, exclude_keywords)
            video_results = highlight_pipeline_multi(
                full_srt, video_path, job_id, user_id, topic_config,
                target_min=target_min, target_max=target_max,
                use_openai=is_openai,
                llm=app.state.llm, tokenizer=app.state.tokenizer,
                embed_model=app.state.embed_model,
                source_original_filename=source_filename,
            )
            if not video_results:
                raise ValueError("No topic videos produced (outline found nothing usable, or every topic was too short)")

            # ---- Step 3: upload the full transcript SRT + finalize ----
            _stage(job_id, user_id, "highlight-multi", "3/3: Uploading full transcript SRT")
            full_srt_url = upload_srt_to_cloudinary(full_srt, user_id, job_id)

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result"] = {
                "videos": video_results,
                "srt_url": full_srt_url,
                "source_original_filename": source_filename,
                "used_provided_srt": bool(srt_url),
                "mode": "openai" if is_openai else "local",
                "topic_count": len(video_results),
            }
            jobs[job_id]["type"] = "highlight-multi"
            qstash_publish({
                "event": "completed", "job_id": job_id, "user_id": user_id,
                "type": "highlight-multi",
                "videos": video_results,
                "srt_url": full_srt_url,
                "source_original_filename": source_filename,
            })
        except Exception as e:
            log.exception("[%s] Highlight-multi failed", job_id)
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["result"] = {"error": str(e)}
            qstash_publish({"event": "job_failed", "job_id": job_id, "user_id": user_id,
                            "type": "highlight-multi", "status": "failed", "error_message": str(e)})
        finally:
            for p in (video_path, full_srt):
                if os.path.exists(p):
                    try: os.remove(p)
                    except: pass


def process_quiz(job_id, user_id, srt_url, long_video_url, source_filename, num_questions, difficulty, language,
                 lesson_activity_id=None, video_id=None, quiz_name=None,
                 shuffle_question=None, shuffle_option=None, passing_score=None,
                 time_limit_minutes=None, is_in_video=None,
                 start_time=None, end_time=None):
    srt_path = os.path.join(OUTPUT_DIR, f"srt_quiz_{job_id}.srt")
    video_local = None # Lưu file local nếu cần tải video HLS
    final_srt_url = srt_url # URL cuối cùng sẽ gửi về webhook

    try:
        if srt_url:
            _stage(job_id, user_id, "quiz", "1/4: Downloading provided SRT")
            download_srt_from_url(srt_url, srt_path)
        elif long_video_url:
            _stage(job_id, user_id, "quiz", "1/4: Transcribing video (no SRT provided)")
            # Tương tự logic process_transcribe
            url_path = urlparse(long_video_url).path.lower()
            if url_path.endswith(".m3u8"):
                video_local = os.path.join(OUTPUT_DIR, f"video_quiz_{job_id}.mp4")
                download_video_from_url(long_video_url, video_local)
                src = video_local
            else:
                src = long_video_url

            # Chạy Whisper để gen SRT
            transcribe_video_to_srt(src, srt_path, language=language)

            _stage(job_id, user_id, "quiz", "2/4: Uploading generated SRT")
            # Upload cái SRT vừa gen lên Cloudinary để sau này lưu vào DB luôn
            final_srt_url = upload_srt_to_cloudinary(srt_path, user_id, job_id)
        else:
            raise ValueError("Cần cung cấp ít nhất srt_url hoặc long_video_url")

        with open(srt_path, "rb") as f: raw = f.read()
        if raw.startswith(b"\xef\xbb\xbf"): raw = raw[3:]
        srt_text = raw.decode("utf-8", errors="replace")
        srt_items = parse_srt_ms(srt_text)
        if not srt_items:
            raise ValueError(f"SRT parsed 0 entries from {len(raw)}B. Head: {srt_text[:200]!r}")

        # =========================================================
        # LỌC SRT THEO KHOẢNG THỜI GIAN START_TIME -> END_TIME
        # =========================================================
        # print("start_time", start_time, "end_time", end_time)
        print("check srt_items before: ", srt_items)
        if start_time is not None and end_time is not None:
            # Đổi giây ra mili-giây để so sánh với srt_items
            start_ms_filter = int(start_time * 1000)
            end_ms_filter = int(end_time * 1000)
            print("start_ms_filter: ", start_ms_filter)
            print("end_ms_filter: ", end_ms_filter)
            original_len = len(srt_items)

            # Giữ lại các đoạn phụ đề nằm gọn trong, hoặc có giao cắt với khoảng thời gian yêu cầu
            srt_items = [
                seg for seg in srt_items
                if seg["end_ms"] >= start_ms_filter and seg["start_ms"] <= end_ms_filter
            ]

            if not srt_items:
                raise ValueError(f"Không có nội dung phụ đề nào trong khoảng {start_time}s đến {end_time}s")

            log.info("[%s] Đã cắt SRT: %d -> %d câu (từ %ss đến %ss)", job_id, original_len, len(srt_items), start_time, end_time)
        # =========================================================

        print("check srt_items after: ", srt_items)

        _stage(job_id, user_id, "quiz", f"3/4: Generating {num_questions} questions")
        quiz_result = call_openai_quiz(srt_items, num_questions, difficulty)

        _stage(job_id, user_id, "quiz", "4/4: Done")
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = {
            "quiz": quiz_result,
            "srt_url": final_srt_url,
            "source_original_filename": source_filename,
            "lesson_activity_id": lesson_activity_id,
            "video_id": video_id,
            "num_questions_requested": num_questions,
            "num_questions_generated": len(quiz_result["questions"]),

            "shuffleQuestion": shuffle_question,
            "shuffleOption": shuffle_option,
            "passingScore": passing_score,
            "timeLimitMinutes": time_limit_minutes,
            "isInVideo": is_in_video,

            "startTime": start_time,
            "endTime": end_time,
        }
        jobs[job_id]["type"] = "quiz"
        # media_service webhook đọc `lesson_activity_id`, `video_id`, `quiz_name`
        # và POST course_service `/quizzes/from-ai`
        qstash_publish({
            "event": "completed", "job_id": job_id, "user_id": user_id,
            "type": "quiz",
            "srt_url": final_srt_url,
            "source_original_filename": source_filename,
            "lesson_activity_id": lesson_activity_id,
            "video_id": video_id,
            "quiz_name": quiz_name,
            "quiz": quiz_result,

            "shuffleQuestion": shuffle_question,
            "shuffleOption": shuffle_option,
            "passingScore": passing_score,
            "timeLimitMinutes": time_limit_minutes,
            "isInVideo": is_in_video,

            "startTime": start_time,
            "endTime": end_time,
        })
    except Exception as e:
        log.exception("[%s] Quiz failed", job_id)
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["result"] = {"error": str(e)}
        qstash_publish({"event": "job_failed", "job_id": job_id, "user_id": user_id,
                        "type": "quiz", "status": "failed", "error_message": str(e)})
    finally:
        if os.path.exists(srt_path):
            try: os.remove(srt_path)
            except: pass


# ============================================================================
# ROUTES
# ============================================================================
@app.get("/")
def home():
    return {
        "service": "Unified API (Transcribe + Highlight + Quiz)",
        "endpoints": {
            "transcribe":   "POST /transcribe — video_url → SRT → Cloudinary + QStash",
            "highlight":    "POST /highlight-reel(-link) — video_url + (optional) srt_url → highlight video",
            "quiz":         "POST /generate-quiz — srt_url → quiz JSON",
            "status":       "GET /jobs/status/{job_id}",
        },
        "highlight_modes": {
            "single (isMultiOutput=false, default)": "1 combined highlight video for the whole topic",
            "multi (isMultiOutput=true)": "outline transcript into topics, 1 highlight video + 1 SRT per topic (result.videos)",
        },
        "models": {
            "whisper": WHISPER_MODEL,
            "llm": LLM_MODEL_ID,
            "openai": OPENAI_MODEL,
        },
    }


@app.post("/transcribe", status_code=202)
async def transcribe_endpoint(
    background_tasks: BackgroundTasks,
    video_url: str = Form(...),
    user_id: str = Form(...),
    source_original_filename: str = Form(""),
    language: Optional[str] = Form(None),
    # `video_id`: ID của row `videos` đã tồn tại (sau khi upload Bunny xong).
    # Khi truyền vào → media_service webhook tự update SRT vào row này.
    video_id: Optional[int] = Form(None),
):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "stage": "Queued", "result": None,
                    "user_id": user_id, "type": "subtitle",
                    "source_original_filename": source_original_filename,
                    "video_id": video_id,
                    "created_at": time.time()}
    background_tasks.add_task(
        process_transcribe, job_id, user_id, video_url,
        source_original_filename, language, video_id,
    )
    return {"job_id": job_id, "status": "pending", "type": "subtitle",
            "video_id": video_id}


from fastapi import Body
from pydantic import BaseModel, Field


class SegmentRange(BaseModel):
    """1 đoạn phụ đề liên tục, xác định theo SRT index (1-based)."""
    start_index: int
    end_index: int


class HighlightLinkBody(BaseModel):
    """JSON body của /highlight-reel-link — khớp với inference_service forward."""
    user_id: str = Field(..., description="User ID")
    video_url: str = Field(..., description="Public video URL")
    video_id: Optional[int] = None   # ID của row `videos` nguồn — dùng để backend
                                      # lưu original_video_id khi highlight tạo xong
    source_original_filename: str = ""
    topic: str = ""
    include_keywords: str = ""
    exclude_keywords: str = ""
    isOpenAI: str = "false"   # giữ tên camelCase y như backend forward
    isMultiOutput: str = "false"   # true → 1 video/topic (process_highlight_multi), giữ tên camelCase như bản cũ
    srt_url: Optional[str] = None   # ← optional: skip transcribe khi có
    language: Optional[str] = None
    target_min: int = 60
    target_max: int = 180
    # Đoạn phụ đề bắt buộc giữ / bắt buộc loại bỏ. Chỉ hỗ trợ khi
    # isOpenAI=true và isMultiOutput=false — validate trong _create_highlight_job.
    keep_ranges: Optional[List[SegmentRange]] = None
    remove_ranges: Optional[List[SegmentRange]] = None


def resolve_segment_ranges(ranges, valid_indices):
    """Expand a list of SegmentRange (start_index/end_index, inclusive) into
    the set of SRT indices they cover. Returns (resolved, invalid) — `invalid`
    holds any index in a range that doesn't exist among `valid_indices`."""
    resolved, invalid = set(), set()
    for r in ranges or []:
        lo, hi = min(r.start_index, r.end_index), max(r.start_index, r.end_index)
        for i in range(lo, hi + 1):
            (resolved if i in valid_indices else invalid).add(i)
    return resolved, invalid


def _create_highlight_job(b: HighlightLinkBody, background_tasks: BackgroundTasks):
    if not b.video_url:
        raise HTTPException(400, "video_url is required")
    is_multi = b.isMultiOutput.lower() == "true"
    is_openai = b.isOpenAI.lower() == "true"
    uses_segment_selection = bool(b.keep_ranges or b.remove_ranges)

    keep_indices, remove_indices = set(), set()
    if uses_segment_selection:
        # ---- gate: only OpenAI single-output supports keep/remove ----
        if not is_openai or is_multi:
            raise HTTPException(
                400,
                "keep_ranges/remove_ranges are only supported when isOpenAI=true "
                "and isMultiOutput=false",
            )
        # ---- precondition: video must already have a saved subtitle file ----
        if not b.srt_url:
            raise HTTPException(
                400,
                "keep_ranges/remove_ranges require the video to already have a "
                "saved subtitle file (srt_url) — none was provided",
            )

        # ---- synchronously fetch + parse the SRT so indices can be validated
        #      before a job is ever created (not deferred to the async job) ----
        tmp_srt = os.path.join(OUTPUT_DIR, f"validate_{uuid.uuid4()}.srt")
        try:
            download_srt_from_url(b.srt_url, tmp_srt)
            segments = srt_to_segments(tmp_srt)
        finally:
            if os.path.exists(tmp_srt):
                try: os.remove(tmp_srt)
                except: pass

        valid_indices = {s["index"] for s in segments}
        by_idx = {s["index"]: s for s in segments}

        keep_indices, keep_invalid = resolve_segment_ranges(b.keep_ranges, valid_indices)
        remove_indices, remove_invalid = resolve_segment_ranges(b.remove_ranges, valid_indices)

        invalid = keep_invalid | remove_invalid
        if invalid:
            raise HTTPException(
                400,
                f"keep_ranges/remove_ranges reference subtitle indices that don't "
                f"exist in this video's subtitles: {sorted(invalid)}",
            )

        conflict = keep_indices & remove_indices
        if conflict:
            raise HTTPException(
                400,
                f"keep_ranges and remove_ranges conflict on indices: {sorted(conflict)}",
            )

        keep_duration = rendered_duration(keep_indices, by_idx) if keep_indices else 0
        if keep_duration > b.target_max:
            raise HTTPException(
                400,
                f"keep_ranges alone span {keep_duration:.0f}s, which exceeds "
                f"target_max={b.target_max}s",
            )

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "stage": "Queued", "result": None,
                    "user_id": b.user_id, "type": "highlight-multi" if is_multi else "highlight",
                    "source_original_filename": b.source_original_filename,
                    "created_at": time.time()}
    task_fn = process_highlight_multi if is_multi else process_highlight
    background_tasks.add_task(
        task_fn, job_id, b.user_id, b.video_url, b.source_original_filename,
        b.topic, b.include_keywords, b.exclude_keywords,
        is_openai,
        b.srt_url, b.language, b.target_min, b.target_max,
        sorted(keep_indices), sorted(remove_indices), b.video_id,
    )
    return {"job_id": job_id, "status": "pending", "type": "highlight-multi" if is_multi else "highlight",
            "used_provided_srt": bool(b.srt_url)}


@app.post("/highlight-reel-link", status_code=202)
async def highlight_link_endpoint(body: HighlightLinkBody, background_tasks: BackgroundTasks):
    """JSON body — khớp với `inference_service.createHighlightReelLink` forward."""
    return _create_highlight_job(body, background_tasks)


# ===========================================================================
# Highlight Segment Removal (spec 003-highlight-segment-removal) — bỏ bớt
# đoạn khỏi một highlight single-output ĐÃ tạo xong, luôn cắt lại từ video
# GỐC (không phải từ chính file highlight — timeline đã bị nén/ghép nên
# không map ngược về timestamp gốc được, xem research.md của spec).
# ===========================================================================

class HighlightEditBody(BaseModel):
    """JSON body của /highlight-edit-link — khớp với inference_service.editHighlightSegments forward."""
    user_id: str = Field(..., description="User ID")
    video_id: int = Field(..., description="ID của video highlight đang sửa (videos.id)")
    video_url: str = Field(..., description="URL video GỐC (không phải video highlight)")
    current_srt_url: str = Field(..., description="srt_raw_url hiện tại của video highlight")
    target_job_id: str = Field(
        ...,
        description=(
            "job_id GỐC (lúc tạo highlight) của video đang sửa — bắt buộc dùng lại "
            "cho các lần upload Cloudinary bên dưới, KHÔNG dùng job_id mới của lần "
            "sửa này, để tránh Cloudinary's own upload webhook tạo nhầm ra 1 row "
            "videos mới thay vì update đúng row đang sửa (xem comment trong "
            "process_highlight_edit)."
        ),
    )
    remove_ranges: List[SegmentRange] = Field(..., description="Đoạn cần bỏ, theo index của current_srt_url")


def process_highlight_edit(job_id, user_id, video_id, video_url, current_srt_url,
                            target_job_id, remove_indices):
    """Bỏ đoạn khỏi 1 highlight đã tạo — tải lại video gốc + srt hiện tại của
    highlight, loại các index bị đánh dấu bỏ, render lại bằng chính
    split_and_burn_ass() đã dùng cho lần tạo đầu tiên, rồi upload đè lên.

    remove_indices: index (trong current_srt_url tại thời điểm request) cần
    bỏ — đã được _create_highlight_edit_job validate trước khi job này chạy;
    vẫn re-check non-empty ở đây phòng trường hợp current_srt_url đổi giữa
    lúc validate và lúc job thực sự chạy (không thể xảy ra trong luồng hiện
    tại vì validate chạy đồng bộ ngay trước khi tạo job, nhưng giữ lại cho an toàn).
    """
    video_path = os.path.join(OUTPUT_DIR, f"editsrc_{job_id}.mp4")
    current_srt = os.path.join(OUTPUT_DIR, f"editcurrent_{job_id}.srt")
    kept_srt = os.path.join(OUTPUT_DIR, f"editkept_{job_id}.srt")
    output_video = os.path.join(OUTPUT_DIR, f"editout_{job_id}.mp4")

    with GPU_JOB_SEM:
        try:
            _stage(job_id, user_id, "highlight_edit", "1/3: Downloading source video + current segments")
            download_video_from_url(video_url, video_path)
            download_srt_from_url(current_srt_url, current_srt)
            segments = srt_to_segments(current_srt)
            all_indices = {s["index"] for s in segments}
            kept_indices = sorted(all_indices - set(remove_indices))
            if not kept_indices:
                raise ValueError("No segments left after removal")

            _stage(job_id, user_id, "highlight_edit", "2/3: Rendering + burning subtitles")
            save_srt([{"indices": kept_indices}], segments, kept_srt)
            split_and_burn_ass(video_path, kept_srt, output_video)

            # ---- upload: dùng target_job_id (KHÔNG phải job_id của lần sửa
            # này) để Cloudinary's own upload-complete webhook (độc lập với
            # qstash_publish bên dưới — xem HighlightEditBody.target_job_id)
            # update đúng row videos đang sửa thay vì tạo row mồ côi mới. ----
            _stage(job_id, user_id, "highlight_edit", "3/3: Uploading updated highlight")
            video_cloud_url, cld_duration = upload_video_to_cloudinary(
                output_video, user_id, target_job_id, "highlight",
            )
            duration = cld_duration or get_video_duration_seconds(output_video)
            kept_srt_cloud_url = upload_srt_to_cloudinary(kept_srt, user_id, target_job_id)

            jobs[job_id]["status"] = "completed"
            jobs[job_id]["result"] = {
                "download_url": video_cloud_url,
                "duration": duration,
                "kept_count": len(kept_indices),
                "removed_count": len(remove_indices),
            }
            qstash_publish({
                "event": "completed", "job_id": job_id, "user_id": user_id,
                "type": "highlight_edit", "video_id": video_id,
                "video_url": video_cloud_url, "url": video_cloud_url,
                "duration": duration, "srt_url": kept_srt_cloud_url,
            })
        except Exception as e:
            log.exception("[%s] Highlight edit failed", job_id)
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["result"] = {"error": str(e)}
            qstash_publish({"event": "job_failed", "job_id": job_id, "user_id": user_id,
                            "type": "highlight_edit", "video_id": video_id,
                            "status": "failed", "error_message": str(e)})
        finally:
            for p in (video_path, current_srt, kept_srt, output_video):
                if os.path.exists(p):
                    try: os.remove(p)
                    except: pass


def _create_highlight_edit_job(b: HighlightEditBody, background_tasks: BackgroundTasks):
    # ---- synchronously fetch + parse the current SRT so indices can be
    #      validated before a job is ever created (mirrors _create_highlight_job) ----
    tmp_srt = os.path.join(OUTPUT_DIR, f"validate_edit_{uuid.uuid4()}.srt")
    try:
        download_srt_from_url(b.current_srt_url, tmp_srt)
        segments = srt_to_segments(tmp_srt)
    finally:
        if os.path.exists(tmp_srt):
            try: os.remove(tmp_srt)
            except: pass

    valid_indices = {s["index"] for s in segments}
    remove_indices, invalid = resolve_segment_ranges(b.remove_ranges, valid_indices)

    if invalid:
        raise HTTPException(
            400,
            f"remove_ranges reference subtitle indices that don't exist in this "
            f"highlight's current segments: {sorted(invalid)}",
        )
    if not remove_indices:
        raise HTTPException(400, "remove_ranges must mark at least one segment for removal")

    kept_indices = valid_indices - remove_indices
    if not kept_indices:
        raise HTTPException(
            400,
            "remove_ranges would remove every segment currently in the highlight — "
            "at least one must remain",
        )

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "stage": "Queued", "result": None,
                    "user_id": b.user_id, "type": "highlight_edit",
                    "created_at": time.time()}
    background_tasks.add_task(
        process_highlight_edit, job_id, b.user_id, b.video_id, b.video_url,
        b.current_srt_url, b.target_job_id, sorted(remove_indices),
    )
    return {"job_id": job_id, "status": "pending", "type": "highlight_edit"}


@app.post("/highlight-edit-link", status_code=202)
async def highlight_edit_link_endpoint(body: HighlightEditBody, background_tasks: BackgroundTasks):
    """JSON body — khớp với `inference_service.editHighlightSegments` forward."""
    return _create_highlight_edit_job(body, background_tasks)


@app.post("/highlight-reel", status_code=202)
async def highlight_form_endpoint(
    background_tasks: BackgroundTasks,
    # NestJS inference_service.createHighlightReel forward multipart với:
    #   - video: file (KHÔNG support — yêu cầu client dùng /highlight-reel-link với video_url)
    #   - topic, include_keywords, exclude_keywords, isOpenAI, isMultiOutput, user_id
    # Để giữ backward-compat với FE/client cũ, accept Form-data (KHÔNG file)
    # — caller chuyển sang video_url-based workflow.
    user_id: str = Form(...),
    video_url: Optional[str] = Form(None, description="REQUIRED — file upload không support"),
    source_original_filename: str = Form(""),
    topic: str = Form(""),
    include_keywords: str = Form(""),
    exclude_keywords: str = Form(""),
    isOpenAI: str = Form("false"),
    isMultiOutput: str = Form("false"),
    srt_url: Optional[str] = Form(None),
    language: Optional[str] = Form(None),
    target_min: int = Form(60),
    target_max: int = Form(180),
):
    if not video_url:
        raise HTTPException(
            400,
            "video_url is required. File upload không support — chuyển sang /highlight-reel-link "
            "với JSON body { video_url: ..., ... } qua inference_service.createHighlightReelLink",
        )
    return _create_highlight_job(
        HighlightLinkBody(
            user_id=user_id, video_url=video_url,
            source_original_filename=source_original_filename,
            topic=topic, include_keywords=include_keywords, exclude_keywords=exclude_keywords,
            isOpenAI=isOpenAI, isMultiOutput=isMultiOutput, srt_url=srt_url, language=language,
            target_min=target_min, target_max=target_max,
        ),
        background_tasks,
    )


@app.post("/generate-quiz", status_code=202)
async def quiz_endpoint(
    background_tasks: BackgroundTasks,
    srt_url: Optional[str] = Form(None),
    long_video_url: Optional[str] = Form(None),
    user_id: str = Form(...),
    source_original_filename: str = Form(""),
    num_questions: int = Form(10, ge=1, le=30),
    difficulty: str = Form("mixed"),
    language: Optional[str] = Form(None),
    # FE/BE phải truyền 2 field này khi muốn webhook tự lưu quiz vào course_service
    lesson_activity_id: Optional[int] = Form(None),
    video_id: Optional[int] = Form(None),
    quiz_name: Optional[str] = Form(None),

    shuffleQuestion: Optional[bool] = Form(None),
    shuffleOption: Optional[bool] = Form(None),
    passingScore: Optional[float] = Form(None),
    timeLimitMinutes: Optional[int] = Form(None),
    isInVideo: Optional[bool] = Form(None),

    start_time: Optional[float] = Form(None),
    end_time: Optional[float] = Form(None),
):
    if not srt_url and not long_video_url:
        raise HTTPException(400, "Phải cung cấp srt_url hoặc long_video_url")

    if difficulty not in ("easy", "medium", "hard", "mixed"):
        raise HTTPException(400, "difficulty must be easy|medium|hard|mixed")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "stage": "Queued", "result": None,
                    "user_id": user_id, "type": "quiz",
                    "source_original_filename": source_original_filename,
                    "created_at": time.time()}
    background_tasks.add_task(
        process_quiz, job_id, user_id, srt_url, long_video_url,
        source_original_filename, num_questions, difficulty, language,
        lesson_activity_id, video_id, quiz_name,
        shuffleQuestion, shuffleOption, passingScore, timeLimitMinutes, isInVideo,
        start_time, end_time
    )
    return {"job_id": job_id, "status": "pending", "type": "quiz"}


@app.get("/jobs/status/{job_id}")
def get_status(job_id: str):
    job = jobs.get(job_id)
    if not job: raise HTTPException(404, "Job not found")
    return job
