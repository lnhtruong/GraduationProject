#!/bin/bash

set -e

echo "📥 Downloading SadTalker Models"
echo "================================="

cd /opt/sadtalker/SadTalker

# Remove Git LFS pointers if any
rm -f checkpoints/SadTalker_V0.0.2_*.safetensors 2>/dev/null || true

# Create directories
mkdir -p checkpoints gfpgan/weights

# Base URLs
SADTALKER_URL="https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc"
FACEXLIB_URL="https://github.com/xinntao/facexlib/releases/download"
GFPGAN_URL="https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0"

echo ""
echo "📦 Downloading SadTalker checkpoints..."

# Download with wget (more reliable than aria2c for GitHub)
download_file() {
    local url=$1
    local output=$2
    local desc=$3
    
    if [ -f "$output" ] && [ -s "$output" ]; then
        echo "✓ $desc already exists ($(du -h "$output" | cut -f1))"
        return 0
    fi
    
    echo "⬇️  Downloading $desc..."
    if wget -q --show-progress -c -O "$output" "$url"; then
        echo "✓ $desc downloaded ($(du -h "$output" | cut -f1))"
    else
        echo "✗ Failed to download $desc"
        rm -f "$output"
        return 1
    fi
}

# SadTalker models
download_file "$SADTALKER_URL/mapping_00109-model.pth.tar" \
    "checkpoints/mapping_00109-model.pth.tar" \
    "mapping_00109-model.pth.tar"

download_file "$SADTALKER_URL/mapping_00229-model.pth.tar" \
    "checkpoints/mapping_00229-model.pth.tar" \
    "mapping_00229-model.pth.tar"

download_file "$SADTALKER_URL/SadTalker_V0.0.2_256.safetensors" \
    "checkpoints/SadTalker_V0.0.2_256.safetensors" \
    "SadTalker_V0.0.2_256.safetensors (~1.2GB)"

download_file "$SADTALKER_URL/SadTalker_V0.0.2_512.safetensors" \
    "checkpoints/SadTalker_V0.0.2_512.safetensors" \
    "SadTalker_V0.0.2_512.safetensors (~2.3GB)"

echo ""
echo "📦 Downloading GFPGAN models..."

download_file "$FACEXLIB_URL/v0.1.0/alignment_WFLW_4HG.pth" \
    "gfpgan/weights/alignment_WFLW_4HG.pth" \
    "alignment_WFLW_4HG.pth"

download_file "$FACEXLIB_URL/v0.1.0/detection_Resnet50_Final.pth" \
    "gfpgan/weights/detection_Resnet50_Final.pth" \
    "detection_Resnet50_Final.pth"

download_file "$GFPGAN_URL/GFPGANv1.4.pth" \
    "gfpgan/weights/GFPGANv1.4.pth" \
    "GFPGANv1.4.pth"

download_file "$FACEXLIB_URL/v0.2.2/parsing_parsenet.pth" \
    "gfpgan/weights/parsing_parsenet.pth" \
    "parsing_parsenet.pth"

echo ""
echo "================================="
echo "✅ All models downloaded!"
echo ""
echo "📊 Storage usage:"
du -sh checkpoints gfpgan/weights

echo ""
echo "📋 Files:"
ls -lh checkpoints/*.{pth,safetensors,tar} 2>/dev/null || true
ls -lh gfpgan/weights/*.pth 2>/dev/null || true
