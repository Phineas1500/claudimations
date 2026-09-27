"""Tiny numpy/scipy synth + sfx kit. Everything here is generated from math, no samples.

Conventions: mono signals are float32 numpy arrays at SR; the Mix bus is stereo.
"""
import numpy as np
from scipy import signal as sps

SR = 48000
rng = np.random.default_rng(7)


def secs(n):
    return int(round(n * SR))


def t_axis(dur):
    return np.arange(secs(dur)) / SR


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def n2m(name):
    """'A3' -> 57, 'C#4' -> 61"""
    p, o = (name[:2], name[2:]) if len(name) > 2 and name[1] in '#b' else (name[:1], name[1:])
    return NOTE[p] + 12 * (int(o) + 1)


# ---------------------------------------------------------------- oscillators
def phase_from_freq(freq, n):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return 2 * np.pi * np.cumsum(f) / SR


def sine(freq, dur, phase0=0.0):
    n = secs(dur)
    return np.sin(phase_from_freq(freq, n) + phase0).astype(np.float32)


def saw(freq, dur, harmonics=None):
    """band-limited-ish saw via additive synthesis (fine for short musical notes)"""
    n = secs(dur)
    ph = phase_from_freq(freq, n)
    f0 = float(np.max(freq)) if np.ndim(freq) else float(freq)
    k_max = harmonics or max(1, int((SR / 2.2) / max(f0, 20)))
    k_max = min(k_max, 60)
    out = np.zeros(n)
    for k in range(1, k_max + 1):
        out += np.sin(k * ph) / k
    return (out * (2 / np.pi)).astype(np.float32)


def square(freq, dur, harmonics=None):
    n = secs(dur)
    ph = phase_from_freq(freq, n)
    f0 = float(np.max(freq)) if np.ndim(freq) else float(freq)
    k_max = harmonics or max(1, int((SR / 2.2) / max(f0, 20)))
    out = np.zeros(n)
    for k in range(1, min(k_max, 61) + 1, 2):
        out += np.sin(k * ph) / k
    return (out * (4 / np.pi)).astype(np.float32)


def noise(dur):
    return rng.uniform(-1, 1, secs(dur)).astype(np.float32)


# ---------------------------------------------------------------- envelopes
def env_exp(dur, decay, attack=0.002):
    t = t_axis(dur)
    e = np.exp(-t / max(decay, 1e-4))
    a = secs(attack)
    if a > 0:
        e[:a] *= np.linspace(0, 1, a)
    return e.astype(np.float32)


def env_adsr(dur, a=0.01, d=0.1, s=0.7, r=0.1):
    n = secs(dur)
    e = np.full(n, s, np.float32)
    na, nd, nr = secs(a), secs(d), secs(r)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd)
    nr = min(nr, n)
    if nr > 0:
        e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def fade(x, fin=0.003, fout=0.01):
    x = x.copy()
    a, b = min(secs(fin), len(x)), min(secs(fout), len(x))
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


# ---------------------------------------------------------------- filters / fx
def _biquad(kind, f0, q=0.707, gain_db=0.0):
    w0 = 2 * np.pi * min(f0, SR * 0.49) / SR
    alpha = np.sin(w0) / (2 * q)
    c = np.cos(w0)
    if kind == 'lp':
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]; a = [1 + alpha, -2 * c, 1 - alpha]
    elif kind == 'hp':
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]; a = [1 + alpha, -2 * c, 1 - alpha]
    elif kind == 'bp':
        b = [alpha, 0, -alpha]; a = [1 + alpha, -2 * c, 1 - alpha]
    elif kind == 'peak':
        A = 10 ** (gain_db / 40)
        b = [1 + alpha * A, -2 * c, 1 - alpha * A]; a = [1 + alpha / A, -2 * c, 1 - alpha / A]
    else:
        raise ValueError(kind)
    return np.array(b) / a[0], np.array(a) / a[0]


