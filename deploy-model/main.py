# --- IMPORTS ---
import os, time, uuid, shutil, re, subprocess, warnings, glob, logging
from typing import Dict, Any, Optional

# AI & ML
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForCausalLM, logging as hf_logging
from sentence_transformers import SentenceTransformer, util
from faster_whisper import WhisperModel

# FastAPI
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException, Form
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# --- CONFIG ---
hf_logging.set_verbosity_error()
warnings.filterwarnings("ignore")

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = FastAPI(title="AI Video Highlight Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: Dict[str, Dict[str, Any]] = {}

# VPS PATHS
OUTPUT_DIR = "/opt/outputs"
SADTALKER_REPO_PATH = "/opt/sadtalker/SadTalker"
SADTALKER_PYTHON = "/opt/conda/envs/sadtalker/bin/python"

# --- STARTUP ---
@app.on_event("startup")
async def startup_event():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Detect GPUs
    num_gpus = torch.cuda.device_count() if DEVICE == "cuda" else 0
    print(f"🖥️  Device: {DEVICE}")
    
    if DEVICE == "cuda":
        print(f"🎮 GPUs detected: {num_gpus}")
        for i in range(num_gpus):
            print(f"  GPU {i}: {torch.cuda.get_device_name(i)} ({torch.cuda.get_device_properties(i).total_memory / 1024**3:.2f} GB)")
    
    # Distribute models across GPUs if multiple available
    whisper_device = DEVICE if num_gpus <= 1 else "cuda:0"
    embed_device = DEVICE if num_gpus <= 1 else "cuda:0"
    llm_device = "cuda:1" if num_gpus >= 2 else DEVICE
    
    app.state.device = DEVICE
    app.state.num_gpus = num_gpus

   # Load Whisper on GPU 0
    print(f"🎤 Loading Whisper on {whisper_device}...")
    start = time.time()
    # ✅ FIX: Use int8_float16 for CUDA (faster), int8 for CPU
    if whisper_device.startswith("cuda"):
        whisper_compute = "int8_float16"  # Best for RTX 4090
    else:
        whisper_compute = "int8"
    
    app.state.whisper = WhisperModel("base", device=whisper_device, compute_type=whisper_compute)
    print(f"✓ Whisper loaded ({time.time()-start:.2f}s) - compute_type: {whisper_compute}")

    # Load Embedding on GPU 0 (lightweight)
    print(f"🧠 Loading Embedding model on {embed_device}...")
    start = time.time()
    app.state.embed_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-mpnet-base-v2", device=embed_device)
    print(f"✓ Embedding loaded ({time.time()-start:.2f}s)")

    # Load LLM on GPU 1 if available, otherwise GPU 0
    print(f"🤖 Loading LLM on {llm_device}...")
    start = time.time()
    llm_id = "Qwen/Qwen2.5-1.5B-Instruct"
    tokenizer = AutoTokenizer.from_pretrained(llm_id, use_fast=True)
    if tokenizer.pad_token_id is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    if num_gpus >= 2:
        # Use specific GPU
        llm = AutoModelForCausalLM.from_pretrained(
            llm_id,
            torch_dtype=torch.float16,
            low_cpu_mem_usage=True
        ).to(llm_device)
    else:
        # Auto device map for single GPU or CPU
        llm = AutoModelForCausalLM.from_pretrained(
            llm_id,
            torch_dtype=torch.float16 if DEVICE=="cuda" else torch.float32,
            device_map="auto" if DEVICE=="cuda" else None,
            low_cpu_mem_usage=True
        )
    llm.eval()
    app.state.tokenizer = tokenizer
    app.state.llm = llm
    print(f"✓ LLM loaded ({time.time()-start:.2f}s)")

    # Check SadTalker
    if os.path.exists(SADTALKER_REPO_PATH):
        print(f"✓ SadTalker available at {SADTALKER_REPO_PATH}")
    else:
        print(f"⚠️  SadTalker not found - mascot feature disabled")

    print("🚀 Server ready!")

# --- HELPER FUNCTIONS ---

def parse_srt_time(s: str) -> float:
    h, m, rest = s.split(":")
    sec, ms = rest.split(",")
    return int(h)*3600 + int(m)*60 + int(sec) + int(ms)/1000.0

def seconds_to_srt_time(seconds: float) -> str:
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    ms = int(round((seconds - int(seconds)) * 1000))
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

def srt_to_segments(file_path):
    segs = []
    with open(file_path, "r", encoding="utf-8") as f:
        raw = f.read().strip()
    if not raw:
        return []
    blocks = re.split(r"\n\s*\n", raw)
    for blk in blocks:
        lines = [ln.strip() for ln in blk.splitlines() if ln.strip()]
        if len(lines) < 2:
            continue
        idx = int(lines[0]) if lines[0].isdigit() else len(segs) + 1
        time_line_idx = 1 if lines[0].isdigit() else 0
        text_lines_idx = time_line_idx + 1
        if "-->" not in lines[time_line_idx]:
            continue
        start_s, end_s = [t.strip() for t in lines[time_line_idx].split("-->")]
        segs.append({
            "index": idx,
            "start": parse_srt_time(start_s),
            "end": parse_srt_time(end_s),
            "text": " ".join(lines[text_lines_idx:])
        })
    return sorted(segs, key=lambda x: x["start"])

def save_srt(selected_groups, all_segments, out_path):
    with open(out_path, "w", encoding="utf-8") as f:
        cnt = 1
        for g in selected_groups:
            for idx in g["indices"]:
                seg = next(s for s in all_segments if s["index"] == idx)
                f.write(f"{cnt}\n")
                f.write(f"{seconds_to_srt_time(seg['start'])} --> {seconds_to_srt_time(seg['end'])}\n")
                f.write(seg['text'] + "\n\n")
                cnt += 1

def reindex_srt(input_srt, output_srt):
    segs = srt_to_segments(input_srt)
    if not segs:
        return
    with open(output_srt, "w", encoding="utf-8") as f:
        cur = 0.0
        for i, s in enumerate(segs, 1):
            dur = s["end"] - s["start"]
            start, end = cur, cur + dur
            f.write(f"{i}\n")
            f.write(f"{seconds_to_srt_time(start)} --> {seconds_to_srt_time(end)}\n")
            f.write(s["text"].strip() + "\n\n")
            cur = end

def group_adjacent_by_content(segments, sim_threshold, max_batch_duration, embed_model, device):
    if not segments:
        return []
    emb = embed_model.encode([s["text"] for s in segments], convert_to_tensor=True, device=device)
    groups, cur, cur_start = [], [segments[0]], segments[0]["start"]
    for i in range(1, len(segments)):
        duration_if_added = segments[i]["end"] - cur_start
        sim = util.cos_sim(
            embed_model.encode(" ".join([s["text"] for s in cur]), convert_to_tensor=True, device=device),
            emb[i]
        ).item()
        if (duration_if_added <= max_batch_duration * 1.1) and \
           ((cur[-1]["end"] - cur_start) < max_batch_duration * 0.1 or sim >= sim_threshold):
            cur.append(segments[i])
        else:
            groups.append(cur)
            cur, cur_start = [segments[i]], segments[i]["start"]
    if cur:
        groups.append(cur)
    return groups

def prefilter_groups(groups, topic_prompt, keep_top_k, embed_model, device):
    texts = [" ".join([s["text"] for s in g]) for g in groups]
    if not texts:
        return []
    group_embs = embed_model.encode(texts, convert_to_tensor=True, device=device)
    prompt_emb = embed_model.encode(topic_prompt, convert_to_tensor=True, device=device)
    sims = util.cos_sim(group_embs, prompt_emb).cpu().numpy().flatten()
    return [g for g, _ in sorted(list(zip(groups, sims)), key=lambda x: x[1], reverse=True)[:keep_top_k]]

def create_scoring_prompt_v2(group_texts, topic_config):
    numbered = "\n".join([
        f"[{i}] {text[:300]}..." if len(text) > 300 else f"[{i}] {text}"
        for i, text in enumerate(group_texts)
    ])
    include_str = ", ".join(topic_config['include'])
    exclude_str = ", ".join(topic_config['exclude'])
    return f"""You are evaluating video segments for educational highlights.
TOPIC: {topic_config['topic']}
PRIORITY: {include_str}
EXCLUDE: {exclude_str}
SCALE (0-10): 10=Critical, 8-9=High, 6-7=Moderate, 3-5=Low, 0-2=Exclude
SEGMENTS:\n{numbered}
Rate ALL segments [0] to [{len(group_texts)-1}]. Output one score per line:"""

def parse_scores_robust(response, expected_count):
    scores = []
    numbers = re.findall(r'(\d+(?:\.\d+)?)', response)
    for num_str in numbers:
        try:
            score = float(num_str)
            if 0 <= score <= 10:
                scores.append(score)
            if len(scores) >= expected_count:
                break
        except:
            continue
    while len(scores) < expected_count:
        scores.append(0.0)
    return scores[:expected_count]

def score_groups_batch_improved(groups, topic_config, llm, tokenizer, max_groups_per_call=20):
    group_texts = [" ".join(s["text"] for s in g) for g in groups]
    scores = []
    for i in range(0, len(group_texts), max_groups_per_call):
        part_texts = group_texts[i:i+max_groups_per_call]
        prompt = create_scoring_prompt_v2(part_texts, topic_config)
        try:
            inputs = tokenizer(prompt, return_tensors="pt", truncation=True).to(llm.device)
            out = llm.generate(**inputs, max_new_tokens=128, do_sample=False, pad_token_id=tokenizer.eos_token_id)
            decoded = tokenizer.decode(out[0], skip_special_tokens=True)
            scores.extend(parse_scores_robust(decoded, len(part_texts)))
        except:
            scores.extend([0.0] * len(part_texts))
    return scores

def pipeline_select_highlight(srt_path, topic_config, embed_model, llm, tokenizer, device):
    params = {
        "sim_threshold": 0.3,
        "max_batch_duration": 40.0,
        "keep_top_k_prefilter": 100,
        "max_groups_for_llm_call": 20,
        "max_total_duration": 180,
        "score_threshold": 5.0
    }
    
    segments = srt_to_segments(srt_path)
    if not segments:
        return [], []
    
    groups = group_adjacent_by_content(segments, params["sim_threshold"], params["max_batch_duration"], embed_model, device)
    groups_pref = prefilter_groups(groups, topic_config['topic'], params["keep_top_k_prefilter"], embed_model, device)
    llm_scores = score_groups_batch_improved(groups_pref, topic_config, llm, tokenizer, params["max_groups_for_llm_call"])
    
    results = []
    for g, sc in zip(groups_pref, llm_scores):
        results.append({
            "indices": [s["index"] for s in g],
            "start": g[0]["start"],
            "end": g[-1]["end"],
            "duration": g[-1]["end"] - g[0]["start"],
            "score_raw": sc
        })
    
    selected, total_duration = [], 0
    for r in sorted(results, key=lambda x: x["score_raw"], reverse=True):
        if r["score_raw"] >= params["score_threshold"] and total_duration + r["duration"] <= params["max_total_duration"]:
            selected.append(r)
            total_duration += r["duration"]
    
    return sorted(selected, key=lambda x: x["start"]), segments

def run_cmd(cmd, check=True, cwd=None):
    print(f"Running: {' '.join(cmd)}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=cwd)
    if res.returncode != 0:
        print(f"STDERR: {res.stderr}")
        if check:
            raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{res.stderr}")
    return res

def merge_segments_for_video(segments, gap_threshold=0.5):
    if not segments:
        return []
    merged = [segments[0].copy()]
    for seg in segments[1:]:
        if seg["end"] - seg["start"] <= 0 or seg["start"] - merged[-1]["end"] <= gap_threshold:
            merged[-1]["end"] = max(merged[-1]["end"], seg["end"])
        else:
            merged.append(seg.copy())
    return merged

def split_and_burn_ass(input_video, srt_file, output_video):
    temp_dir = f"/tmp/video_{uuid.uuid4()}"
    os.makedirs(temp_dir, exist_ok=True)
    
    input_video_abs = os.path.abspath(input_video)
    output_video_abs = os.path.abspath(output_video)
    
    segments = srt_to_segments(srt_file)
    video_segments = merge_segments_for_video(segments)
    
    part_files = []
    
    for i, seg_v in enumerate(video_segments):
        start, end = seg_v["start"], seg_v["end"]
        part_filename = f"part_{i}.mp4"
        part_filepath_abs = os.path.join(temp_dir, part_filename)
        part_files.append(part_filename)
        
        part_srt_path = os.path.join(temp_dir, f"part_{i}.srt")
        with open(part_srt_path, "w", encoding="utf-8") as f:
            subtitle_index = 1
            for seg_s in segments:
                if seg_s["start"] < end and seg_s["end"] > start:
                    f.write(f"{subtitle_index}\n")
                    f.write(f"{seconds_to_srt_time(seg_s['start'] - start)} --> {seconds_to_srt_time(seg_s['end'] - start)}\n")
                    f.write(f"{seg_s['text']}\n\n")
                    subtitle_index += 1
        
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(start),
            "-to", str(end),
            "-i", input_video_abs,
            "-vf", f"subtitles={os.path.basename(part_srt_path)}",
            "-c:v", "libx264", "-preset", "ultrafast",
            "-c:a", "aac",
            part_filepath_abs
        ]
        run_cmd(cmd, cwd=temp_dir)
    
    concat_txt_path = os.path.join(temp_dir, "concat.txt")
    with open(concat_txt_path, "w") as f:
        for pf in part_files:
            f.write(f"file '{pf}'\n")
    
    cmd_concat = [
        "ffmpeg", "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", "concat.txt",
        "-c", "copy",
        output_video_abs
    ]
    run_cmd(cmd_concat, check=False, cwd=temp_dir)
    
    shutil.rmtree(temp_dir)

def get_video_duration(path: str) -> float:
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"ffprobe failed: {res.stderr}")
    return float(res.stdout.strip())

