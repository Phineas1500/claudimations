"""Step 1: synthesize narration -> build/narration.wav + build/timeline.json"""
import json, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, '..', '..', 'engine')
sys.path.insert(0, os.path.join(ENGINE, 'py'))
from tts import Narrator, SR, DEFAULT_VOICE  # noqa: E402
from script import LINES, LEAD_IN  # noqa: E402

os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
narr = Narrator(os.path.join(ENGINE, 'voices', DEFAULT_VOICE + '.onnx'), length_scale=0.74)
audio, timeline = narr.build(LINES, lead_in=LEAD_IN)
audio = audio / max(1e-6, np.abs(audio).max()) * 0.9

with wave.open(os.path.join(HERE, 'build', 'narration.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((audio * 32767).astype(np.int16).tobytes())

duration = len(audio) / SR
json.dump({'duration': round(duration, 3), 'lines': timeline}, open(os.path.join(HERE, 'build', 'timeline.json'), 'w'), indent=1)
for l in timeline:
    print(f"{l['start']:6.2f}-{l['end']:6.2f}  {l['scene']:9s} {' '.join(w['shown'] for w in l['words'])}")
print('total', round(duration, 2), 's')