def lp(x, f, q=0.707):
    b, a = _biquad('lp', f, q); return sps.lfilter(b, a, x).astype(np.float32)


def hp(x, f, q=0.707):
    b, a = _biquad('hp', f, q); return sps.lfilter(b, a, x).astype(np.float32)


def bp(x, f, q=1.0):
    b, a = _biquad('bp', f, q); return sps.lfilter(b, a, x).astype(np.float32)


def peak(x, f, gain_db, q=1.0):
    b, a = _biquad('peak', f, q, gain_db); return sps.lfilter(b, a, x).astype(np.float32)


def sweep_filter(x, kind, f_start, f_end, q=0.9, block=256):
    """time-varying biquad (block-wise), exponential cutoff sweep"""
    out = np.zeros_like(x)
    nblocks = int(np.ceil(len(x) / block))
    zi = np.zeros(2)
    for i in range(nblocks):
        frac = i / max(1, nblocks - 1)
        f = f_start * (f_end / f_start) ** frac
        b, a = _biquad(kind, f, q)
        seg = x[i * block:(i + 1) * block]
        y, zi = sps.lfilter(b, a, seg, zi=zi)
        out[i * block:(i + 1) * block] = y
    return out


def drive(x, amount=2.0):
    return (np.tanh(x * amount) / np.tanh(amount)).astype(np.float32)


def crush(x, bits=6, down=4):
    y = np.round(x * 2 ** (bits - 1)) / 2 ** (bits - 1)
    y = np.repeat(y[::down], down)[:len(x)]
    return y.astype(np.float32)


def delay(x, time, fb=0.35, mix=0.3, taps=5):
    d = secs(time)
    out = np.concatenate([x, np.zeros(d * taps, np.float32)])
    g = mix
    for k in range(1, taps + 1):
        out[k * d:k * d + len(x)] += x * g
        g *= fb
    return out


_IR_CACHE = {}


def reverb(x, size=1.6, damp=4000, mix=0.25, predelay=0.012):
    """convolution with a synthetic exponentially-decaying noise IR"""
    key = (size, damp)
    if key not in _IR_CACHE:
        n = secs(size)
        ir = rng.standard_normal(n).astype(np.float32) * np.exp(-np.arange(n) / (SR * size / 6.9))
        ir = lp(ir, damp)
        ir[:secs(predelay)] = 0
        _IR_CACHE[key] = ir / np.sqrt(np.sum(ir ** 2))
    wet = sps.fftconvolve(x, _IR_CACHE[key])[:len(x) + secs(size)].astype(np.float32)
    out = np.concatenate([x, np.zeros(len(wet) - len(x), np.float32)])
    return out * (1 - mix * 0.5) + wet * mix


def tape_stop(x, dur=0.6):
    """slow a signal down to a halt (reads progressively slower through the buffer)"""
    n = secs(dur)
    speed = np.linspace(1, 0, n) ** 1.3
    pos = np.cumsum(speed)
    pos = pos[pos < len(x) - 1]
    i = pos.astype(int)
    frac = pos - i
    return (x[i] * (1 - frac) + x[i + 1] * frac).astype(np.float32)