def picture_in_picture(main_video, sub_video, output_video, position="bottom-right", margin_x=0, margin_y=0, scale=1, duration_tolerance=0.5):
    dur_main = get_video_duration(main_video)
    dur_sub = get_video_duration(sub_video)
    
    if abs(dur_main - dur_sub) > duration_tolerance:
        raise ValueError(f"Duration mismatch: {dur_main:.2f}s vs {dur_sub:.2f}s")
    
    position = position.lower()
    if position == "top-left":
        x_expr = str(margin_x)
        y_expr = str(margin_y)
    elif position == "top-right":
        x_expr = f"main_w-overlay_w-{margin_x}"
        y_expr = str(margin_y)
    elif position == "bottom-left":
        x_expr = str(margin_x)
        y_expr = f"main_h-overlay_h-{margin_y}"
    else:
        x_expr = f"main_w-overlay_w-{margin_x}"
        y_expr = f"main_h-overlay_h-{margin_y}"
    
    filter_complex = f"[1:v]scale=iw*{scale}:ih*{scale}[sub];[0:v][sub]overlay={x_expr}:{y_expr}:format=auto[vout]"
    
    cmd = [
        "ffmpeg", "-y",
        "-i", main_video,
        "-i", sub_video,
        "-filter_complex", filter_complex,
        "-map", "[vout]",
        "-map", "0:a?",
        "-c:v", "libx264", "-preset", "fast",
        "-c:a", "aac",
        output_video
    ]
    run_cmd(cmd)

