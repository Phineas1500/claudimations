"""Step 2: music + sfx arrangement against the narration timeline.
Writes build/audio.wav (48k stereo, mastered) and build/cues.json (sync points for visuals)."""
import json, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'engine', 'py'))
from synth import *  # noqa: E402,F401

TL = json.load(open(os.path.join(HERE, 'build', 'timeline.json')))
LINES = {l['id']: l for l in TL['lines']}
DUR = TL['duration']


def W(line, word):
    """word timing by index or by shown text (first match, case-insensitive prefix)"""
    ws = LINES[line]['words']
    if isinstance(word, int):
        return ws[word]
    for w in ws:
        if w['shown'].upper().startswith(word.upper()):
            return w
    raise KeyError(f'{line}:{word}')


def load_narration():
    with wave.open(os.path.join(HERE, 'build', 'narration.wav')) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return resample(x, sr)


voice = load_narration()
music = Mix(DUR)
sfx = Mix(DUR)
cues = {'beats': {}, 'events': []}


def ev(name, t, **kw):
    cues['events'].append({'name': name, 't': round(float(t), 3), **kw})


# ------------------------------------------------------------------ phonk (hook + heist)
PHONK_BPM = 130
STEP = 60 / PHONK_BPM / 4
KICKS = [0, 3, 6, 10]
CLAPS = [4, 12]
COW = {0: 'F#5', 2: 'F#5', 3: 'A5', 5: 'F#5', 6: 'C#6', 8: 'B5', 10: 'A5', 11: 'F#5', 13: 'E5', 14: 'F#5'}
COW_B = {0: 'F#5', 2: 'F#5', 3: 'A5', 5: 'C#6', 6: 'E6', 8: 'D6', 10: 'C#6', 11: 'A5', 13: 'B5', 14: 'C#6'}
BASS = {0: 'F#1', 3: 'F#1', 6: 'A1', 10: 'E1'}


def phonk(bus, start, end, gain=1.0, full=True):
    """lay down the funk loop from start to end (seconds); returns beat times"""
    beats, bar = [], 0
    t = start
    while t < end - 1e-3:
        for s in range(16):
            ts = t + s * STEP
            if ts >= end:
                break
            if s % 4 == 0:
                beats.append(round(ts, 3))
            if s in KICKS:
                bus.add(kick(0.4, 150, 48), ts, 0.9 * gain)
                if s in BASS and full:
                    nxt = min([k for k in KICKS if k > s] + [16])
                    bus.add(bass808(midi_hz(n2m(BASS[s])), (nxt - s) * STEP + 0.05, glide_from=midi_hz(n2m(BASS[s]) + 12) if s == 0 else None), ts, 0.55 * gain)
            if s in CLAPS:
                bus.add(clap(), ts, 0.55 * gain, 0.05)
            if s % 2 == 0 or (full and s in (13, 15)):
                bus.add(hat(), ts, 0.22 * gain, 0.25 if s % 4 else -0.2)
            mel = COW_B if (bar % 2 and full) else COW
            if s in mel:
                bus.add(cowbell(midi_hz(n2m(mel[s]) - 12), 0.2), ts, 0.33 * gain, -0.1)
        t += 16 * STEP
        bar += 1
    return beats


# hook: phonk from 0 until the record scratch on "2026"
scratch_t = W('year', '2026')['start'] - 0.06
hook_bus = Mix(DUR)
cues['beats']['hook'] = phonk(hook_bus, 0.0, scratch_t, 0.9)
music.add(hook_bus.trim(DUR), 0)
sfx.add(sfx_ding(), 0.02, 0.55)
ev('ding', 0.02)
boom_t = W('hook', 'LIMEWIRE')['start']
sfx.add(sfx_vine_boom(), boom_t - 0.02, 0.8)
ev('boom', boom_t)
sfx.add(sfx_record_scratch(), scratch_t, 0.75)
ev('scratch', scratch_t)
skull_t = W('year', '💀')['start']
sfx.add(sfx_impact(), skull_t, 0.6)
ev('skull', skull_t)

