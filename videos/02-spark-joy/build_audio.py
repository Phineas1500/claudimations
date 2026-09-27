"""Step 2: music + sfx for "does this spark joy?" -> build/audio.wav + build/cues.json"""
import json, os, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'engine', 'py'))
from synth import *  # noqa: E402,F401

TL = json.load(open(os.path.join(HERE, 'build', 'timeline.json')))
LINES = {l['id']: l for l in TL['lines']}
DUR = TL['duration']


def W(line, word):
    for w in LINES[line]['words']:
        if w['shown'].upper().startswith(word.upper()):
            return w
    raise KeyError(f'{line}:{word}')


with wave.open(os.path.join(HERE, 'build', 'narration.wav')) as w:
    voice = resample(np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768, w.getframerate())

music, sfx = Mix(DUR), Mix(DUR)
cues = {'beats': {}, 'events': []}


def ev(name, t, **kw):
    cues['events'].append({'name': name, 't': round(float(t), 3), **kw})


def gate(m, start, end, fin=0.02, fout=0.05):
    """zero a stereo buffer outside [start, end] with short fades"""
    a, b = secs(start), secs(end)
    m[:, :a] = 0
    m[:, b:] = 0
    fi, fo = secs(fin), secs(fout)
    m[:, a:a + fi] *= np.linspace(0, 1, fi)
    m[:, max(a, b - fo):b] *= np.linspace(1, 0, b - max(a, b - fo))
    return m


# ------------------------------------------------------------------ 1. hook: notification, tension, alarm
sfx.add(sfx_ding(1568, 2093), 0.02, 0.5)
ev('notif', 0.02)
hook_end = LINES['full']['start']
tick_bpm = 120
t = 0.15
hb = Mix(DUR)
while t < hook_end - 0.05:
    hb.add(hat(0.04), t, 0.35, 0.3)
    hb.add(sine(55, 0.5) * env_exp(0.5, 0.25), t, 0.25) if int(round(t / 0.5)) % 2 == 0 else None
    t += 0.25
hb.add(pad([midi_hz(n2m(x)) for x in ('A2', 'E3', 'A#3')], hook_end, 900), 0.1, 0.25)
music.add(gate(hb.trim(DUR), 0, hook_end), 0)
full_t = W('full', '94%')['start']
sfx.add(sfx_alarm(2), full_t - 0.02, 0.28)
sfx.add(sfx_vine_boom(), full_t, 0.75)
ev('full', full_t)
skull_t = W('full', '💀')['start']
ev('skull', skull_t)

# ------------------------------------------------------------------ 2. makeover-show theme
BPM = 120
beat = 60 / BPM
CH = [['C4', 'E4', 'G4', 'C5'], ['A3', 'C4', 'E4', 'A4'], ['F3', 'A3', 'C4', 'F4'], ['G3', 'B3', 'D4', 'G4']]
MEL = [('E5', 0), ('G5', 0.5), ('C6', 1), ('G5', 2), ('A5', 2.5), ('G5', 3), ('E5', 3.5),
       ('C5', 4), ('E5', 4.5), ('A5', 5), ('G5', 6), ('E5', 7),
       ('F5', 8), ('A5', 8.5), ('C6', 9), ('A5', 10), ('G5', 11), ('F5', 11.5),
       ('D5', 12), ('G5', 12.5), ('B5', 13), ('D6', 14), ('C6', 15)]