def resample(x, sr_in, sr_out=SR):
    from math import gcd
    g = gcd(sr_in, sr_out)
    return sps.resample_poly(x, sr_out // g, sr_in // g).astype(np.float32)


# ---------------------------------------------------------------- mix bus
class Mix:
    def __init__(self, dur):
        self.buf = np.zeros((2, secs(dur) + SR * 4), np.float32)

    def add(self, x, at, gain=1.0, pan=0.0):
        """x mono (n,) or stereo (2, n); pan -1..1 (equal power)"""
        start = secs(at)
        if start < 0:
            x = x[..., -start:]; start = 0
        if x.ndim == 1:
            th = (pan + 1) * np.pi / 4
            x = np.stack([x * np.cos(th), x * np.sin(th)]) * np.sqrt(2)
        n = min(x.shape[1], self.buf.shape[1] - start)
        if n > 0:
            self.buf[:, start:start + n] += x[:, :n] * gain
        return self

    def trim(self, dur):
        return self.buf[:, :secs(dur)]


def duck_envelope(voice, dur, depth_db=-10, attack=0.03, release=0.25):
    """gain curve that dips wherever the narration is talking"""
    n = secs(dur)
    v = np.zeros(n, np.float32)
    v[:min(n, len(voice))] = np.abs(voice[:n])
    win = secs(0.02)
    lvl = np.convolve(v, np.ones(win) / win, mode='same')
    talking = (lvl > 0.02).astype(np.float32)
    # smooth with separate attack / release one-pole
    g = np.empty(n, np.float32)
    ca, cr = np.exp(-1 / (SR * attack)), np.exp(-1 / (SR * release))
    y = 0.0
    step = 64  # compute at block rate for speed
    for i in range(0, n, step):
        tgt = talking[i]
        c = ca if tgt > y else cr
        y = tgt + (y - tgt) * c ** step
        g[i:i + step] = y
    lo = 10 ** (depth_db / 20)
    return 1 - g * (1 - lo)


def master(stereo, target_peak=0.95, drive_amt=1.4):
    x = stereo / max(1e-6, np.abs(stereo).max())
    x = np.tanh(x * drive_amt) / np.tanh(drive_amt)
    return (x / np.abs(x).max() * target_peak).astype(np.float32)


def write_wav(path, stereo):
    import wave
    x = np.clip(stereo, -1, 1)
    inter = (x.T * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(inter.tobytes())


# ================================================================ instruments
def kick(dur=0.45, f_hi=160, f_lo=45, punch=0.03, click=0.6):
    t = t_axis(dur)
    f = f_lo + (f_hi - f_lo) * np.exp(-t / punch)
    body = np.sin(phase_from_freq(f, len(t))) * np.exp(-t / (dur * 0.35))
    c = noise(0.004) * click
    body[:len(c)] += c
    return drive(body.astype(np.float32), 1.6)


def snare(dur=0.22, tone=190, tone_mix=0.45):
    t = t_axis(dur)
    n = hp(noise(dur), 1200) * np.exp(-t / 0.06)
    b = np.sin(phase_from_freq(tone * (1 + 0.5 * np.exp(-t / 0.01)), len(t))) * np.exp(-t / 0.05)
    return (n * (1 - tone_mix) + b * tone_mix).astype(np.float32)


def clap(dur=0.25):
    out = np.zeros(secs(dur), np.float32)
    for k, off in enumerate([0, 0.011, 0.022, 0.031]):
        seg = bp(noise(dur - off), 1400, 1.2) * env_exp(dur - off, 0.012 if k < 3 else 0.09, 0.0005)
        out[secs(off):] += seg[:len(out) - secs(off)]
    return out * 1.6


def hat(dur=0.05, open_=False):
    d = 0.25 if open_ else dur
    return (hp(noise(d), 7000) * env_exp(d, 0.08 if open_ else 0.018, 0.0005)).astype(np.float32)


def shaker(dur=0.09):
    return (bp(noise(dur), 6500, 0.8) * env_adsr(dur, 0.02, 0.03, 0.3, 0.04)).astype(np.float32)


def bass808(freq, dur, glide_from=None, glide_t=0.06, dist=2.5):
    t = t_axis(dur)
    f = np.full(len(t), freq, float)
    if glide_from:
        f = freq + (glide_from - freq) * np.exp(-t / glide_t)
    x = np.sin(phase_from_freq(f, len(t)))
    x = drive(x.astype(np.float32), dist) * env_adsr(dur, 0.003, 0.2, 0.75, 0.08)
    return lp(x, 900)


def cowbell(freq, dur=0.22):
    """phonk-style pitched cowbell: two detuned squares through a bandpass, snappy decay"""
    x = square(freq, dur, 9) * 0.6 + square(freq * 1.48, dur, 7) * 0.4
    x = bp(x, freq * 1.9, 1.3) * 2.2 + x * 0.25
    return (x * env_exp(dur, 0.075, 0.001)).astype(np.float32)


def fm_epiano(freq, dur, bright=1.0):
    t = t_axis(dur)
    mod = np.sin(2 * np.pi * freq * 14 * t) * np.exp(-t / 0.05) * 1.2 * bright
    mod2 = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.6) * 0.9 * bright
    x = np.sin(2 * np.pi * freq * t + mod + mod2)
    x += 0.25 * np.sin(2 * np.pi * freq * 2 * t) * np.exp(-t / 0.3)
    return (x * env_adsr(dur, 0.004, 0.5, 0.5, 0.15) * np.exp(-t / 2.0)).astype(np.float32)


def pluck(freq, dur=0.5, bright=0.5, decay=0.996):
    """Karplus-Strong via an IIR comb (fast)"""
    n = secs(dur)
    N = max(2, int(SR / freq))
    burst = lp(noise(N / SR + 0.001)[:N], 1500 + 8000 * bright)
    x = np.zeros(n, np.float32)
    x[:N] = burst
    a = np.zeros(N + 2); a[0] = 1; a[N] = -decay * 0.5; a[N + 1] = -decay * 0.5
    y = sps.lfilter([1.0], a, x).astype(np.float32)
    return fade(y * 0.8, 0.0005, 0.02)


def pizz(freq, dur=0.25):
    """short pizzicato string"""
    return (pluck(freq, dur, bright=0.35, decay=0.985) * env_exp(dur, 0.12, 0.0015) * 1.6).astype(np.float32)


def music_box(freq, dur=1.6):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.9)
    x += 0.35 * np.sin(2 * np.pi * freq * 3.01 * t) * np.exp(-t / 0.25)
    x += 0.18 * np.sin(2 * np.pi * freq * 5.43 * t) * np.exp(-t / 0.1)
    x += 0.1 * np.sin(2 * np.pi * freq * 8.9 * t) * np.exp(-t / 0.04)
    return fade((x * env_exp(dur, 10, 0.001)).astype(np.float32), 0.001, 0.05)