def create_mascot_video(job_id, highlight_video_path, mascot_image_path, audio_path=None):
    if not os.path.exists(SADTALKER_REPO_PATH):
        raise RuntimeError("SadTalker not available")
    
    is_temp_audio = False
    if not audio_path:
        audio_path = f"/tmp/mascot_audio_{job_id}.wav"
        is_temp_audio = True
        
        try:
            run_cmd([
                "ffmpeg", "-y",
                "-i", highlight_video_path,
                "-vn",
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                audio_path
            ], check=True)
        except RuntimeError as e:
            if "No audio stream" in str(e):
                raise RuntimeError("Video has no audio stream")
            raise e
    
    if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
        raise RuntimeError("Failed to extract audio")
    
    mascot_output_dir = os.path.join(OUTPUT_DIR, job_id, "mascot")
    os.makedirs(mascot_output_dir, exist_ok=True)
    
    # Use Python wrapper that calls main() directly (avoids container SIGTERM issue)
    sadtalker_cmd = [
        "/opt/conda/envs/sadtalker/bin/python",
        "/opt/sadtalker/sadtalker_wrapper.py",
        "--driven_audio", os.path.abspath(audio_path),
        "--source_image", os.path.abspath(mascot_image_path),
        "--result_dir", os.path.abspath(mascot_output_dir),
        "--checkpoint_dir", f"{SADTALKER_REPO_PATH}/checkpoints",
        "--size", "256",
        "--preprocess", "full",
        "--still",
        "--verbose"  # Keep intermediate files for debugging
    ]
    
    log_file = f"/tmp/sadtalker_{job_id}.log"
    
    logger.info(f"🎭 Starting SadTalker for job {job_id}")
    logger.info(f"📂 Using wrapper: /opt/sadtalker/sadtalker_wrapper.py")
    logger.info(f"📄 Log file: {log_file}")
    
    log = open(log_file, 'w', buffering=1)  # Line buffered
    
    process = subprocess.Popen(
        sadtalker_cmd,
        stdout=log,
        stderr=subprocess.STDOUT
    )
    
    logger.info(f"🔢 SadTalker process started with PID: {process.pid}")
    
    try:
        # Wait for process with timeout
        logger.info(f"⏳ Waiting for SadTalker (timeout: 600s)...")
        start_time = time.time()
        
        while time.time() - start_time < 600:
            poll_result = process.poll()
            if poll_result is not None:
                logger.info(f"✅ Process finished with exit code: {poll_result}")
                break
            
            # Check log has content after 10s
            if time.time() - start_time > 10:
                log.flush()
                log_size = os.path.getsize(log_file) if os.path.exists(log_file) else 0
                if log_size == 0:
                    logger.warning(f"⚠️ Log still empty after 10s (size: {log_size})")
            
            time.sleep(2)
        else:
            logger.error(f"⏰ Timeout!")
            process.kill()
            log.close()
            raise Exception(f"SadTalker timeout. Check log: {log_file}")
        
        log.close()
        
        # Check result
        if process.returncode != 0:
            with open(log_file, 'r') as f:
                log_content = f.read()
            logger.error(f"❌ Failed with code {process.returncode}")
            logger.error(f"📋 Log:\n{log_content[-1000:]}")
            raise Exception(f"SadTalker failed ({process.returncode}). Log:\n{log_content[-500:]}")
        
        # Check log for errors
        with open(log_file, 'r') as f:
            log_content = f.read()
        
        if "Error" in log_content or "Exception" in log_content:
            logger.error(f"❌ Errors in log:\n{log_content[-1000:]}")
            raise Exception(f"SadTalker failed. Log:\n{log_content[-500:]}")
        
        # Find video - look for the largest MP4 (final output with video)
        logger.info(f"🔍 Looking for video in {mascot_output_dir}")
        video_files = glob.glob(os.path.join(mascot_output_dir, "**/*.mp4"), recursive=True)
        logger.info(f"📹 Found {len(video_files)} files: {video_files}")
        
        if not video_files:
            raise FileNotFoundError(f"No video generated. Log:\n{log_content[-1000:]}")
        
        # Get the largest video file (the one with actual video frames)
        mascot_video_path = max(video_files, key=lambda x: os.path.getsize(x))
        logger.info(f"✅ Selected largest video ({os.path.getsize(mascot_video_path)/1024/1024:.2f}MB): {mascot_video_path}")
        
        return mascot_video_path
        
    except Exception as e:
        if not log.closed:
            log.close()
        logger.error(f"💥 Error: {str(e)}")
        raise
    finally:
        logger.info(f"📄 Log at: {log_file}")

