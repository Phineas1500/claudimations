#!/usr/bin/env bash
# Installs everything the pipeline needs that isn't checked in: node deps, python venv, fonts, TTS voice.
# Requires: node >= 18, python3 (with venv), ffmpeg, curl.
set -euo pipefail
cd "$(dirname "$0")/engine"

echo "==> node deps"
npm install --silent

echo "==> python venv"
python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt

echo "==> fonts (Google Fonts, OFL / Apache-2.0)"
mkdir -p fonts/variable
GF=https://github.com/google/fonts/raw/main
fetch() { [ -f "$2" ] || curl -sfL "$1" -o "$2"; }
fetch "$GF/ofl/montserrat/Montserrat%5Bwght%5D.ttf" "fonts/variable/Montserrat[wght].ttf"
fetch "$GF/ofl/nunito/Nunito%5Bwght%5D.ttf" "fonts/variable/Nunito[wght].ttf"
fetch "$GF/ofl/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" "fonts/variable/JetBrainsMono[wght].ttf"
fetch "$GF/ofl/bangers/Bangers-Regular.ttf" fonts/Bangers-Regular.ttf
fetch "$GF/ofl/patrickhand/PatrickHand-Regular.ttf" fonts/PatrickHand-Regular.ttf
fetch "$GF/apache/luckiestguy/LuckiestGuy-Regular.ttf" fonts/LuckiestGuy-Regular.ttf
fetch "$GF/ofl/notocoloremoji/NotoColorEmoji-Regular.ttf" fonts/NotoColorEmoji.ttf
# the canvas backend only sees a variable font's default instance, so bake static weights
for spec in Montserrat:900:Black Montserrat:800:ExtraBold Montserrat:600:SemiBold \
            Nunito:900:Black Nunito:800:ExtraBold Nunito:700:Bold Nunito:500:Medium \
            JetBrainsMono:500:Medium JetBrainsMono:800:ExtraBold; do
  IFS=: read -r fam w name <<< "$spec"
  out="fonts/$fam-$name.ttf"
  [ -f "$out" ] || .venv/bin/fonttools varLib.instancer -q "fonts/variable/$fam[wght].ttf" "wght=$w" -o "$out"
done

echo "==> narration voice (Piper, LJSpeech: public-domain dataset)"
mkdir -p voices
HF=https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/high
fetch "$HF/en_US-ljspeech-high.onnx" voices/en_US-ljspeech-high.onnx
fetch "$HF/en_US-ljspeech-high.onnx.json" voices/en_US-ljspeech-high.onnx.json

echo "done. try: cd videos/01-limewire && ../../engine/.venv/bin/python build_voice.py"
