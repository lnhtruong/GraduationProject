#!/usr/bin/env python
"""
JoyVASA Wrapper for API integration
Handles both human and animal portrait animation
"""

import os
import sys
import subprocess
import argparse
import shutil
from pathlib import Path

# JoyVASA paths
JOYVASA_PATH = Path("/opt/joyvasa/JoyVASA")
CONDA_ENV = "/opt/conda/envs/joyvasa/bin/python"

def main(args):
    """Main function to run JoyVASA inference via subprocess"""
    
    # Ensure output directory exists
    output_dir = Path(args.output_path).parent
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Build command - JoyVASA uses tyro arguments
    cmd = [
        CONDA_ENV,
        str(JOYVASA_PATH / "inference.py"),
        "--reference", args.ref_image_path,
        "--audio", args.audio_path,
        "--output-dir", str(output_dir),
        "--animation-mode", args.animation_mode,
    ]
    
    print(f"🎬 Generating {args.animation_mode} animation...")
    print(f"   Image: {args.ref_image_path}")
    print(f"   Audio: {args.audio_path}")
    print(f"   Output dir: {output_dir}")
    
    # Run inference
    result = subprocess.run(
        cmd,
        cwd=str(JOYVASA_PATH),
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"❌ Error: JoyVASA inference failed with code {result.returncode}")
        print(f"STDERR: {result.stderr}")
        sys.exit(result.returncode)
    
    # JoyVASA generates output in output_dir, find the latest video
    video_files = sorted(output_dir.glob("*.mp4"), key=os.path.getmtime)
    if video_files:
        latest_video = video_files[-1]
        # Move to desired output path if different
        if str(latest_video) != args.output_path:
            shutil.move(str(latest_video), args.output_path)
        print(f"✓ Video generated: {args.output_path}")
        return args.output_path
    else:
        print(f"⚠️  Warning: No output video found in {output_dir}")
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JoyVASA Wrapper")
    parser.add_argument('-r', '--ref_image_path', type=str, required=True,
                        help='Path to reference image')
    parser.add_argument('-a', '--audio_path', type=str, required=True,
                        help='Path to audio file')
    parser.add_argument('-v', '--ref_video_path', type=str, default=None,
                        help='Path to reference video (optional)')
    parser.add_argument('--animation_mode', type=str, default='human',
                        choices=['human', 'animal'],
                        help='Animation mode: human or animal')
    parser.add_argument('-o', '--output_path', type=str, default='output.mp4',
                        help='Path to output video')
    parser.add_argument('--inference_cfg_rate', type=float, default=2.5,
                        help='CFG rate for inference')
    parser.add_argument('--inference_steps', type=int, default=25,
                        help='Number of inference steps')
    parser.add_argument('--device', type=str, default='cuda',
                        help='Device to use (cuda/cpu)')
    parser.add_argument('--seed', type=int, default=42,
                        help='Random seed')
    
    args = parser.parse_args()
    
    # Run inference
    output_path = main(args)
    sys.exit(0)