# ------------------------------------------------------------------ dial-up + Y2K flashback
dial_t = LINES['year']['end'] + 0.08
sfx.add(sfx_dialup(1.6), dial_t, 0.33)
ev('dialup', dial_t)
xp_start = LINES['virus']['start'] - 0.1
xp_end = LINES['virus']['end'] + 0.12
BPM_XP = 104
beat_xp = 60 / BPM_XP
chords = [['F3', 'A3', 'C4', 'E4'], ['E3', 'G3', 'B3', 'D4'], ['D3', 'F3', 'A3', 'C4', 'E4'], ['C3', 'E3', 'G3', 'B3', 'D4']]
xp_bus = Mix(DUR)
t, k = xp_start, 0
cues['beats']['xp'] = []
while t < xp_end:
    ch = chords[k % 4]
    for i, nname in enumerate(ch):
        xp_bus.add(fm_epiano(midi_hz(n2m(nname)), beat_xp * 2 + 0.3, 0.8), t + i * 0.012, 0.16, (i - 2) * 0.15)
    xp_bus.add(bass808(midi_hz(n2m(ch[0]) - 12), beat_xp * 2, dist=1.2), t, 0.35)
    for b in range(2):
        tb = t + b * beat_xp
        cues['beats']['xp'].append(round(tb, 3))
        xp_bus.add(kick(0.3, 120, 50, 0.02, 0.2), tb, 0.45 if b == 0 else 0.3)
        for e in range(2):
            xp_bus.add(shaker(), tb + e * beat_xp / 2 + beat_xp / 4, 0.25, 0.3)
        # sparkly pluck arp (Frutiger-aero shimmer)
        for a in range(4):
            m = n2m(ch[(a + b) % len(ch)]) + 24
            xp_bus.add(pluck(midi_hz(m), 0.4, 0.9, 0.994), tb + a * beat_xp / 4, 0.12, 0.5 - a * 0.3)
    t += beat_xp * 2
    k += 1
xp_mix = xp_bus.trim(DUR)
cut = secs(xp_end)
xp_mix[:, cut:] = 0
xp_mix[:, cut - secs(0.05):cut] *= np.linspace(1, 0, secs(0.05))
music.add(reverb(xp_mix[0], 1.2, 5000, 0.2), 0, 1.0, -0.15)
music.add(reverb(xp_mix[1], 1.2, 5000, 0.2), 0, 1.0, 0.15)

# virus popups: one per word from "A FAMILY" on, plus a flurry at the end
vw = LINES['virus']['words']
fam_i = next(i for i, w in enumerate(vw) if w['shown'] == 'FAMILY') - 1
popup_times = [w['start'] for w in vw[fam_i:]]
end_w = vw[-1]
popup_times += list(np.linspace(end_w['start'] + 0.1, end_w['end'], 8))
for i, pt in enumerate(sorted(popup_times)):
    sfx.add(sfx_error_bloop(392 * 2 ** (min(i, 12) / 12)), pt, 0.22, float(np.sin(i * 2.1)) * 0.6)
    ev('popup', pt, i=i)
glitch_t = LINES['virus']['end'] + 0.02
sfx.add(sfx_glitch(0.3), glitch_t, 0.35)
sfx.add(sfx_crt_off(), glitch_t + 0.28, 0.5)
ev('crash', glitch_t)
ev('crt_off', glitch_t + 0.28)

# ------------------------------------------------------------------ sneaky pizzicato (site + disguise)
BPM_SN = 116
q = 60 / BPM_SN
SN_BASS = ['A2', 'C3', 'E3', 'C3', 'A2', 'C3', 'D#3', 'E3', 'F2', 'A2', 'C3', 'A2', 'E2', 'G#2', 'B2', 'E3']
SN_MEL = {0: 'A4', 1.5: 'C5', 2: 'B4', 2.5: 'A4', 3.5: 'G#4', 4: 'A4', 5.5: 'E4', 6: 'F4', 6.5: 'F#4', 7: 'G4', 7.5: 'G#4',
          8: 'A4', 9.5: 'C5', 10: 'E5', 11: 'D#5', 11.5: 'E5', 12: 'B4', 13.5: 'G#4', 14: 'E4', 15: 'G#4'}


def sneaky(bus, start, end, gain=1.0):
    beats = []
    t0 = start
    while t0 < end - 1e-3:
        for i in range(16):
            tb = t0 + i * q
            if tb >= end:
                break
            beats.append(round(tb, 3))
            bus.add(pizz(midi_hz(n2m(SN_BASS[i])), 0.3), tb, 0.8 * gain, -0.15)
            if i % 2 == 1:
                bus.add(clap(0.12) * 0.5, tb, 0.25 * gain, 0.2)
                bus.add(hat(0.04), tb, 0.25 * gain, 0.2)
        for off, nn in SN_MEL.items():
            tb = t0 + off * q
            if tb < end:
                bus.add(pizz(midi_hz(n2m(nn)), 0.22), tb, 0.55 * gain, 0.25)
        t0 += 16 * q
    return beats


site_start = LINES['encrypted']['start'] - 0.12
site_end = LINES['noinfo']['start'] - 0.05
sn_bus = Mix(DUR)
cues['beats']['site'] = sneaky(sn_bus, site_start, site_end)
m = sn_bus.trim(DUR)
m[:, secs(site_end):] = 0
music.add(reverb(m[0], 0.9, 4000, 0.12), 0, 1.0, -0.1)
music.add(reverb(m[1], 0.9, 4000, 0.12), 0, 1.0, 0.1)

