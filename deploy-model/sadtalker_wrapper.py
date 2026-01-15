#!/usr/bin/env python
"""
SadTalker wrapper - calls main() directly instead of running inference.py as a script
This avoids the container's SIGTERM issue with script execution.
"""
import sys
import os

# Set up paths - MUST be absolute and correct
SADTALKER_DIR = '/opt/sadtalker/SadTalker'

# Verify directory exists
if not os.path.exists(SADTALKER_DIR):
    raise RuntimeError(f"SadTalker directory not found: {SADTALKER_DIR}")

# Verify critical files exist
config_file = os.path.join(SADTALKER_DIR, 'src/config/similarity_Lm3D_all.mat')
if not os.path.exists(config_file):
    raise RuntimeError(f"Config file not found: {config_file}")

sys.path.insert(0, SADTALKER_DIR)
os.chdir(SADTALKER_DIR)

print(f"Working directory: {os.getcwd()}")
print(f"Python path: {sys.path[0]}")

# Import dependencies
import torch
from argparse import ArgumentParser
from inference import main

# Create argument parser (copied from inference.py)
parser = ArgumentParser()  
parser.add_argument("--driven_audio", default='./examples/driven_audio/bus_chinese.wav')
parser.add_argument("--source_image", default='./examples/source_image/full_body_1.png')
parser.add_argument("--ref_eyeblink", default=None)
parser.add_argument("--ref_pose", default=None)
parser.add_argument("--checkpoint_dir", default='./checkpoints')
parser.add_argument("--result_dir", default='./results')
parser.add_argument("--pose_style", type=int, default=0)
parser.add_argument("--batch_size", type=int, default=2)
parser.add_argument("--size", type=int, default=256)
parser.add_argument("--expression_scale", type=float, default=1.0)
parser.add_argument('--input_yaw', nargs='+', type=int, default=None)
parser.add_argument('--input_pitch', nargs='+', type=int, default=None)
parser.add_argument('--input_roll', nargs='+', type=int, default=None)
parser.add_argument('--enhancer', type=str, default=None)
parser.add_argument('--background_enhancer', type=str, default=None)
parser.add_argument("--cpu", dest="cpu", action="store_true")
parser.add_argument("--face3dvis", action="store_true")
parser.add_argument("--still", action="store_true")
parser.add_argument("--preprocess", default='crop', choices=['crop', 'extcrop', 'resize', 'full', 'extfull'])
parser.add_argument("--verbose", action="store_true")
parser.add_argument("--old_version", action="store_true")
parser.add_argument('--net_recon', type=str, default='resnet50', choices=['resnet18', 'resnet34', 'resnet50'])
parser.add_argument('--init_path', type=str, default=None)
parser.add_argument('--use_last_fc', default=False)
parser.add_argument('--bfm_folder', type=str, default='./checkpoints/BFM_Fitting/')
parser.add_argument('--bfm_model', type=str, default='BFM_model_front.mat')
parser.add_argument('--focal', type=float, default=1015.)
parser.add_argument('--center', type=float, default=112.)
parser.add_argument('--camera_d', type=float, default=10.)
parser.add_argument('--z_near', type=float, default=5.)
parser.add_argument('--z_far', type=float, default=15.)

args = parser.parse_args()

# Set device
if torch.cuda.is_available() and not args.cpu:
    args.device = "cuda"
else:
    args.device = "cpu"

# Call main function
main(args)