# --- BACKGROUND TASKS ---

def process_highlight_reel_in_background(job_id, video_path, topic_config):
    full_srt = f"/tmp/full_{job_id}.srt"
    srt_time = f"/tmp/srt_time_{job_id}.srt"
    selected_srt = f"/tmp/selected_{job_id}.srt"
    output_filename = f"highlight_{job_id}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    
    try:
        jobs[job_id]["status"] = "processing"
        
        # Stage 1: Transcribe
        jobs[job_id]["stage"] = "1/4: Transcribing"
        audio_path = f"/tmp/audio_{job_id}.wav"
        run_cmd(["ffmpeg", "-y", "-i", video_path, "-ar", "16000", "-ac", "1", "-vn", audio_path])
        
        segments_gen, _ = app.state.whisper.transcribe(audio_path, beam_size=5, vad_filter=True)
        
        with open(full_srt, "w", encoding="utf-8") as f:
            idx = 1
            for seg in segments_gen:
                f.write(f"{idx}\n")
                f.write(f"{seconds_to_srt_time(seg.start)} --> {seconds_to_srt_time(seg.end)}\n")
                f.write(f"{seg.text.strip()}\n\n")
                idx += 1
        
        # Stage 2: Select
        jobs[job_id]["stage"] = "2/4: AI Selection"
        selected_groups, all_segs = pipeline_select_highlight(
            full_srt, topic_config, app.state.embed_model, app.state.llm, app.state.tokenizer, app.state.device
        )
        
        if not selected_groups:
            raise ValueError("No highlights found")
        
        save_srt(selected_groups, all_segs, selected_srt)
        reindex_srt(selected_srt, srt_time)
        
        # Stage 3: Create video
        jobs[job_id]["stage"] = "3/4: Creating Video"
        split_and_burn_ass(video_path, selected_srt, output_path)
        
        # Done
        jobs[job_id]["stage"] = "4/4: Complete"
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = {
            "output_filename": output_filename,
            "download_url": f"/download/{job_id}"
        }
        
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["result"] = {"error": str(e)}
    finally:
        for p in [video_path, audio_path, full_srt, selected_srt]:
            if os.path.exists(p):
                os.remove(p)