def brass(freq, dur, vib=0.0):
    t = t_axis(dur)
    f = freq * (1 + vib * 0.012 * np.sin(2 * np.pi * 5.5 * t) * np.clip(t / 0.3, 0, 1))
    x = saw(f, dur, 30)
    e = env_adsr(dur, 0.03, 0.1, 0.8, 0.06)
    # brighten with the envelope, like a real brass swell
    lo = lp(x, freq * 2.5); hi = lp(x, freq * 7)
    return ((lo * (1 - e * 0.6) + hi * e * 0.6) * e).astype(np.float32)


def pad(freqs, dur, bright=1800):
    x = np.zeros(secs(dur), np.float32)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):
            x += saw(f * 2 ** (det / 12), dur, 12) * 0.25
    x = lp(x, bright)
    return (x * env_adsr(dur, 0.35, 0.3, 0.8, 0.6) / len(freqs)).astype(np.float32)


# ================================================================ sfx
def sfx_ding(f1=1318.5, f2=1760.0):
    """two-note notification ping"""
    a = sine(f1, 0.5) * env_exp(0.5, 0.18)
    b = sine(f2, 0.7) * env_exp(0.7, 0.25)
    out = np.zeros(secs(0.8), np.float32)
    out[:len(a)] += a * 0.6
    out[secs(0.09):secs(0.09) + len(b)] += b * 0.6
    return reverb(out, 0.8, 6000, 0.2)


