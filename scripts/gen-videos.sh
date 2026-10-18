#!/bin/bash
# Generate MP4 videos from illustrations + audio using FFmpeg.
# Each video = one scene (image + audio = real .mp4 file).
cd /home/z/my-project
mkdir -p public/assets/video

gen_video() {
  local img="$1"
  local audio="$2"
  local out="$3"
  if [ -f "$out" ] && [ $(stat -c%s "$out" 2>/dev/null||echo 0) -gt 1000 ]; then
    echo "[skip] $out"
    return
  fi
  if [ ! -f "$img" ] || [ ! -f "$audio" ]; then
    echo "[skip] missing input for $out"
    return
  fi
  echo "[video] $out..."
  # Simple: image + audio = video. -tune stillimage for efficiency.
  ffmpeg -y -loop 1 -i "$img" -i "$audio" \
    -c:v libx264 -tune stillimage -c:a aac -b:a 128k -pix_fmt yuv420p -shortest \
    "$out" 2>/dev/null
  if [ -f "$out" ]; then
    echo "  [ok] $(stat -c%s "$out") bytes"
  else
    echo "  [FAIL]"
  fi
}

echo "=== Generating all lesson videos ==="
# Welcome
gen_video public/assets/illustrations/welcome-hero.png public/assets/audio/welcome-intro.wav public/assets/video/welcome-intro.mp4

# Mission 1
gen_video public/assets/illustrations/m1-scene1.png public/assets/audio/m1-scene1.wav public/assets/video/m1-scene1.mp4
gen_video public/assets/illustrations/m1-scene2.png public/assets/audio/m1-scene2.wav public/assets/video/m1-scene2.mp4
gen_video public/assets/illustrations/m1-scene3.png public/assets/audio/m1-scene3.wav public/assets/video/m1-scene3.mp4

# Mission 2
gen_video public/assets/illustrations/m2-scene1.png public/assets/audio/m2-scene1.wav public/assets/video/m2-scene1.mp4
gen_video public/assets/illustrations/m2-scene2.png public/assets/audio/m2-scene2.wav public/assets/video/m2-scene2.mp4
gen_video public/assets/illustrations/m2-scene3.png public/assets/audio/m2-scene3.wav public/assets/video/m2-scene3.mp4

# Mission 3
gen_video public/assets/illustrations/m3-scene1.png public/assets/audio/m3-scene1.wav public/assets/video/m3-scene1.mp4
gen_video public/assets/illustrations/m3-scene2.png public/assets/audio/m3-scene2.wav public/assets/video/m3-scene2.mp4
gen_video public/assets/illustrations/m3-scene3.png public/assets/audio/m3-scene3.wav public/assets/video/m3-scene3.mp4

# Mission 4
gen_video public/assets/illustrations/m4-scene1.png public/assets/audio/m4-scene1.wav public/assets/video/m4-scene1.mp4
gen_video public/assets/illustrations/m4-scene2.png public/assets/audio/m4-scene2.wav public/assets/video/m4-scene2.mp4
gen_video public/assets/illustrations/m4-scene3.png public/assets/audio/m4-scene3.wav public/assets/video/m4-scene3.mp4

# Mission 5
gen_video public/assets/illustrations/m5-scene1.png public/assets/audio/m5-scene1.wav public/assets/video/m5-scene1.mp4
gen_video public/assets/illustrations/m5-scene2.png public/assets/audio/m5-scene2.wav public/assets/video/m5-scene2.mp4
gen_video public/assets/illustrations/m5-scene3.png public/assets/audio/m5-scene3.wav public/assets/video/m5-scene3.mp4

# Mission 6
gen_video public/assets/illustrations/m6-scene1.png public/assets/audio/m6-scene1.wav public/assets/video/m6-scene1.mp4
gen_video public/assets/illustrations/m6-scene2.png public/assets/audio/m6-scene2.wav public/assets/video/m6-scene2.mp4
gen_video public/assets/illustrations/m6-scene3.png public/assets/audio/m6-scene3.wav public/assets/video/m6-scene3.mp4

echo ""
echo "=== DONE: $(ls public/assets/video/*.mp4 2>/dev/null | wc -l) videos ==="
