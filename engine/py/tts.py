"""Narration builder: Piper TTS -> one mono track + word-level timeline.

Piper doesn't expose alignments for stock voices, so each line is split at punctuation
into segments that are synthesized separately (exact segment boundaries), and word
timings inside a segment are estimated from phoneme counts.
"""
import re
import numpy as np
from piper import PiperVoice, SynthesisConfig

SR = 22050
# Public-domain training data (LJSpeech). Avoid voices whose datasets are research-only (e.g. lessac).
DEFAULT_VOICE = 'en_US-ljspeech-high'
_EMOJI = re.compile(r'^[^\w\s\'".,!?-]+$')


def is_emoji(tok):
    return isinstance(tok, str) and bool(_EMOJI.match(tok))


def _trim(a, thresh=0.01, pad=0.02):
    idx = np.where(np.abs(a) > thresh)[0]
    if len(idx) == 0:
        return a[:0]
    p = int(pad * SR)
    return a[max(0, idx[0] - p):idx[-1] + p]


class Narrator:
    def __init__(self, model_path, length_scale=0.84, noise_scale=0.6, noise_w_scale=0.7):
        self.voice = PiperVoice.load(model_path)
        self.cfg = SynthesisConfig(length_scale=length_scale, noise_scale=noise_scale, noise_w_scale=noise_w_scale)

    def say(self, text):
        chunks = list(self.voice.synthesize(text, self.cfg))
        return _trim(np.concatenate([c.audio_float_array for c in chunks]).astype(np.float32))

    def phoneme_weight(self, word):
        ph = self.voice.phonemize(word)
        n = sum(len(s) for s in ph)
        return max(n, 1)

    def build(self, lines, lead_in=0.3, comma_gap=0.12, stop_gap=0.2):
        """lines: [(id, scene, tokens, pause_after)] -> (audio, timeline dict)"""
        out, t = [np.zeros(int(lead_in * SR), np.float32)], lead_in
        timeline = []
        for lid, scene, tokens, pause in lines:
            words = []  # dicts: shown, spoken, emoji
            for tok in tokens:
                if is_emoji(tok):
                    words.append({'shown': tok, 'spoken': None, 'emoji': True})
                elif isinstance(tok, tuple):
                    words.append({'shown': tok[0], 'spoken': tok[1], 'emoji': False})
                else:
                    words.append({'shown': tok, 'spoken': tok.lower(), 'emoji': False})
            # split into segments at punctuation (, . ! ?) that is not line-final
            segs, cur = [], []
            spoken_idx = [i for i, w in enumerate(words) if not w['emoji']]
            for i in spoken_idx:
                cur.append(i)
                if re.search(r'[,.!?]$', words[i]['spoken']) and i != spoken_idx[-1]:
                    segs.append(cur); cur = []
            if cur:
                segs.append(cur)
            line_start = t
            for si, seg in enumerate(segs):
                text = ' '.join(words[i]['spoken'] for i in seg)
                a = self.say(text)
                dur = len(a) / SR
                weights = np.array([self.phoneme_weight(re.sub(r'[^\w\s\']', '', words[i]['spoken']) or 'a') for i in seg], float)
                edges = np.concatenate([[0], np.cumsum(weights) / weights.sum()]) * dur
                for k, i in enumerate(seg):
                    words[i]['start'] = round(t + edges[k], 3)
                    words[i]['end'] = round(t + edges[k + 1], 3)
                out.append(a); t += dur
                if si < len(segs) - 1:
                    gap = stop_gap if words[seg[-1]]['spoken'].endswith(('.', '!', '?')) else comma_gap
                    out.append(np.zeros(int(gap * SR), np.float32)); t += gap
            line_end = t
            # emoji pop in right after the preceding word ends
            for i, w in enumerate(words):
                if w['emoji']:
                    prev = next((words[j] for j in range(i - 1, -1, -1) if not words[j]['emoji']), None)
                    w['start'] = prev['end'] if prev else line_start
                    w['end'] = line_end
            timeline.append({'id': lid, 'scene': scene, 'start': round(line_start, 3), 'end': round(line_end, 3),
                             'words': [{k: w[k] for k in ('shown', 'emoji', 'start', 'end')} for w in words]})
            out.append(np.zeros(int(pause * SR), np.float32)); t += pause
        return np.concatenate(out), timeline