def sfx_vine_boom():
    t = t_axis(1.6)
    f = 55 + 70 * np.exp(-t / 0.05)
    x = np.sin(phase_from_freq(f, len(t))) * np.exp(-t / 0.5)
    x = drive(x.astype(np.float32), 3.5)
    x += lp(noise(1.6), 300) * np.exp(-t / 0.08) * 0.8
    x = lp(x, 2200)
    return reverb(x, 1.2, 1500, 0.35)


def sfx_record_scratch():
    dur = 0.55
    t = t_axis(dur)
    # back-and-forth "scrub": noisy tone whose pitch follows a wobble
    speed = np.sin(2 * np.pi * 3.2 * t) * np.exp(-t / 0.4)
    f = 700 + 900 * speed
    tone = saw(np.abs(f) + 60, dur, 18) * 0.5
    n = bp(noise(dur), 1800, 0.7)
    x = (tone + n) * np.abs(speed) ** 0.6
    return fade(hp(x, 250) * 1.4, 0.002, 0.05)


def sfx_whoosh(dur=0.45, up=True):
    x = noise(dur)
    x = sweep_filter(x, 'bp', 400 if up else 5000, 5000 if up else 400, 1.2)
    t = t_axis(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    return (x * e * 2.5).astype(np.float32)


def sfx_riser(dur=1.0):
    t = t_axis(dur)
    x = sweep_filter(noise(dur), 'bp', 300, 9000, 2.0) * 1.8
    x += saw(200 * 2 ** (t / dur * 2.5), dur, 20) * 0.15
    return (x * (t / dur) ** 2).astype(np.float32)


def sfx_impact():
    t = t_axis(1.2)
    x = sfx_vine_boom()[:len(t)] * 0.7
    x += lp(noise(1.2), 2500) * np.exp(-t / 0.15) * 0.8
    return x


def sfx_pop(f=900):
    t = t_axis(0.09)
    x = np.sin(phase_from_freq(f * (1 + 2.5 * np.exp(-t / 0.012)), len(t))) * np.exp(-t / 0.03)
    return x.astype(np.float32)


def sfx_click():
    t = t_axis(0.03)
    return (bp(noise(0.03), 3500, 2) * np.exp(-t / 0.004) * 1.5).astype(np.float32)


def sfx_error_bloop(base=440):
    """retro OS error chord blip (not any particular OS's sound)"""
    out = np.zeros(secs(0.45), np.float32)
    for k, (m, d) in enumerate([(0, 0), (7, 0.0), (12, 0.07)]):
        f = base * 2 ** (m / 12)
        s = (square(f, 0.35, 7) * 0.3 + sine(f, 0.35)) * env_exp(0.35, 0.09)
        out[secs(d):secs(d) + len(s)] += s * 0.4
    return lp(out, 3500)


def sfx_glitch(dur=0.5):
    out = np.zeros(secs(dur), np.float32)
    pos = 0
    while pos < len(out):
        L = int(rng.integers(secs(0.012), secs(0.06)))
        kind = rng.integers(0, 3)
        if kind == 0:
            seg = square(rng.uniform(80, 2000), L / SR, 9) * 0.5
        elif kind == 1:
            seg = crush(noise(L / SR), 3, 8)
        else:
            seg = np.zeros(L, np.float32)
        seg = seg[:len(out) - pos]
        out[pos:pos + len(seg)] = seg
        pos += L
    return out


def sfx_crt_off():
    t = t_axis(0.5)
    x = sine(2000 * np.exp(-t / 0.08) + 60, 0.5) * np.exp(-t / 0.2) * 0.5
    x[:secs(0.01)] += noise(0.01) * 0.8
    return x.astype(np.float32)


def sfx_dialup(dur=1.9):
    """impressionistic 56k handshake: dial tones, answer tone, then screechy data bursts"""
    out = np.zeros(secs(dur), np.float32)
    # DTMF-ish dialing (5 digits)
    rows, cols = [697, 770, 852, 941], [1209, 1336, 1477]
    p = 0.0
    for _ in range(5):
        a, b = rng.choice(rows), rng.choice(cols)
        s = (sine(a, 0.07) + sine(b, 0.07)) * 0.3
        out[secs(p):secs(p) + len(s)] += fade(s, 0.003, 0.003)
        p += 0.095
    # answer tone
    s = sine(2100, 0.35) * 0.35
    out[secs(p):secs(p) + len(s)] += fade(s, 0.01, 0.02)
    p += 0.38
    # screech: FM chirps + noise bursts
    rem = dur - p
    t = t_axis(rem)
    car = np.sin(2 * np.pi * 1800 * t + 6 * np.sin(2 * np.pi * 47 * t) + 3 * np.sin(2 * np.pi * 1200 * t))
    burst = bp(noise(rem), 2400, 0.8) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * t)))
    s = (car * 0.25 + burst * 0.35) * np.clip((rem - t) / 0.1, 0, 1)
    out[secs(p):secs(p) + len(s)] += s[:len(out) - secs(p)]
    return crush(out, 8, 2)


