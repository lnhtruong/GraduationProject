import os
import subprocess
import requests
from pathlib import Path

# =========================
# CONFIG
# =========================
LIBRARY_ID = "660578"
API_KEY = "4ef4bfb1-fcb1-4d49-93fbdb33ae94-b6d1-461d"

YOUTUBE_URL = "https://www.youtube.com/watch?v=Dz3zBspjqWo"
VIDEO_TITLE = "Phân Từ| TOEIC Grammar - Lesson 5: Participles"

TEMP_DIR = Path("temp_videos")
TEMP_DIR.mkdir(exist_ok=True)

# =========================
# STEP 1: DOWNLOAD YOUTUBE VIDEO
# =========================
print("\n[1/5] Downloading video from YouTube...")

output_template = str(TEMP_DIR / "%(title)s.%(ext)s")

download_cmd = [
    "python",
    "-m",
    "yt_dlp",
    "-f",
    "mp4",
    "-o",
    output_template,
    YOUTUBE_URL
]

result = subprocess.run(download_cmd, capture_output=True, text=True)

if result.returncode != 0:
    print("❌ Download failed:")
    print(result.stderr)
    exit()

print("✅ Download completed.")

# Find downloaded file
downloaded_files = list(TEMP_DIR.glob("*"))
if not downloaded_files:
    print("❌ No downloaded file found.")
    exit()

video_file = downloaded_files[0]
print(f"📁 Downloaded file: {video_file}")
print(f"📦 File size: {video_file.stat().st_size / (1024 * 1024):.2f} MB")


# =========================
# STEP 2: CREATE VIDEO OBJECT ON BUNNY
# =========================
print("\n[2/5] Creating Bunny video entry...")

create_url = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos"

headers = {
    "AccessKey": API_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json"
}

create_response = requests.post(
    create_url,
    headers=headers,
    json={"title": VIDEO_TITLE}
)

if create_response.status_code not in [200, 201]:
    print("❌ Failed to create Bunny video object:")
    print(create_response.text)
    exit()

video_id = create_response.json()["guid"]

print("✅ Bunny video created successfully.")
print(f"🎥 Video ID: {video_id}")


# =========================
# STEP 3: UPLOAD VIDEO FILE
# =========================
print("\n[3/5] Uploading video to Bunny...")

upload_url = f"https://video.bunnycdn.com/library/{LIBRARY_ID}/videos/{video_id}"

upload_headers = {
    "AccessKey": API_KEY,
    "Content-Type": "application/octet-stream"
}

with open(video_file, "rb") as f:
    upload_response = requests.put(
        upload_url,
        headers=upload_headers,
        data=f
    )

if upload_response.status_code not in [200, 201]:
    print("❌ Upload failed:")
    print(upload_response.text)
    exit()

print("✅ Upload completed successfully.")
print(f"🌍 Bunny Video URL ID: {video_id}")


# =========================
# STEP 4: DELETE LOCAL FILE
# =========================
print("\n[4/5] Deleting local temp file...")

try:
    os.remove(video_file)
    print("✅ Local file deleted.")
except Exception as e:
    print(f"⚠️ Failed to delete temp file: {e}")


# =========================
# STEP 5: DONE
# =========================
print("\n[5/5] Process completed successfully.")
print("====================================")
print(f"Title: {VIDEO_TITLE}")
print(f"YouTube Source: {YOUTUBE_URL}")
print(f"Bunny Video ID: {video_id}")
print("====================================")