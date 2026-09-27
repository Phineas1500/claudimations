"""Quick audio forensics for the reference videos: zoomed spectrograms + tempo estimate."""
import sys, wave
import numpy as np
from PIL import Image

def load(path):
    with wave.open(path) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, sr

def spec_png(x, sr, t0, t1, out, fmax=6000, n=2048, hop=128, h=600):
    seg = x[int(t0 * sr):int(t1 * sr)]
    win = np.hanning(n)
    frames = np.lib.stride_tricks.sliding_window_view(seg, n)[::hop] * win
    S = np.abs(np.fft.rfft(frames, axis=1))
    freqs = np.fft.rfftfreq(n, 1 / sr)
    S = S[:, freqs <= fmax]
    db = 20 * np.log10(S + 1e-6)
    db = np.clip((db - db.max() + 80) / 80, 0, 1)
    img = (db.T[::-1] * 255).astype(np.uint8)
    im = Image.fromarray(img).resize((1600, h))
    # colorize (inferno-ish)
    a = np.asarray(im).astype(np.float32) / 255
    rgb = np.stack([np.clip(a * 1.6, 0, 1), np.clip(a * 1.4 - 0.4, 0, 1), np.clip(0.3 + a * 0.2 - np.clip(a * 1.8 - 0.9, 0, 1) * 0.5, 0, 1) * (1 - a) + np.clip(a * 2 - 1.2, 0, 1)], -1)
    Image.fromarray((rgb * 255).astype(np.uint8)).save(out)

def tempo(x, sr):
    n, hop = 1024, 256
    frames = np.lib.stride_tricks.sliding_window_view(x, n)[::hop] * np.hanning(n)
    S = np.abs(np.fft.rfft(frames, axis=1))
    flux = np.maximum(np.diff(np.log1p(S * 100), axis=0), 0).sum(1)
    flux -= flux.mean()
    ac = np.correlate(flux, flux, 'full')[len(flux) - 1:]
    fps = sr / hop
    lags = np.arange(len(ac)) / fps
    ok = (lags > 60 / 200) & (lags < 60 / 60)
    best = lags[ok][np.argmax(ac[ok])]
    return 60 / best, flux, fps

for name in sys.argv[1:]:
    x, sr = load(f'{name}.wav')
    bpm, flux, fps = tempo(x, sr)
    rms = np.sqrt(np.mean(x ** 2))
    print(f'{name}: dur={len(x)/sr:.2f}s  tempo~{bpm:.1f} bpm  rms={20*np.log10(rms):.1f} dBFS  peak={20*np.log10(np.abs(x).max()):.1f} dBFS')
    spec_png(x, sr, 0, 6, f'{name}_spec_0-6.png')
    spec_png(x, sr, 20, 26, f'{name}_spec_20-26.png')