def sfx_crickets(dur=3.0):
    out = np.zeros(secs(dur), np.float32)
    t0 = 0.0
    while t0 < dur - 0.3:
        L = 0.16
        tt = t_axis(L)
        chirp = np.sin(2 * np.pi * 4300 * tt) * (0.5 + 0.5 * np.sin(2 * np.pi * 55 * tt)) * np.sin(np.pi * tt / L)
        out[secs(t0):secs(t0) + len(chirp)] += chirp.astype(np.float32) * 0.25
        t0 += 0.5 + rng.uniform(-0.05, 0.05)
    return reverb(out, 1.5, 7000, 0.3)


def sfx_tick(high=True):
    t = t_axis(0.05)
    f = 2600 if high else 1900
    return (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) + bp(noise(0.05), 5000, 3) * np.exp(-t / 0.003)).astype(np.float32) * 0.8


def sfx_alarm(cycles=2):
    out = []
    for _ in range(cycles):
        out.append(square(960, 0.22, 9) * 0.35)
        out.append(square(770, 0.22, 9) * 0.35)
    return lp(np.concatenate(out), 3000)


def sfx_boing():
    t = t_axis(0.6)
    f = 180 + 260 * (1 + np.sin(2 * np.pi * 11 * t) * np.exp(-t / 0.18)) * np.exp(-t / 0.9)
    return (sine(f, 0.6) * np.exp(-t / 0.3) * 0.9).astype(np.float32)


def sfx_success(root=72):
    out = np.zeros(secs(1.1), np.float32)
    for k, m in enumerate([0, 4, 7, 12]):
        s = music_box(midi_hz(root + m), 0.8) * 0.5 + sine(midi_hz(root + m), 0.8) * env_exp(0.8, 0.2) * 0.3
        out[secs(k * 0.07):secs(k * 0.07) + len(s)] += s
    return reverb(out, 1.0, 7000, 0.25)


def sfx_chatter(dur=0.6):
    """rapid digital ticks (decrypting / counting)"""
    out = np.zeros(secs(dur), np.float32)
    p = 0.0
    while p < dur - 0.03:
        s = sine(rng.uniform(1500, 3500), 0.02) * env_exp(0.02, 0.005) * 0.4
        out[secs(p):secs(p) + len(s)] += s
        p += rng.uniform(0.025, 0.045)
    return out


def sfx_typing(dur=1.2):
    out = np.zeros(secs(dur), np.float32)
    p = 0.0
    while p < dur - 0.05:
        s = bp(noise(0.035), rng.uniform(2500, 4500), 2.5) * env_exp(0.035, 0.006) * rng.uniform(0.6, 1.1)
        out[secs(p):secs(p) + len(s)] += s * 1.4
        p += rng.uniform(0.05, 0.11)
    return out


