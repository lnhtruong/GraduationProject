#!/usr/bin/env python3
"""Direct JoyVASA CLI smoke test for the VPS API environment.

This file is kept only for manual testing. The FastAPI service in main.py loads
JoyVASA in-process and does not call this wrapper.
"""

import argparse
import os
import shutil
import sys
import uuid
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Run JoyVASA through deploy-model/main.py without subprocess inference")
    parser.add_argument("-r", "--ref_image_path", required=True, help="Reference mascot image")
    parser.add_argument("-a", "--audio_path", required=True, help="Driving audio")
    parser.add_argument("-o", "--output_path", required=True, help="Output mp4 path")
    parser.add_argument("--animation_mode", default="human", choices=["human", "animal"])
    parser.add_argument("--quality_mode", default="fast", choices=["ultrafast", "fast", "balanced", "quality"])
    parser.add_argument("--cfg_scale", type=float, default=None)
    parser.add_argument("--driving_multiplier", type=float, default=None)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent
    if str(repo_root) not in sys.path:
        sys.path.insert(0, str(repo_root))

    import main as api_main

    os.makedirs(api_main.OUTPUT_DIR, exist_ok=True)
    os.makedirs(api_main.TEMP_DIR, exist_ok=True)
    os.makedirs(api_main.BG_CACHE_DIR, exist_ok=True)
    api_main.app.state.joyvasa_pipelines = {}

    job_id = f"cli_{uuid.uuid4().hex[:12]}"
    raw_video = api_main.create_mascot_video(
        job_id=job_id,
        mascot_image_path=os.path.abspath(args.ref_image_path),
        audio_path=os.path.abspath(args.audio_path),
        animation_mode=args.animation_mode,
        quality_mode=args.quality_mode,
        cfg_scale=args.cfg_scale,
        driving_multiplier=args.driving_multiplier,
    )

    output_path = os.path.abspath(args.output_path)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    shutil.copy2(raw_video, output_path)
    print(f"Video generated: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