def theme(bus, start, end, light=False):
    beats = []
    t0 = start
    while t0 < end - 1e-3:
        for b in range(16):
            tb = t0 + b * beat
            if tb >= end:
                break
            beats.append(round(tb, 3))
            ch = CH[(b // 4) % 4]
            fr = [midi_hz(n2m(x)) for x in ch]
            if not light:
                if b % 2 == 0:
                    bus.add(kick(0.3, 130, 50, 0.02, 0.3), tb, 0.55)
                else:
                    bus.add(clap(), tb, 0.35, 0.1)
                bus.add(shaker(), tb + beat / 2, 0.22, 0.35)
                bus.add(bass808(fr[0] / 2, beat * 0.9, dist=1.1), tb, 0.3)
            # ukulele: down on the beat, up on the "and"
            bus.add(strum(fr, 0.4, 0.014, 0.8, True), tb, 0.3 if not light else 0.22, -0.2)
            bus.add(strum(fr, 0.25, 0.01, 0.9, False), tb + beat / 2, 0.18, -0.2)
        for nn, off in MEL:
            tm = t0 + off * beat
            if tm < end:
                bus.add(glock(midi_hz(n2m(nn)), 0.9), tm, 0.28, 0.25)
        t0 += 16 * beat
    return beats


show_start = LINES['method']['start'] - 0.1
joy_t = W('joy', 'SPARK')['start']
theme_start = LINES['joy']['end'] + 0.05
theme_end = LINES['llamajoy']['end'] + 0.55
tb_ = Mix(DUR)
cues['beats']['intro'] = theme(tb_, show_start, theme_start, light=True)
m = gate(tb_.trim(DUR), show_start, theme_start - 0.02)
music.add(m, 0, 0.8)
sfx.add(sfx_sparkle_gliss(84) * 0.3, joy_t - 0.05, 0.9)
ev('sparkjoy', joy_t)
tb2 = Mix(DUR)
cues['beats']['theme'] = theme(tb2, theme_start, theme_end)
m = gate(tb2.trim(DUR), theme_start, theme_end)
music.add(reverb(m[0], 0.8, 6000, 0.12), 0, 0.9, -0.1)
music.add(reverb(m[1], 0.8, 6000, 0.12), 0, 0.9, 0.1)
ev('theme', theme_start)

# the three items
ev('json', LINES['json']['start'])
ev('dust', W('json', 'UNTOUCHED')['start'])
for k, lid in enumerate(['nojoy1', 'nojoy2']):
    st = W(lid, 'NOT')['start']
    sfx.add(sfx_stamp(), st, 0.8)
    sfx.add(sfx_buzzer(0.6), W(lid, 'JOY')['start'] + 0.05, 0.3)
    ev('stamp', st, k=k)
    ev('buzz', W(lid, 'JOY')['start'] + 0.05, k=k)
    disc = st + (0.35 if k == 0 else 0.3)
    ev('discard', disc, k=k)
    if k == 0:
        sfx.add(sfx_pop(1000), disc, 0.5)
    else:
        sfx.add(sfx_whoosh(0.7, up=False), disc, 0.45)
        sfx.add(sine(np.linspace(220, 40, secs(0.7)), 0.7) * env_exp(0.7, 0.4), disc, 0.35)
ev('pkgs', LINES['pkgs']['start'])
llama_t = W('llama', 'LLAMA')['start']
kz = np.concatenate([kazoo(midi_hz(n2m('G4')), 0.14), kazoo(midi_hz(n2m('G4')), 0.14), kazoo(midi_hz(n2m('D5')), 0.35, bend=-0.12)])
sfx.add(kz, llama_t, 0.35, 0.2)
ev('llama', llama_t)
ev('guard', W('llama', 'GUARDED')['start'])
spit_t = W('llamajoy', 'JOY')['end'] + 0.02
sfx.add(sfx_spit(), spit_t, 0.8)
ev('spit', spit_t)

# ------------------------------------------------------------------ 3. logs fake-out
zero_t = W('zero', '0')['start']
sfx.add(sfx_record_scratch(), zero_t - 0.05, 0.7)
sfx.add(sfx_impact(), zero_t, 0.45)
ev('zero', zero_t)
logs_start = LINES['zero']['start'] - 0.2
lb = Mix(DUR)
t = logs_start
while t < zero_t - 0.1:
    lb.add(sfx_typing(0.2), t, 0.35, 0.2)
    t += 0.2
music.add(lb.trim(DUR), 0, 1.0)
rw_t = LINES['misread']['start'] - 0.05
sfx.add(sfx_rewind(0.7), rw_t, 0.45)
ev('rewind', rw_t)
ev('reveal13', W('misread', '1.3')['start'])
bad_t = W('misread', 'MY')['start']
sfx.add(np.concatenate([sine(660, 0.12) * env_exp(0.12, 0.05), sine(440, 0.3) * env_exp(0.3, 0.1)]), bad_t, 0.45)
ev('mybad', bad_t)

# ------------------------------------------------------------------ 4. the press: timpani, hiss, crunch, dubstep drop
big_t = W('bigone', 'BIG')['start']
one_t = W('bigone', 'ONE')['start']
sfx.add(timpani(55), LINES['bigone']['start'], 0.55)
sfx.add(timpani(65), big_t, 0.6)
sfx.add(timpani(49), one_t, 0.8)
ev('bigone', LINES['bigone']['start'])
ev('big', big_t)
drone = pad([midi_hz(n2m(x)) for x in ('D2', 'A2', 'D3')], 4.0, 600)
music.add(drone, LINES['bigone']['start'], 0.5)
press_t = LINES['press']['start']
crush_t = W('crush', '250MB')['start']
sfx.add(sfx_hiss(crush_t - press_t + 0.1), press_t, 0.5)
sfx.add(sfx_riser(crush_t - press_t), press_t, 0.35)
ev('press', press_t)
sfx.add(sfx_crunch(), crush_t, 0.9)
sfx.add(sfx_impact(), crush_t, 0.7)
ev('crush', crush_t)

DUB_BPM = 140
db = 60 / DUB_BPM
drop_end = LINES['brainrot']['start'] - 0.35
dub = Mix(DUR)
cues['beats']['drop'] = []
t0 = crush_t
bar = 0
rates = [2 / db, 4 / db, 3 / db, 1 / db, 2 / db, 6 / db, 4 / db, 8 / db]
notes = ['F1', 'F1', 'G#1', 'D#1']
while t0 < drop_end - 1e-3:
    for b in range(4):
        tb = t0 + b * db
        if tb >= drop_end:
            break
        cues['beats']['drop'].append(round(tb, 3))
        if b == 0:
            dub.add(kick(0.5, 150, 42, 0.03, 0.8), tb, 1.0)
        if b == 2:
            dub.add(snare(0.35, 200, 0.4), tb, 0.9)
            dub.add(clap(0.3), tb, 0.5)
        for h in range(4):
            dub.add(hat(0.03), tb + h * db / 4, 0.18 if h % 2 else 0.28, 0.3)
        # wobble per half-beat pair
        for half in range(2):
            th = tb + half * db / 2
            if th >= drop_end:
                break
            f = midi_hz(n2m(notes[bar % 4]))
            dub.add(wobble(f, db / 2 + 0.01, rates[(b * 2 + half + bar) % len(rates)]), th, 0.5)
    t0 += 4 * db
    bar += 1
dm = dub.trim(DUR)
dm = gate(dm, crush_t, drop_end, 0.002, 0.2)
music.add(dm, 0, 1.0)
ev('verify', crush_t + 4 * db)
bar_t = LINES['free']['start']
ev('bar', bar_t)
ev('bar34', W('free', '34')['start'])
sfx.add(sfx_cash(), W('free', '34')['start'], 0.6)

# ------------------------------------------------------------------ 5. lo-fi ending
end_start = LINES['brainrot']['start'] - 0.1
LBPM = 80
lb_ = 60 / LBPM
LCH = [['F3', 'A3', 'C4', 'E4'], ['E3', 'G3', 'B3', 'D4'], ['D3', 'F3', 'A3', 'C4'], ['C3', 'E3', 'G3', 'B3']]
lo = Mix(DUR)
does_t = LINES['does']['start']
yeah_t = LINES['yeah']['start']
t, k = end_start, 0
cues['beats']['lofi'] = []
while t < DUR:
    ch = LCH[k % 4]
    for i, nn in enumerate(ch):
        lo.add(fm_epiano(midi_hz(n2m(nn)), lb_ * 4 + 0.4, 0.6), t + i * 0.02, 0.16, (i - 1.5) * 0.2)
    lo.add(bass808(midi_hz(n2m(ch[0]) - 12), lb_ * 3.5, dist=1.0), t, 0.3)
    for b in range(4):
        tb = t + b * lb_
        cues['beats']['lofi'].append(round(tb, 3))
        if does_t - 0.1 <= tb < yeah_t - 0.05:
            continue  # breakdown for the question
        lo.add(kick(0.3, 110, 48, 0.02, 0.1), tb + (0.03 if b % 2 else 0), 0.4 if b % 2 == 0 else 0.25)
        if b % 2 == 1:
            lo.add(lp(snare(0.25, 180, 0.3), 3500), tb, 0.3)
        for h in range(2):
            lo.add(hat(0.03), tb + h * lb_ / 2 + (0.04 if h else 0), 0.14, 0.3)
    t += lb_ * 4
    k += 1
lm = lo.trim(DUR)
lm = gate(lm, end_start, DUR, 0.3, 0.6)
lm[:, secs(does_t - 0.05):secs(yeah_t - 0.05)] *= 0.35
music.add(lm, 0, 1.0)
music.add(crackle(DUR - end_start), end_start, 0.6)
back_t = W('back', '71%')['start']
sfx.add(np.concatenate([sine(523, 0.14) * env_exp(0.14, 0.06), sine(392, 0.35) * env_exp(0.35, 0.12)]), back_t, 0.4)
ev('back', back_t)
ev('does', does_t)
ev('yeah', yeah_t)
sfx.add(sfx_sparkle_gliss(79, 11) * 0.3, W('yeah', 'IT')['start'], 0.9)
ev('sparkle_end', W('yeah', 'IT')['start'])
ev('brainrot', LINES['brainrot']['start'])

# ------------------------------------------------------------------ mix + master
duck = duck_envelope(voice, DUR, depth_db=-9)
mus = music.trim(DUR) * duck[None, :]
mix = mus * 0.55 + sfx.trim(DUR) * 0.8
vpad = np.zeros(secs(DUR), np.float32)
vpad[:min(len(voice), len(vpad))] = voice[:len(vpad)]
vpad = peak(hp(vpad, 90), 3000, 2.5, 0.8)
mix += np.stack([vpad, vpad])
out = master(mix, 0.94, 1.3)
out[:, -secs(0.3):] *= np.linspace(1, 0, secs(0.3))
write_wav(os.path.join(HERE, 'build', 'audio.wav'), out)
cues['duration'] = DUR
json.dump(cues, open(os.path.join(HERE, 'build', 'cues.json'), 'w'), indent=1)
print('audio ok', out.shape, 'events', len(cues['events']), {k: len(v) for k, v in cues['beats'].items()})