# "LIKE THIS 😭": gibberish sting
cry_t = W('encrypted', '😭')['start']
sfx.add(sfx_chatter(0.5), W('encrypted', 'NAMED')['start'], 0.35)
bw = np.concatenate([brass(midi_hz(n2m('D#3')), 0.18), brass(midi_hz(n2m('D3')), 0.45, vib=1.0)])
sfx.add(lp(bw, 1500), cry_t - 0.05, 0.4)
ev('gibberish', W('encrypted', 'NAMED')['start'])
ev('cry', cry_t)

# pop-up modal slam
slam_t = W('popup', 'POP-UP')['start']
sfx.add(sfx_whoosh(0.3, up=False), slam_t - 0.28, 0.45)
sfx.add(sfx_impact(), slam_t, 0.55)
ev('modal', slam_t)
# deadpan: music out, a single pop as the mascot steps in
dead_t = LINES['noinfo']['start'] - 0.05
sfx.add(sfx_pop(700), dead_t, 0.6)
ev('deadpan', dead_t)

# ------------------------------------------------------------------ waiting: clicks, crickets, clock
cl1 = W('waiting', 'CLICKED')['start'] + 0.12
cl2 = W('waiting', 'DOWNLOAD')['start'] + 0.1
for c in (cl1, cl2, cl2 + 0.12):
    sfx.add(sfx_click(), c, 0.7)
    ev('click', c)
nothing_t = W('waiting', 'NOTHING')['start']
sfx.add(sfx_crickets(LINES['waiting']['end'] - nothing_t + 0.4), nothing_t, 0.6, 0.2)
ev('nothing', nothing_t)
for_t = W('waiting', 'FOR')['start']
tt, gap = for_t, 0.14
while tt < LINES['waiting']['end'] + 0.25:
    sfx.add(sfx_tick(len(cues['events']) % 2 == 0), tt, 0.35, -0.3)
    tt += gap
    gap = max(0.045, gap * 0.9)
ev('clockspin', for_t)
ev('skeleton', W('waiting', 'MINUTES')['start'])

# ------------------------------------------------------------------ robot / disguise / worked
robot_t = W('robot', 'ROBOT')['start']
sfx.add(sfx_alarm(2), robot_t - 0.05, 0.3)
ev('alarm', robot_t)
ev('nametag', W('robot', 'TELL')['start'])
dz_start = LINES['disguise']['start'] - 0.1
dz_end = LINES['gotfile']['start'] - 0.1
sn2 = Mix(DUR)
cues['beats']['disguise'] = sneaky(sn2, dz_start, dz_end)
m = sn2.trim(DUR)
m[:, secs(dz_end):] = 0
music.add(m, 0, 0.9)
glasses_t = W('disguise', 'DISGUISE')['start'] + 0.05
sfx.add(sfx_boing(), glasses_t, 0.6)
sfx.add(sfx_pop(1200), glasses_t, 0.5)
ev('glasses', glasses_t)
worked_t = W('worked', 'WORKED')['start']
sfx.add(sfx_success(72), worked_t, 0.55)
sfx.add(sfx_chatter(0.7), worked_t + 0.1, 0.3, 0.3)
ev('worked', worked_t)

# ------------------------------------------------------------------ fake-out: fanfare -> scratch -> sad trombone
fan_t = LINES['gotfile']['start']
fan_end = LINES['thumb']['start'] - 0.04
fan = Mix(DUR)
stabs = [['C4', 'E4', 'G4'], ['C4', 'E4', 'G4'], ['D4', 'F4', 'A4'], ['E4', 'G4', 'B4'], ['F4', 'A4', 'C5'], ['G4', 'B4', 'D5'], ['C5', 'E5', 'G5', 'C6']]
st = fan_t
for i, ch in enumerate(stabs):
    d = 0.16 if i < len(stabs) - 1 else fan_end - st
    if st >= fan_end:
        break
    for nn in ch:
        fan.add(brass(midi_hz(n2m(nn)), max(0.1, min(d, fan_end - st)), vib=0.5 if i == len(stabs) - 1 else 0), st, 0.2)
    fan.add(kick(0.25, 140, 55), st, 0.35)
    st += 0.17
fm_ = fan.trim(DUR)
fm_[:, secs(fan_end):] = 0
music.add(fm_, 0, 1.0)
ev('fanfare', fan_t)
sfx.add(sfx_record_scratch(), fan_end, 0.7)
ev('scratch2', fan_end)
thumb_w = W('thumb', 'THUMBNAIL')
tromb_t = thumb_w['end'] + 0.02
sfx.add(sfx_sad_trombone(), tromb_t, 0.55)
ev('trombone', tromb_t)
ev('tiny', W('thumb', '256PX')['start'])