def process_mascot_in_background(job_id, video_path, mascot_image_path, audio_path, position, margin_x, margin_y, scale):
    output_filename = f"highlight_mascot_{job_id}.mp4"
    output_path = os.path.join(OUTPUT_DIR, output_filename)
    mascot_video_filename = None
    mascot_video_path = None
    
    try:
        jobs[job_id]["status"] = "processing"
        
        # Stage 1: Create mascot
        jobs[job_id]["stage"] = "1/2: Creating Mascot"
        mascot_video_filename = create_mascot_video(job_id, video_path, mascot_image_path, audio_path)
        mascot_video_path = os.path.join(OUTPUT_DIR, mascot_video_filename)
        
        # Stage 2: Overlay or replace
        if position != 'replace':
            jobs[job_id]["stage"] = "2/2: Overlay"
            picture_in_picture(video_path, mascot_video_path, output_path, position, margin_x, margin_y, scale)
        
        # Done
        jobs[job_id]["status"] = "completed"
        if jobs[job_id].get("result") is None:
            jobs[job_id]["result"] = {}
        
        jobs[job_id]["result"]["download_url"] = f"/download/{job_id}"
        if position == 'replace':
            jobs[job_id]["result"]["output_filename"] = mascot_video_filename
        else:
            jobs[job_id]["result"]["output_filename"] = output_filename
        
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["result"] = {"error": str(e)}
    finally:
        temp_files = [video_path, audio_path, mascot_image_path]
        if position != 'replace' and mascot_video_path:
            temp_files.append(mascot_video_path)
        for p in temp_files:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except:
                    pass