def sfx_sad_trombone():
    notes = [(n2m('G3'), 0.32), (n2m('F#3'), 0.32), (n2m('F3'), 0.32), (n2m('E3'), 1.1)]
    out = []
    for i, (m, d) in enumerate(notes):
        out.append(brass(midi_hz(m), d, vib=1.0 if i == 3 else 0.2) * 0.8)
    x = np.concatenate(out)
    return reverb(lp(x, 2200), 0.9, 3000, 0.15)


def sfx_cash():
    x = np.zeros(secs(0.9), np.float32)
    for k, f in enumerate([2093, 2637, 3136]):
        s = music_box(f, 0.6) * 0.4
        x[secs(0.05 * k):secs(0.05 * k) + len(s)] += s
    return reverb(x, 0.8, 8000, 0.2)


def sfx_heartbeat():
    out = np.zeros(secs(0.9), np.float32)
    for off, g in [(0, 1.0), (0.22, 0.7)]:
        k = kick(0.3, 90, 40, 0.02, 0.0) * g
        out[secs(off):secs(off) + len(k)] += lp(k, 400)
    return out


# ================================================================ additions for video 02
def lfo_filter(x, kind, cutoff_fn, q=0.9, block=128):
    """time-varying biquad; cutoff_fn(t_seconds_array) -> Hz, evaluated per block"""
    out = np.zeros_like(x)
    zi = np.zeros(2)
    for i in range(0, len(x), block):
        f = float(cutoff_fn(np.array([i / SR]))[0])
        b, a = _biquad(kind, max(30.0, f), q)
        y, zi = sps.lfilter(b, a, x[i:i + block], zi=zi)
        out[i:i + block] = y
    return out


def glock(freq, dur=1.2):
    t = t_axis(dur)
    x = np.sin(2 * np.pi * freq * t) * np.exp(-t / 0.55)
    x += 0.45 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t / 0.18)
    x += 0.25 * np.sin(2 * np.pi * freq * 5.40 * t) * np.exp(-t / 0.07)
    x += 0.15 * np.sin(2 * np.pi * freq * 8.93 * t) * np.exp(-t / 0.03)
    return fade(x.astype(np.float32), 0.0005, 0.05)


def strum(freqs, dur=0.6, spread=0.018, bright=0.7, down=True):
    fs = freqs if down else freqs[::-1]
    out = np.zeros(secs(dur + spread * len(fs)), np.float32)
    for k, f in enumerate(fs):
        p = pluck(f, dur, bright, 0.993) * env_exp(dur, 0.35)
        out[secs(k * spread):secs(k * spread) + len(p)] += p * 0.5
    return out


def kazoo(freq, dur, bend=0.0):
    t = t_axis(dur)
    f = freq * (1 + bend * t / dur) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t))
    x = saw(f, dur, 40) + 0.3 * noise(dur) * 0.2
    x = bp(x, 900, 2.5) * 1.5 + bp(x, 2600, 3) * 0.8 + lp(x, 500) * 0.3
    return drive((x * env_adsr(dur, 0.02, 0.05, 0.9, 0.05)).astype(np.float32), 2.0)


def sfx_buzzer(dur=0.7):
    """game-show wrong answer"""
    x = square(98, dur, 25) * 0.5 + square(104, dur, 25) * 0.5 + saw(147, dur, 20) * 0.3
    x = lp(drive(x, 2.5), 2200)
    return (x * env_adsr(dur, 0.005, 0.05, 0.9, 0.05)).astype(np.float32)


def sfx_spit():
    t = t_axis(0.45)
    pt = sine(300 * np.exp(-t / 0.05) + 120, 0.45) * np.exp(-t / 0.04) * 0.6  # "pt"
    wh = bp(noise(0.45), 2500, 1.2) * np.exp(-((t - 0.06) / 0.05) ** 2) * 1.2   # "fff"
    splat = lp(noise(0.45), 900) * np.exp(-np.clip(t - 0.3, 0, None) / 0.05) * (t > 0.3) * 1.8
    return (pt + wh + splat).astype(np.float32)


