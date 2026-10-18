#!/bin/bash
# Generate animated educational videos using z-ai video generation API.
cd /home/z/my-project
mkdir -p public/assets/video

gen_video() {
  local out="$1"
  local prompt="$2"
  if [ -f "$out" ] && [ $(stat -c%s "$out" 2>/dev/null||echo 0) -gt 100000 ]; then
    echo "[skip] $out"
    return
  fi
  echo "[video] $out..."
  # Generate video (polls until done)
  RESULT=$(z-ai video -p "$prompt" --poll --duration 5 --quality speed 2>&1)
  # Extract video URL
  URL=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('video_result',[{}])[0].get('url',''))" 2>/dev/null)
  if [ -z "$URL" ]; then
    echo "  [FAIL] no URL in response"
    return
  fi
  # Download
  curl -sL "$URL" -o "$out"
  if [ -f "$out" ] && [ $(stat -c%s "$out" 2>/dev/null) -gt 100000 ]; then
    echo "  [ok] $(stat -c%s "$out") bytes"
  else
    echo "  [FAIL] download too small"
  fi
  sleep 5
}

echo "=== Generating animated educational videos ==="

# Mission 1
gen_video public/assets/video/m1-scene1-anim.mp4 "Animated educational cartoon: A friendly round navy-blue robot mascot stands next to four cat photos. A turquoise scanning box appears over each cat, highlighting pointy ears, whiskers, and small nose. The photos flow into a computer brain that glows yellow. Flat vector style, navy blue turquoise yellow palette, no text."
gen_video public/assets/video/m1-scene2-anim.mp4 "Animated educational cartoon: Left side shows a calculator and kitchen timer with fixed step arrows. Right side shows a robot mascot training on animal photos that flow into a brain that glows. The two sides are compared with a versus symbol. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m1-scene3-anim.mp4 "Animated educational cartoon: A robot mascot holds up a yellow shield. Five items appear one by one with red X marks over them: a name tag, a house, a phone, a key, and a photo. Then a fictional rabbit character appears with a green checkmark. Flat vector, navy turquoise yellow, no text."

# Mission 2
gen_video public/assets/video/m2-scene1-anim.mp4 "Animated educational cartoon: Three building blocks labeled visually with icons: a task checkbox, a details magnifying glass, and a format grid. They stack together into a complete prompt with a star. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m2-scene2-anim.mp4 "Animated educational cartoon: Three colored blocks slide together to form a complete prompt. A robot mascot watches them connect. A lightbulb appears above. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m2-scene3-anim.mp4 "Animated educational cartoon: Two speech bubbles appear side by side. Left one is grey and vague. Right one is turquoise and detailed with a checkmark. A robot mascot points to the right one. Flat vector, navy turquoise yellow, no text."

# Mission 3
gen_video public/assets/video/m3-scene1-anim.mp4 "Animated educational cartoon: A robot mascot detective with a magnifying glass examines a claim card and an evidence card. A red X appears on the claim, a green check on the evidence. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m3-scene2-anim.mp4 "Animated educational cartoon: The Moon appears with four fact cards orbiting around it labeled A B C D. A robot mascot points at each fact. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m3-scene3-anim.mp4 "Animated educational cartoon: Four steps appear in sequence: a book for Read, a balance scale for Compare, a checkmark for Decide, and a pencil for Correct. A robot mascot walks along the steps. Flat vector, navy turquoise yellow, no text."

# Mission 4
gen_video public/assets/video/m4-scene1-anim.mp4 "Animated educational cartoon: Four planning cards appear in a 2x2 grid: a character icon, a setting icon, a problem icon, and a solution icon. A robot mascot points at each. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m4-scene2-anim.mp4 "Animated educational cartoon: A story draft on paper gets three red X marks. A robot mascot reviews it with a pencil. The problem areas are highlighted. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m4-scene3-anim.mp4 "Animated educational cartoon: A robot mascot holds a checklist with three options. A big green checkmark appears on the honest option. Flat vector, navy turquoise yellow, no text."

# Mission 5
gen_video public/assets/video/m5-scene1-anim.mp4 "Animated educational cartoon: A robot mascot stands on a stepping stone crossing a stream. On the other side is a glowing skill icon. The stepping stone path lights up. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m5-scene2-anim.mp4 "Animated educational cartoon: A blackboard shows 3x7=21 with a red X, then 3x8=24 with a green checkmark. A robot mascot points at each. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m5-scene3-anim.mp4 "Animated educational cartoon: A child reads in a school garden. A robot mascot holds a magnifying glass over the text. A goat is visible behind a gate. Flat vector, navy turquoise yellow, no text."

# Mission 6
gen_video public/assets/video/m6-scene1-anim.mp4 "Animated educational cartoon: A robot mascot holds two versions of a story: a rough grey draft and a polished turquoise final draft with a star. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m6-scene2-anim.mp4 "Animated educational cartoon: A checklist with five stars appears. Green checkmarks appear one by one. A robot mascot checks each item. Flat vector, navy turquoise yellow, no text."
gen_video public/assets/video/m6-scene3-anim.mp4 "Animated educational cartoon: A robot mascot presents a story portfolio with confetti and a badge. Stars and sparkles around it. Flat vector, navy turquoise yellow, no text."

echo "=== DONE: $(ls public/assets/video/*-anim.mp4 2>/dev/null | wc -l) animated videos ==="