# --- API ENDPOINTS ---

@app.post("/highlight-reel", status_code=202)
async def create_highlight_reel_job(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    topic: str = Form(...),
    include_keywords: str = Form(...),
    exclude_keywords: str = Form("")
):
    job_id = str(uuid.uuid4())
    
    temp_video = f"/tmp/video_{job_id}{os.path.splitext(video.filename)[1]}"
    with open(temp_video, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    if not os.path.exists(temp_video) or os.path.getsize(temp_video) == 0:
        raise HTTPException(status_code=400, detail="Invalid video")
    
    topic_config = {
        "topic": topic,
        "include": [k.strip() for k in include_keywords.split(",")],
        "exclude": [k.strip() for k in exclude_keywords.split(",")] if exclude_keywords else []
    }
    
    jobs[job_id] = {"status": "pending", "stage": "Queued", "result": None}
    
    background_tasks.add_task(process_highlight_reel_in_background, job_id, temp_video, topic_config)
    
    return {"job_id": job_id, "status": "pending"}

@app.post("/mascot", status_code=202)
async def create_mascot_reel_job(
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...),
    mascot_image: UploadFile = File(...),
    audio: UploadFile = File(None),
    position: str = Form(...),
    margin_x: int = Form(40),
    margin_y: int = Form(40),
    scale: float = Form(1)
):
    job_id = str(uuid.uuid4())
    
    if not os.path.exists(SADTALKER_REPO_PATH):
        raise HTTPException(status_code=503, detail="SadTalker unavailable")
    
    temp_video = f"/tmp/video_{job_id}{os.path.splitext(video.filename)[1]}"
    with open(temp_video, "wb") as buffer:
        shutil.copyfileobj(video.file, buffer)
    
    mascot_path = f"/tmp/mascot_{job_id}{os.path.splitext(mascot_image.filename)[1]}"
    with open(mascot_path, "wb") as buffer:
        shutil.copyfileobj(mascot_image.file, buffer)
    
    audio_path = None
    if audio and audio.filename:
        audio_content = await audio.read()
        if audio_content:
            audio_path = f"/tmp/audio_{job_id}{os.path.splitext(audio.filename)[1]}"
            with open(audio_path, "wb") as buffer:
                buffer.write(audio_content)
    
    jobs[job_id] = {"status": "pending", "stage": "Queued", "result": None}
    
    background_tasks.add_task(process_mascot_in_background, job_id, temp_video, mascot_path, audio_path, position, margin_x, margin_y, scale)
    
    return {"job_id": job_id, "status": "pending"}

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
        raise HTTPException(status_code=404, detail="Video not ready")
    
    file_path = os.path.join(OUTPUT_DIR, job["result"]["output_filename"])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(path=file_path, media_type='video/mp4', filename=job["result"]["output_filename"])

@app.get("/")
def home():
    return {
        "message": "AI Video Highlight Generator",
        "version": "2.0 VPS",
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "None",
        "endpoints": {
            "create_highlight": "POST /highlight-reel",
            "create_mascot": "POST /mascot",
            "status": "GET /jobs/status/{job_id}",
            "download": "GET /download/{job_id}"
        }
    }