def sfx_hiss(dur=1.6):
    t = t_axis(dur)
    x = hp(noise(dur), 3000) * np.clip(t / 0.2, 0, 1) * np.clip((dur - t) / 0.2, 0, 1) * 0.6
    creak = sine(90 + 25 * np.sin(2 * np.pi * 1.3 * t), dur)
    creak = bp(np.sign(creak) * np.abs(creak) ** 0.3, 700, 4) * 0.25 * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))
    return (x + creak).astype(np.float32)


def sfx_crunch(dur=0.9):
    t = t_axis(dur)
    out = kick(0.8, 90, 32, 0.03, 1.0) * 1.2
    out = np.concatenate([out, np.zeros(len(t) - len(out), np.float32)])[:len(t)]
    p = 0.0
    while p < dur * 0.7:
        L = rng.uniform(0.004, 0.02)
        s = bp(noise(L), rng.uniform(800, 5000), 1.5) * rng.uniform(0.4, 1.0) * np.exp(-p / 0.25)
        out[secs(p):secs(p) + len(s)] += s
        p += rng.uniform(0.006, 0.03)
    return reverb(out, 0.9, 3000, 0.25)


def sfx_rewind(dur=0.8):
    t = t_axis(dur)
    f = 300 * 2 ** (t / dur * 3)
    x = saw(f, dur, 12) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 22 * t))) * 0.35
    x += bp(noise(dur), 3000, 0.7) * 0.25
    return lp(crush(x.astype(np.float32), 7, 3), 5000)


def wobble(freq, dur, rate_hz, depth=(120, 2400)):
    x = saw(freq, dur, 50) * 0.6 + saw(freq * 1.01, dur, 50) * 0.4 + square(freq / 2, dur, 20) * 0.3
    lo, hi = depth
    fn = lambda tt: lo + (hi - lo) * (0.5 - 0.5 * np.cos(2 * np.pi * rate_hz * tt))
    y = lfo_filter(x, 'lp', fn, 4.0)
    y = drive(y, 3.0)
    sub = sine(freq, dur) * 0.6
    return ((y * 0.8 + sub) * env_adsr(dur, 0.005, 0.05, 1.0, 0.02)).astype(np.float32)


def crackle(dur):
    out = hp(noise(dur), 4000) * 0.02
    n = int(dur * 25)
    for _ in range(n):
        p = rng.uniform(0, dur - 0.01)
        s = hp(noise(0.004), 1500) * rng.uniform(0.2, 0.8)
        out[secs(p):secs(p) + len(s)] += s
    return out.astype(np.float32)


def sfx_sparkle_gliss(root=84, n=9, step=0.035):
    scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]
    out = np.zeros(secs(n * step + 1.3), np.float32)
    for k in range(n):
        g = glock(midi_hz(root + scale[k % len(scale)]), 1.0) * (0.35 + 0.05 * k)
        out[secs(k * step):secs(k * step) + len(g)] += g
    return reverb(out, 1.4, 8000, 0.35)


def timpani(freq=65, dur=1.4):
    t = t_axis(dur)
    x = np.sin(phase_from_freq(freq * (1 + 0.05 * np.exp(-t / 0.05)), len(t))) * np.exp(-t / 0.5)
    x += 0.4 * np.sin(phase_from_freq(freq * 1.5, len(t))) * np.exp(-t / 0.3)
    x += lp(noise(dur), 400) * np.exp(-t / 0.03) * 0.6
    return reverb(x.astype(np.float32), 1.6, 2000, 0.3)


def sfx_stamp():
    return (kick(0.3, 180, 60, 0.015, 1.0) * 0.8 + np.concatenate([lp(noise(0.08), 3000) * env_exp(0.08, 0.02), np.zeros(secs(0.22), np.float32)])[:secs(0.3)] * 0.8).astype(np.float32)