# ------------------------------------------------------------------ heist: riser -> phonk drop -> tape stop
drop_t = LINES['heist']['start'] - 0.02
sfx.add(sfx_riser(0.9), drop_t - 0.9, 0.35)
heist_end = LINES['aboutme']['start'] - 0.3
hb = Mix(DUR)
cues['beats']['heist'] = phonk(hb, drop_t, heist_end, 1.0)
hm = hb.trim(DUR)
# tape stop the last 0.45 s
ts_len = 0.45
a, b = secs(heist_end - ts_len), secs(heist_end)
for ch in range(2):
    seg = hm[ch, a:a + secs(1.2)].copy()
    stopped = tape_stop(seg, ts_len)
    hm[ch, a:] = 0
    hm[ch, a:a + len(stopped)] = stopped * np.linspace(1, 0.3, len(stopped))
music.add(hm, 0, 1.05)
sfx.add(sfx_impact(), drop_t, 0.7)
ev('drop', drop_t)
ev('tapestop', heist_end - ts_len)
# montage whooshes every 2 beats, byte counter chatter, cash at the end
for i, bt in enumerate(cues['beats']['heist']):
    if i % 2 == 1 and bt < heist_end - 0.6:
        sfx.add(sfx_whoosh(0.22, up=i % 4 == 1), bt - 0.12, 0.18, 0.4 if i % 4 == 1 else -0.4)
cnt_t = W('heist', 'DECRYPT')['start']
sfx.add(sfx_chatter(heist_end - ts_len - cnt_t - 0.35), cnt_t, 0.35)
cash_t = heist_end - ts_len - 0.3
sfx.add(sfx_cash(), cash_t, 0.55)
ev('counter', cnt_t)
ev('done', cash_t)

# ------------------------------------------------------------------ reveal + outro: music box
mb_start = LINES['aboutme']['start'] + 0.05
MB = [('E5', 0), ('G5', 0.5), ('C6', 1.0), ('B5', 1.5), ('G5', 2.0), ('A5', 2.75), ('E5', 3.25), ('G5', 3.5), ('D5', 4.0),
      ('C5', 4.5), ('E5', 5.0), ('G5', 5.5)]
mb_bus = Mix(DUR)
for nn, off in MB:
    mb_bus.add(music_box(midi_hz(n2m(nn)), 1.8), mb_start + off * 0.62, 0.5, 0.2)
mb_bus.add(pad([midi_hz(n2m(x)) for x in ('C3', 'G3', 'E4')], DUR - mb_start + 0.5, 1200), mb_start, 0.35)
mm = mb_bus.trim(DUR)
music.add(reverb(mm[0], 2.0, 5000, 0.35), 0, 1.0, -0.2)
music.add(reverb(mm[1], 2.0, 5000, 0.35), 0, 1.0, 0.2)
sfx.add(sfx_heartbeat(), W('aboutme', 'ME')['start'] + 0.35, 0.8)
ev('me', W('aboutme', 'ME')['start'])
type_t = LINES['makeown']['start']
sfx.add(sfx_typing(LINES['makeown']['end'] - type_t + 0.2), type_t, 0.5, 0.2)
ev('typing', type_t)
watch_t = W('watching', 'WATCHING')['start']
ev('zoomout', watch_t)
end_t = W('watching', 'IT')['start']
sfx.add(sfx_vine_boom(), end_t, 0.55)
ev('final', end_t)
# tail: the hook groove sneaks back in so the loop point feels intentional
tail_t = LINES['watching']['end'] + 0.35
tb_ = Mix(DUR)
cues['beats']['tail'] = phonk(tb_, tail_t, DUR, 0.7, full=False)
tm = tb_.trim(DUR)
music.add(tm * np.linspace(0, 1, tm.shape[1])[None, :] ** 0.3, 0, 0.9)

# ------------------------------------------------------------------ mix
duck = duck_envelope(voice, DUR, depth_db=-9)
mus = music.trim(DUR) * duck[None, :]
mix = mus * 0.55 + sfx.trim(DUR) * 0.8
vpad = np.zeros(secs(DUR), np.float32)
vpad[:min(len(voice), len(vpad))] = voice[:len(vpad)]
vpad = peak(hp(vpad, 90), 3000, 2.5, 0.8)
mix += np.stack([vpad, vpad]) * 1.0
out = master(mix, 0.94, 1.3)
# fade the last few ms to avoid a click at the loop point
out[:, -secs(0.02):] *= np.linspace(1, 0, secs(0.02))
write_wav(os.path.join(HERE, 'build', 'audio.wav'), out)
cues['duration'] = DUR
json.dump(cues, open(os.path.join(HERE, 'build', 'cues.json'), 'w'), indent=1)
print('audio ok', out.shape, 'events', len(cues['events']), {k: len(v) for k, v in cues['beats'].items()})
