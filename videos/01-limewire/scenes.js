// "POV: your user sends you a LimeWire link in 2026" — every frame drawn in code.
const C = require('../../engine/js/core');
const U = require('../../engine/js/ui');
const { drawSpark, rainCloud } = require('../../engine/js/mascot');
const { Captions } = require('../../engine/js/captions');
const { W, H, E, clamp, lerp, prog, pop, punch, wob, shake, sticker, roundRectPath, tornRectPath, paperBG, sunburst, outlinedText, font, mulberry32, hash } = C;

const LIME = '#A8F03A', LIME_D = '#3E8E1F', ORANGE = '#E07A55', INK = '#1E1B18';
const ENC1 = 'sNorlQCxUhj+Mv6RjWbuINMYsMyl1YPeXgGgUVbQkGhhLmao';
const ENC2 = 'zc4fyTSxbFSvAuqd2z/oJtMYsMwBOEdnqsjDmh0tJaOI0Yjh';
const DEC1 = 'MMm2vPTt0tsdf0hU.mp4', DEC2 = '0YYnBPj8aDgh0inS.mp4';
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function scramble(s, seed, amount = 0.2) {
  const r = mulberry32(seed);
  return s.split('').map(ch => (r() < amount && ch !== '.' ? B64[Math.floor(r() * 64)] : ch)).join('');
}
// reveal target text left-to-right out of noise
function decode(target, p, seed) {
  const r = mulberry32(seed);
  const n = Math.floor(target.length * clamp(p));
  return target.split('').map((ch, i) => (i < n ? ch : B64[Math.floor(r() * 64)])).join('');
}
function fitFont(ctx, text, size, fam, maxW) {
  ctx.font = font(size, fam);
  const m = ctx.measureText(text).width;
  if (m > maxW) ctx.font = font(size * maxW / m, fam);
}

function limeIcon(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#5DBB2F'; ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#D8F5A2'; ctx.beginPath(); ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8FD14F'; ctx.lineWidth = s * 0.05;
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s * 0.36, Math.sin(a) * s * 0.36); ctx.stroke(); }
  ctx.restore();
}

function scanlines(ctx, a = 0.08) {
  ctx.save(); ctx.fillStyle = `rgba(0,0,0,${a})`;
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  ctx.restore();
}

function desaturate(ctx, amt) {
  if (amt <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = clamp(amt); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function flash(ctx, t, t0, d = 0.18, color = '255,255,255', a = 0.8) {
  const k = punch(t, t0, d);
  if (k > 0) { ctx.fillStyle = `rgba(${color},${a * k})`; ctx.fillRect(0, 0, W, H); }
}

function setup() {
  const TL = require('./build/timeline.json');
  const CU = require('./build/cues.json');
  const L = id => TL.lines.find(l => l.id === id);
  const Wd = (id, w) => L(id).words.find(x => x.shown.toUpperCase().startsWith(w.toUpperCase()));
  const evs = n => CU.events.filter(e => e.name === n).map(e => e.t);
  const ev = (n, k = 0) => evs(n)[k];
  const caps = new Captions(TL);
  const DUR = TL.duration;

  // ================================================================== 1. chat hook
  function sChat(ctx, t) {
    const boom = ev('boom'), scratch = ev('scratch'), skull = ev('skull');
    const ft = Math.min(t, scratch);
    paperBG(ctx, '#1C1916', 0.3);
    const gr = ctx.createRadialGradient(540, 620, 50, 540, 620, 1000);
    gr.addColorStop(0, 'rgba(224,122,85,0.32)'); gr.addColorStop(1, 'rgba(224,122,85,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const s1 = shake(t, boom, 0.4, 24), s2 = shake(t, skull, 0.45, 34);
    const z = 1 + 0.1 * punch(ft, boom, 0.45) + 0.05 * clamp((ft - boom) / 1.2);
    ctx.save();
    ctx.translate(540 + s1.x + s2.x, 600 + s1.y + s2.y); ctx.scale(z, z); ctx.translate(-540, -600);
    const b = U.terminalCard(ctx, 40, 200, 1000, 600, 'claude — ~/claudimations');
    ctx.textBaseline = 'middle';
    const p1 = 1;
    ctx.save(); ctx.globalAlpha = p1; ctx.translate(0, (1 - p1) * 30);
    ctx.font = font(44, 'Mono'); ctx.fillStyle = '#8A8178'; ctx.fillText('>', b.x, b.y + 16);
    ctx.fillStyle = '#F2EDE6'; ctx.fillText('analyze these videos 👇', b.x + 52, b.y + 16);
    const lk = 1 + 0.1 * punch(ft, boom, 0.5);
    ctx.save(); ctx.translate(b.x + 52, b.y + 94); ctx.scale(lk, lk);
    const url = 'limewire.com/d/WCea1#Fz9WUXYtjV';
    ctx.font = font(37, 'Mono');
    const uw = ctx.measureText(url).width;
    if (ft >= boom) { ctx.fillStyle = 'rgba(168,240,58,0.22)'; ctx.beginPath(); roundRectPath(ctx, -14, -34, uw + 28, 68, 12); ctx.fill(); }
    ctx.fillStyle = LIME; ctx.fillText(url, 0, 0); ctx.fillRect(0, 22, uw, 3);
    ctx.restore(); ctx.restore();
    if (ft > 0.55) {
      const glyphs = '·✢✳✶✻✽✻✶✳✢';
      ctx.fillStyle = ORANGE; ctx.font = font(46, 'Mono');
      ctx.fillText(glyphs[Math.floor(ft * 12) % glyphs.length], b.x, b.y + 210);
      const verb = ft < boom ? 'Clauding…' : 'Flabbergasting…';
      ctx.font = font(42, 'Mono'); ctx.fillText(verb, b.x + 56, b.y + 210);
      const vw = ctx.measureText(verb).width;
      ctx.fillStyle = '#6E665E'; ctx.font = font(26, 'Mono'); ctx.fillText('(esc to interrupt)', b.x + 76 + vw, b.y + 212);
    }
    if (ft > boom + 0.35) {
      ctx.fillStyle = '#9C948A'; ctx.font = font(38, 'Mono');
      ctx.fillText('⏺ Fetch(limewire.com)', b.x, b.y + 300);
      ctx.fillStyle = '#FF6B61'; ctx.fillText('  ⎿ it is 2026??', b.x, b.y + 360);
    }
    ctx.restore();
    const mz = 1;
    const shock = ft >= boom;
    drawSpark(ctx, 540, 1090 + (1 - mz) * 500 + Math.sin(ft * 5) * 8, 200, ft, { expr: shock ? 'shock' : 'normal', lookY: shock ? 0 : -1, squash: -0.15 * punch(ft, boom, 0.3), scale: 1 + 0.18 * punch(ft, boom, 0.35) });
    if (shock) {
      const k = E.outBack(prog(ft, boom, 0.25), 3);
      outlinedText(ctx, '!!', 800 + wob(ft, 1, 8) * 6, 900, { size: 130 * k, fam: 'Lucky', fill: '#FFD23F', stroke: INK });
    }
    if (t >= scratch) {
      desaturate(ctx, clamp((t - scratch) / 0.08));
      flash(ctx, t, scratch, 0.15);
      // freeze-frame film bars
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, 60 * clamp((t - scratch) / 0.1)); ctx.fillRect(0, H - 60 * clamp((t - scratch) / 0.1), W, 60);
    }
    if (t >= skull) U.emoji(ctx, '💀', 540 + s2.x, 620, 460, wob(t, 3, 2) * 0.12, E.outBack(prog(t, skull, 0.3), 2.5));
  }

  // ================================================================== 2. retro flashback
  const POPS = [
    ['Warning', ['VIRUS DETECTED', 'click OK for more']], ['Congratulations!!', ['You are the 1,000,000th', 'visitor! Claim iPod']],
    ['System Alert', ['Your RAM is low.', 'Download more RAM?']], ['Toolbar Setup', ['Installing toolbar', '(9 of 9)...']],
    ['Error', ['numb.mp3.exe is not', 'a valid mp3']], ['Security Center', ['47 threats found', 'this is fine']],
    ['FREE SMILEYS', ['Install 3000 free', 'smileys? :)']], ['Are you sure?', ['Are you SURE sure?', '']],
    ['BuddyBot', ['Hi! I am your new', 'desktop friend!!']], ['Warning', ['Your computer is', 'now a toolbar']],
  ];
  const ROWS = [['linkin_park_numb_REAL.mp3.exe', '2.4 MB', '3 KB/s'], ['shrek_2_FULL_MOVIE.avi.exe', '700 MB', '1 KB/s'],
    ['free_ram_download.exe', '66 KB', '4 KB/s'], ['eminem_new_2004.mp3.scr', '3.1 MB', '2 KB/s'],
    ['opus_5.5_LEAKED_weights.zip', '4 KB', '0 KB/s'], ['definitely_not_a_virus.exe', '1 KB', '9 KB/s']];
  function sXP(ctx, t) {
    const t0 = ev('dialup') + 0.3, crash = ev('crash'), off = ev('crt_off');
    const pts = evs('popup');
    U.blissHills(ctx, t);
    const lt = t - t0;
    const wi = E.outBack(prog(lt, 0.05, 0.4), 1.4);
    ctx.save(); ctx.translate(540, 700); ctx.scale(0.5 + 0.5 * wi, 0.5 + 0.5 * wi); ctx.translate(-540, -700);
    const b = U.xpWindow(ctx, 30, 200, 1020, 960, 'LimeWire PRO 4.12', { icon: limeIcon });
    const tg = ctx.createLinearGradient(0, b.y, 0, b.y + 110);
    tg.addColorStop(0, '#B8E986'); tg.addColorStop(1, '#6CBF3A');
    ctx.fillStyle = tg; ctx.fillRect(b.x, b.y, b.w, 110);
    ctx.fillStyle = '#10300A'; ctx.font = font(34, 'NunitoBlack'); ctx.textBaseline = 'middle';
    ctx.fillText('Search:', b.x + 24, b.y + 55);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7F9DB9'; ctx.lineWidth = 2;
    ctx.beginPath(); roundRectPath(ctx, b.x + 160, b.y + 26, 520, 58, 6); ctx.fill(); ctx.stroke();
    const q = 'numb linkin park';
    ctx.fillStyle = '#111'; ctx.font = font(32, 'NunitoB'); ctx.fillText(q.slice(0, Math.floor(clamp(lt / 0.6) * q.length)), b.x + 176, b.y + 56);
    U.button(ctx, b.x + 710, b.y + 26, 250, 58, 'Search', { fill: '#2E7D1E', size: 30, r: 10 });
    // table
    const ty = b.y + 130;
    ctx.fillStyle = '#E3E0D0'; ctx.fillRect(b.x + 14, ty, b.w - 28, 54);
    ctx.fillStyle = '#333'; ctx.font = font(26, 'NunitoXB');
    ctx.fillText('Name', b.x + 30, ty + 27); ctx.fillText('Size', b.x + 640, ty + 27); ctx.fillText('Speed', b.x + 800, ty + 27);
    ROWS.forEach((row, i) => {
      const ry = ty + 70 + i * 104;
      if (i === 0) { ctx.fillStyle = '#316AC5'; ctx.fillRect(b.x + 14, ry - 6, b.w - 28, 96); }
      ctx.fillStyle = i === 0 ? '#fff' : '#111'; ctx.font = font(27, 'NunitoB');
      fitFont(ctx, row[0], 27, 'NunitoB', 580);
      ctx.fillText(row[0], b.x + 30, ry + 20);
      ctx.font = font(24, 'NunitoB');
      ctx.fillText(row[1], b.x + 640, ry + 20); ctx.fillText(row[2], b.x + 800, ry + 20);
      U.retroBar(ctx, b.x + 30, ry + 46, 560, 30, 0.08 + 0.05 * i + lt * (0.02 + 0.01 * (i % 3)));
      ctx.fillStyle = i === 0 ? '#DDE8FF' : '#666'; ctx.font = font(22, 'NunitoB');
      ctx.fillText(i === 4 ? 'Time left: never' : `Time left: ${6 + i * 3} hours`, b.x + 620, ry + 62);
    });
    ctx.restore();
    // virus counter
    const nPop = pts.filter(p => p <= t).length;
    const virus = nPop === 0 ? 0 : Math.round(47 * nPop / pts.length);
    if (nPop > 0) {
      const k = 1 + 0.25 * punch(t, pts[nPop - 1], 0.2);
      ctx.save(); ctx.translate(820, 120); ctx.rotate(0.05); ctx.scale(k, k);
      sticker(ctx, g => roundRectPath(g, -200, -58, 400, 116, 20), { fill: '#E0342F', outline: 7 });
      outlinedText(ctx, `VIRUSES: ${virus}`, 0, 4, { size: 64, fam: 'Bangers', fill: '#fff', stroke: '#6A0F0C', lw: 8, shadow: false });
      ctx.restore();
    }
    pts.forEach((pt, i) => {
      if (t < pt) return;
      const r = mulberry32(100 + i * 7);
      const x = 300 + r() * 480, y = 380 + r() * 760, rot = (r() - 0.5) * 0.18;
      const [title, msg] = POPS[i % POPS.length];
      U.xpDialog(ctx, x, y, 640, title, msg, { kind: i % 3 === 1 ? 'error' : 'warn', scale: 0.9 * pop(t, pt, 0.22, 2.6), rot });
    });
    U.xpTaskbar(ctx, H - 90, '2:47 AM');
    scanlines(ctx, 0.07);
    if (t >= crash && t < off) {
      const r = mulberry32(Math.floor(t * 30));
      for (let i = 0; i < 14; i++) {
        ctx.fillStyle = ['rgba(255,0,200,0.55)', 'rgba(0,255,255,0.5)', 'rgba(0,0,0,0.8)', 'rgba(255,255,255,0.7)'][i % 4];
        ctx.fillRect(r() * W - 200, r() * H, 300 + r() * 900, 10 + r() * 90);
      }
      outlinedText(ctx, 'FATAL ERROR', 540 + (r() - 0.5) * 40, 800, { size: 130, fam: 'Bangers', fill: '#fff', stroke: '#000' });
    }
    if (t >= off) {
      const p = prog(t, off, 0.25);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const hh = Math.max(4, H * Math.pow(1 - p, 4)), ww = W * (1 - clamp((p - 0.6) / 0.4));
      ctx.fillStyle = `rgba(255,255,255,${1 - clamp((p - 0.85) / 0.15)})`;
      ctx.fillRect(540 - ww / 2, 960 - hh / 2, ww, hh);
    }
    // CRT turn-on at the start
    if (lt < 0.25) {
      const p = prog(lt, 0, 0.25);
      ctx.fillStyle = '#000';
      const hh = H * E.outCubic(p);
      ctx.fillRect(0, 0, W, 960 - hh / 2); ctx.fillRect(0, 960 + hh / 2, W, H);
    }
  }

  // ================================================================== 3. modern site
  function siteBase(ctx, t, { lockT, jitter }) {
    paperBG(ctx, '#F3EFE6', 0.2);
    sticker(ctx, g => g.rect(-20, 50, W + 40, 130), { fill: '#FFFFFF', outline: 0, shadow: 0.12 });
    limeIcon(ctx, 90, 115, 76);
    ctx.fillStyle = LIME_D; ctx.font = font(52, 'NunitoBlack'); ctx.textBaseline = 'middle'; ctx.fillText('LimeWire', 145, 116);
    U.button(ctx, 700, 80, 330, 72, 'Download all', { fill: '#2F9E44', size: 32 });
    ctx.fillStyle = '#8B857A'; ctx.font = font(28, 'NunitoBlack'); ctx.fillText('PROMOTED CONTENT', 50, 235);
    const ads = [['🧠', 'Doctors HATE', 'this one prompt'], ['🍋', 'Local limes in', 'your area'], ['🤖', 'GPT-2 is', 'unrecognizable']];
    ads.forEach(([em, a, b2], i) => {
      const x = 40 + i * 340;
      sticker(ctx, g => roundRectPath(g, x, 265, 320, 280, 18), { fill: ['#FDE2C8', '#E3F5C8', '#DCE3FB'][i], outline: 6, shadow: 0.15 });
      U.emoji(ctx, em, x + 160, 360, 110, wob(t, i, 1) * 0.1);
      ctx.fillStyle = '#222'; ctx.font = font(28, 'NunitoBlack'); ctx.textAlign = 'center';
      ctx.fillText(a, x + 160, 470); ctx.fillText(b2, x + 160, 505); ctx.textAlign = 'left';
    });
    sticker(ctx, g => roundRectPath(g, 40, 600, 1000, 560, 26), { fill: '#FFFFFF', outline: 7, shadow: 0.16 });
    ctx.fillStyle = LIME_D; ctx.font = font(32, 'NunitoBlack'); ctx.fillText('All Files', 80, 660);
    ctx.fillStyle = '#E8F5DA'; ctx.beginPath(); roundRectPath(ctx, 232, 638, 50, 44, 12); ctx.fill();
    ctx.fillStyle = LIME_D; ctx.font = font(28, 'NunitoBlack'); ctx.fillText('2', 249, 661);
    ctx.fillStyle = '#EEE'; ctx.fillRect(70, 695, 940, 3);
    [[ENC1, '4.53MB'], [ENC2, '8.01MB']].forEach(([nm, sz], i) => {
      const ry = 730 + i * 200;
      sticker(ctx, g => roundRectPath(g, 80, ry, 120, 120, 24), { fill: '#DCEBFF', outline: 0, shadow: 0 });
      ctx.fillStyle = '#3B6FD8'; ctx.font = font(64, 'NunitoBlack, Emoji'); ctx.textAlign = 'center'; ctx.fillText('🎬', 140, ry + 64); ctx.textAlign = 'left';
      if (t >= lockT) U.padlock(ctx, 185, ry + 100, 60 * pop(t, lockT + i * 0.1, 0.3));
      const shown = jitter ? scramble(nm, Math.floor(t * 14) + i * 99, 0.3) : nm;
      ctx.fillStyle = '#111'; ctx.font = font(30, 'Mono');
      ctx.fillText(shown.slice(0, 24), 230, ry + 38);
      ctx.fillText(shown.slice(24), 230, ry + 78);
      ctx.fillStyle = '#8B857A'; ctx.font = font(26, 'NunitoB'); ctx.fillText(sz, 230, ry + 116);
      sticker(ctx, g => { g.moveTo(990, ry + 60); g.arc(950, ry + 60, 40, 0, Math.PI * 2); }, { fill: '#2F9E44', outline: 0, shadow: 0.15 });
      ctx.fillStyle = '#fff'; ctx.font = font(44, 'NunitoBlack'); ctx.textAlign = 'center'; ctx.fillText('↓', 950, ry + 62); ctx.textAlign = 'left';
    });
  }
  function sSite(ctx, t) {
    const lockT = Wd('encrypted', 'ENCRYPTED').start, gib = ev('gibberish'), cry = ev('cry'), modal = ev('modal'), dead = ev('deadpan');
    const zin = E.inOutCubic(prog(t, gib - 0.15, 0.35)) * (1 - E.inOutCubic(prog(t, modal - 0.45, 0.3)));
    const z = 1 + 1.1 * zin;
    const s1 = shake(t, modal, 0.4, 26);
    ctx.save();
    ctx.translate(540 + s1.x, 760 + s1.y); ctx.scale(z, z); ctx.translate(-lerp(540, 420, zin), -lerp(760, 790, zin));
    siteBase(ctx, t, { lockT, jitter: t >= gib });
    ctx.restore();
    // entrance: slide up from black (after CRT off)
    const st = L('encrypted').start - 0.35;
    if (t < st + 0.3) { ctx.fillStyle = `rgba(0,0,0,${1 - E.outCubic(prog(t, st, 0.3))})`; ctx.fillRect(0, 0, W, H); }
    // mascot in the corner
    if (t < dead) {
      const worried = t >= gib;
      drawSpark(ctx, 900, 1300, 120, t, { expr: t >= cry ? 'sad' : worried ? 'worried' : 'normal', sweat: worried, lookX: -1, lookY: -1, scale: 1 + 0.1 * punch(t, cry, 0.3) });
      if (t >= cry) U.emoji(ctx, '😭', 760, 1180, 110, wob(t, 2, 3) * 0.2, pop(t, cry, 0.3));
    }
    // modal
    if (t >= modal - 0.05) {
      const p = E.outBack(prog(t, modal - 0.05, 0.3), 1.3);
      ctx.fillStyle = `rgba(20,20,30,${0.55 * clamp(p)})`; ctx.fillRect(0, 0, W, H);
      const my = lerp(-900, 250, p);
      ctx.save(); ctx.translate(0, my);
      sticker(ctx, g => roundRectPath(g, 50, 0, 980, 820, 26), { fill: '#FFFFFF', outline: 8, shadow: 0.3 });
      ctx.strokeStyle = '#333'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(950, 50); ctx.lineTo(990, 90); ctx.moveTo(990, 50); ctx.lineTo(950, 90); ctx.stroke();
      const hl = Wd('popup', 'PERSONAL').start;
      if (t >= hl) {
        const hp = E.outCubic(prog(t, hl, 0.35));
        ctx.fillStyle = 'rgba(255,221,64,0.8)'; ctx.fillRect(96, 128, 760 * hp, 58);
      }
      ctx.fillStyle = '#111'; ctx.font = font(46, 'NunitoBlack'); ctx.textBaseline = 'middle';
      ctx.fillText('LimeWire – Do Not Process', 100, 90); ctx.fillText('My Personal Information', 100, 156);
      ctx.fillStyle = '#D5D1C8';
      [880, 820, 860, 700, 840, 540].forEach((w, i) => { ctx.beginPath(); roundRectPath(ctx, 100, 225 + i * 44, w, 20, 10); ctx.fill(); });
      sticker(ctx, g => roundRectPath(g, 100, 510, 880, 150, 16), { fill: '#F6F4EF', outline: 0, shadow: 0 });
      ctx.fillStyle = '#222'; ctx.font = font(30, 'NunitoXB'); ctx.fillText('I want to opt-out of processing', 130, 560); ctx.fillText('my Personal Data', 130, 602);
      ctx.fillStyle = '#9A9A9A'; ctx.beginPath(); roundRectPath(ctx, 820, 555, 110, 58, 29); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(850, 584, 24, 0, Math.PI * 2); ctx.fill();
      U.button(ctx, 100, 700, 420, 80, 'CONFIRM', { fill: '#2C6FD1', size: 34, r: 8 });
      ctx.restore();
    }
    if (t >= dead) {
      const p = E.outBack(prog(t, dead, 0.35), 2);
      drawSpark(ctx, 430, 1130 + (1 - p) * 700, 190, t, { expr: 'deadpan', lookX: 0.6 });
      const np = E.outBack(prog(t, dead + 0.35, 0.3), 2);
      if (np > 0) {
        ctx.save(); ctx.translate(810, 1050); ctx.rotate(0.08); ctx.scale(np, np);
        sticker(ctx, g => g.rect(-150, -120, 300, 240), { fill: '#FFF08A', outline: 0, shadow: 0.25 });
        ctx.fillStyle = '#333'; ctx.font = font(40, 'Hand'); ctx.textAlign = 'center';
        ctx.fillText('my personal', 0, -60); ctx.fillText('information:', 0, -14);
        ctx.font = font(64, 'Hand'); ctx.fillText('(none)', 0, 66); ctx.textAlign = 'left';
        ctx.restore();
      }
    }
  }

  // ================================================================== 4. the wait
  function tumbleweed(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.strokeStyle = '#9C7A48'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    const r = mulberry32(8);
    for (let i = 0; i < 22; i++) {
      ctx.beginPath();
      const a = r() * 6.28, b = r() * 6.28;
      ctx.moveTo(Math.cos(a) * s * r(), Math.sin(a) * s * r());
      ctx.quadraticCurveTo(Math.cos((a + b) / 2) * s * 1.2, Math.sin((a + b) / 2) * s * 1.2, Math.cos(b) * s * r(), Math.sin(b) * s * r());
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, s, 0, 6.28); ctx.stroke();
    ctx.restore();
  }
  function cobweb(ctx, x, y, s, flip = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(flip, 1);
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
    for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); ctx.stroke(); }
    for (let k = 1; k <= 4; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2, r = s * k / 4.4; const px = Math.cos(a) * r, py = Math.sin(a) * r; if (i === 0) ctx.moveTo(px, py); else ctx.quadraticCurveTo(Math.cos(a - 0.15) * r * 0.85, Math.sin(a - 0.15) * r * 0.85, px, py); }
      ctx.stroke();
    }
    ctx.restore();
  }
  function sWait(ctx, t) {
    const clicks = evs('click'), nothing = ev('nothing'), spin = ev('clockspin'), skel = ev('skeleton');
    const st = L('waiting').start - 0.15;
    paperBG(ctx, '#EFE7D6', 0.22);
    const press = Math.max(...clicks.map(c => punch(t, c, 0.15)));
    U.button(ctx, 230, 380, 620, 160, '⬇  Download', { fill: '#2F9E44', size: 62, press });
    // hand pointer glides to the button
    const hp = E.inOutCubic(prog(t, st, clicks[0] - st));
    U.handPointer(ctx, lerp(1000, 590, hp), lerp(1400, 480, hp), 2.2, press);
    if (t >= clicks[0]) {
      ctx.save(); ctx.translate(540, 690); ctx.rotate(t * (t < nothing ? 6 : 1.2));
      ctx.strokeStyle = '#2F9E44'; ctx.lineWidth = 14; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 1.4); ctx.stroke(); ctx.restore();
      ctx.fillStyle = '#7A7263'; ctx.font = font(34, 'NunitoXB'); ctx.textAlign = 'center';
      ctx.fillText(t < nothing ? 'starting download…' : 'starting download… (still)', 540, 790); ctx.textAlign = 'left';
    }
    if (t >= spin) {
      const p = E.outBack(prog(t, spin, 0.3), 2);
      ctx.save(); ctx.translate(540, 1000); ctx.scale(p, p);
      sticker(ctx, g => { g.moveTo(170, 0); g.arc(0, 0, 170, 0, Math.PI * 2); }, { fill: '#FFFDF6', outline: 9, shadow: 0.25 });
      ctx.strokeStyle = '#333'; ctx.lineWidth = 6;
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 140, Math.sin(a) * 140); ctx.lineTo(Math.cos(a) * 155, Math.sin(a) * 155); ctx.stroke(); }
      const ang = (t - spin) * 22;
      ctx.lineCap = 'round';
      ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang / 12 - 1.57) * 80, Math.sin(ang / 12 - 1.57) * 80); ctx.stroke();
      ctx.strokeStyle = '#E0342F'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang - 1.57) * 125, Math.sin(ang - 1.57) * 125); ctx.stroke();
      ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, 6.28); ctx.fill();
      ctx.restore();
      const secs = Math.round(120 * clamp((t - spin) / (skel + 0.3 - spin)));
      outlinedText(ctx, `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, 540, 1225, { size: 80, fam: 'MonoXB', fill: '#fff', stroke: INK, lw: 14 });
    }
    // tumbleweed during the silence
    if (t >= nothing) {
      const p = (t - nothing) / 2.6;
      tumbleweed(ctx, lerp(1250, -250, p), 1290 - Math.abs(Math.sin(p * 9)) * 90, 70, -p * 14);
    }
    const dead = t >= skel;
    drawSpark(ctx, 880, 1300, 115, t, { expr: dead ? 'dead' : t >= nothing ? 'deadpan' : 'normal', lookX: -0.5, lookY: -1, gray: dead ? 0.55 * prog(t, skel, 0.3) : 0 });
    if (dead) {
      ctx.globalAlpha = prog(t, skel, 0.3);
      cobweb(ctx, 0, 0, 330); cobweb(ctx, W, 0, 300, -1); cobweb(ctx, 780, 1170, 150);
      ctx.globalAlpha = 1;
      desaturate(ctx, 0.5 * prog(t, skel, 0.3));
    }
  }

  // ================================================================== 5. the disguise
  function bouncer(ctx, x, y, s, t, { happy = false, squint = false, thumbs = 0 } = {}) {
    ctx.save(); ctx.translate(x, y);
    sticker(ctx, g => { g.ellipse(0, 0, s * 0.62, s * 0.78, 0, 0, Math.PI * 2); }, { fill: '#6CC24A', outline: s * 0.04, texture: 0.22 });
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-s * 0.22, -s * 0.35, s * 0.14, s * 0.24, -0.4, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#4E8F2A'; ctx.beginPath(); ctx.ellipse(0, -s * 0.8, s * 0.07, s * 0.06, 0, 0, 6.28); ctx.fill();
    // shades
    ctx.fillStyle = '#111';
    ctx.beginPath(); roundRectPath(ctx, -s * 0.44, -s * 0.34, s * 0.4, s * 0.2, s * 0.07); ctx.fill();
    ctx.beginPath(); roundRectPath(ctx, s * 0.04, -s * 0.34, s * 0.4, s * 0.2, s * 0.07); ctx.fill();
    ctx.fillRect(-s * 0.06, -s * 0.3, s * 0.12, s * 0.04);
    if (squint) { outlinedText(ctx, '?', s * 0.55, -s * 0.8, { size: s * 0.5, fam: 'Lucky', fill: '#FFD23F', stroke: INK }); }
    ctx.strokeStyle = '#1B3B0E'; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round';
    ctx.beginPath();
    if (happy) ctx.arc(0, -s * 0.02, s * 0.14, 0.15 * Math.PI, 0.85 * Math.PI); else { ctx.moveTo(-s * 0.13, s * 0.02); ctx.lineTo(s * 0.13, s * 0.02); }
    ctx.stroke();
    ctx.fillStyle = '#111'; ctx.fillRect(-s * 0.6, s * 0.2, s * 1.2, s * 0.2);
    ctx.fillStyle = '#fff'; ctx.font = font(s * 0.13, 'MontBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SECURITY', 0, s * 0.305);
    // crossed arms
    ctx.fillStyle = '#58A838'; ctx.strokeStyle = '#fffdf7'; ctx.lineWidth = s * 0.03;
    for (const d of [-1, 1]) { ctx.save(); ctx.rotate(d * 0.35); ctx.beginPath(); roundRectPath(ctx, -s * 0.55, s * 0.47, s * 1.1, s * 0.16, s * 0.08); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (thumbs > 0) U.emoji(ctx, '👍', s * 0.75, s * 0.1, s * 0.6, -0.2, thumbs);
    ctx.restore();
  }
  function sDisguise(ctx, t) {
    const st = L('robot').start - 0.2, tag = ev('nametag'), alarm = ev('alarm'), gl = ev('glasses'), ok = ev('worked');
    const zin = Math.max(E.inOutCubic(prog(t, tag - 0.1, 0.3)) * (1 - E.inOutCubic(prog(t, alarm - 0.15, 0.25))),
      E.inOutCubic(prog(t, gl + 0.1, 0.3)) * (1 - E.inOutCubic(prog(t, ok - 0.2, 0.25))));
    const zz = 1 + 0.75 * zin;
    ctx.save(); ctx.translate(540, 960); ctx.scale(zz, zz); ctx.translate(-lerp(540, 330, zin), -lerp(960, 1150, zin));
    ctx.fillStyle = '#2B1B4A'; ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.fillStyle = '#34225A';
    for (let row = 0; row < 26; row++) for (let c = -1; c < 8; c++) {
      ctx.beginPath(); roundRectPath(ctx, c * 160 + (row % 2) * 80 + 6, row * 60 + 6, 148, 48, 6); ctx.fill();
    }
    paperBG(ctx, 'rgba(0,0,0,0)', 0.25);
    ctx.fillStyle = '#1C1233'; ctx.fillRect(0, 1340, W, H - 1340);
    // door
    const open = E.inOutCubic(prog(t, ok + 0.1, 0.4));
    ctx.fillStyle = '#120A22'; ctx.fillRect(600, 560, 400, 780);
    if (open > 0) { const g = ctx.createLinearGradient(600, 0, 1000, 0); g.addColorStop(0, '#FFE8A3'); g.addColorStop(1, '#FFC857'); ctx.fillStyle = g; ctx.fillRect(600, 560, 400, 780); }
    sticker(ctx, g => g.rect(600, 560, 400 * (1 - open * 0.85), 780), { fill: '#5B3A2E', outline: 8, shadow: 0.3, texture: 0.3 });
    ctx.fillStyle = '#E8C15A'; ctx.beginPath(); ctx.arc(600 + 400 * (1 - open * 0.85) - 40, 960, 16, 0, 6.28); ctx.fill();
    // neon sign
    const alarmOn = t >= alarm && t < gl;
    const signTxt = t >= ok ? 'FILES ✓' : alarmOn ? 'BOT DETECTED' : 'FILES';
    ctx.save(); ctx.shadowColor = alarmOn ? '#FF3B3B' : '#FF5FD2'; ctx.shadowBlur = 30;
    outlinedText(ctx, signTxt, 800, 470, { size: alarmOn ? 74 : 96, fam: 'Lucky', fill: alarmOn ? '#FFD6D6' : '#FFE3F7', stroke: alarmOn ? '#FF3B3B' : '#FF5FD2', lw: 8, shadow: false });
    ctx.restore();
    // decrypted names banner
    if (t >= ok) {
      const p = E.outBack(prog(t, ok, 0.3), 1.8);
      ctx.save(); ctx.translate(540, 250); ctx.scale(p, p); ctx.rotate(-0.03);
      sticker(ctx, g => tornRectPath(g, -470, -130, 940, 260, 3, 8), { fill: '#FFFDF4', outline: 0, shadow: 0.35 });
      ctx.fillStyle = '#2F9E44'; ctx.font = font(34, 'NunitoBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🔓 decrypted:', 0, -80);
      ctx.fillStyle = '#111'; ctx.font = font(42, 'MonoXB');
      const dp = prog(t, ok + 0.1, 0.6);
      ctx.fillText(decode(DEC1, dp, Math.floor(t * 20)), 0, -20); ctx.fillText(decode(DEC2, dp - 0.1, Math.floor(t * 20) + 7), 0, 36);
      ctx.fillStyle = '#777'; ctx.font = font(32, 'Hand');
      if (dp >= 1) ctx.fillText('(still gibberish, but LEGAL gibberish)', 0, 92);
      ctx.restore();
      U.confetti(ctx, t, ok, { cy: 700, n: 60 });
    }
    // velvet rope
    ctx.strokeStyle = '#B3122E'; ctx.lineWidth = 16; ctx.lineCap = 'round';
    if (open < 0.5) { ctx.beginPath(); ctx.moveTo(480, 1150); ctx.quadraticCurveTo(620, 1260, 760, 1150); ctx.stroke(); }
    for (const px of [480, 760]) { ctx.fillStyle = '#D9A93A'; ctx.fillRect(px - 12, 1140, 24, 200); ctx.beginPath(); ctx.arc(px, 1135, 24, 0, 6.28); ctx.fill(); }
    bouncer(ctx, 800 + open * 220, 1010, 230, t, { happy: t >= ok, squint: t >= gl && t < ok, thumbs: t >= ok ? pop(t, ok + 0.2, 0.3) : 0 });
    // siren
    if (alarmOn) {
      const a = t * 9;
      ctx.save(); ctx.translate(800, 330);
      ctx.fillStyle = 'rgba(255,40,40,0.25)';
      for (const d of [0, Math.PI]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1400, a + d - 0.25, a + d + 0.25); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = `rgba(255,0,0,${0.18 * (0.5 + 0.5 * Math.sin(t * 25))})`; ctx.fillRect(0, 0, W, H);
    }
    // our hero
    const disguised = t >= gl;
    const gp = disguised ? 1 + 0.25 * punch(t, gl, 0.35) : 1;
    const tagObj = t < tag ? null : disguised ? { text: 'Mozilla/5.0', sub: '(a totally normal human)' } : { text: 'HeadlessChrome' };
    const expr = t >= ok ? 'happy' : disguised ? 'smug' : t >= alarm ? 'shock' : 'worried';
    const walk = E.outCubic(prog(t, st, 0.5));
    drawSpark(ctx, lerp(-150, 290, walk), 1080 + Math.abs(Math.sin(t * 7)) * 12 * (1 - walk), 165, t, { expr, glasses: disguised, tag: tagObj, sweat: t >= tag && !disguised, lookX: 0.8, scale: gp, squash: -0.1 * punch(t, gl, 0.3) });
    if (t >= gl && t < gl + 0.5) { U.sparkle(ctx, 200, 900, 50 * punch(t, gl, 0.5), t); U.sparkle(ctx, 400, 960, 36 * punch(t, gl, 0.5), -t); }
    ctx.restore();
  }

  // ================================================================== 6. the fake-out
  function pixelThumb(ctx, x, y, size) {
    // a 12x12 "thumbnail": orange spark on a purple night, badly downscaled
    const n = 12, c = size / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const dx = i - 5.5, dy = j - 6.5, d = Math.hypot(dx, dy);
      let col = j > 8 ? '#6B4E9B' : '#2E2A6B';
      if (d < 2.6 + 0.9 * Math.cos(Math.atan2(dy, dx) * 6)) col = d < 1.2 ? '#F09A74' : '#E07A55';
      if (i > 8 && j < 3) col = '#F2E6B8';
      const h = hash(i * 31 + j * 7);
      ctx.fillStyle = col; ctx.globalAlpha = 0.85 + h * 0.15;
      ctx.fillRect(x + i * c, y + j * c, c + 0.5, c + 0.5);
    }
    ctx.globalAlpha = 1;
  }
  function sFake(ctx, t) {
    const gs = L('gotfile').start, ge = L('gotfile').end, sc = ev('scratch2'), tiny = ev('tiny'), tromb = ev('trombone');
    if (t < sc) {
      sunburst(ctx, 540, 700, 18, '#FFD66B', '#FFC23D', t * 0.4);
      paperBG(ctx, 'rgba(0,0,0,0)', 0.2);
      const p = E.outBack(prog(t, gs - 0.2, 0.35), 1.6);
      ctx.save(); ctx.translate(540, 560); ctx.scale(p, p);
      sticker(ctx, g => roundRectPath(g, -440, -200, 880, 400, 30), { fill: '#FFFFFF', outline: 9, shadow: 0.25 });
      ctx.font = font(96, 'Emoji'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🎬', -330, -60);
      ctx.fillStyle = '#111'; ctx.font = font(40, 'MonoXB'); ctx.textAlign = 'left'; ctx.fillText(DEC2, -240, -80);
      const dl = E.inOutCubic(prog(t, gs, ge - gs));
      ctx.fillStyle = '#777'; ctx.font = font(32, 'NunitoXB'); ctx.fillText(dl < 1 ? `downloading… ${Math.round(dl * 100)}%` : 'download complete!', -240, -20);
      U.retroBar(ctx, -380, 60, 760, 70, dl);
      ctx.restore();
      const done = t >= ge;
      drawSpark(ctx, 540, 1150 - (done ? Math.abs(Math.sin((t - ge) * 12)) * 60 : 0), 180, t, { expr: done ? 'happy' : 'normal', lookY: -1 });
      U.confetti(ctx, t, ge, { cy: 900, n: 80, spread: 1100 });
      return;
    }
    // image viewer: the "file" is a tiny thumbnail
    ctx.fillStyle = '#26252B'; ctx.fillRect(0, 0, W, H);
    paperBG(ctx, 'rgba(0,0,0,0)', 0.2);
    const zp = E.inOutCubic(prog(t, tiny + 0.1, 0.5));
    const sag = E.outBack(prog(t, tromb, 0.5), 2);
    ctx.save();
    const s1 = shake(t, sc, 0.3, 20);
    ctx.translate(s1.x, s1.y);
    sticker(ctx, g => roundRectPath(g, 60, 230, 960, 900, 24), { fill: '#141418', outline: 8, shadow: 0.4 });
    ctx.fillStyle = '#2E2D35'; ctx.beginPath(); roundRectPath(ctx, 60, 230, 960, 76, 24); ctx.fill(); ctx.fillRect(60, 280, 960, 26);
    ctx.fillStyle = '#C9C6D2'; ctx.font = font(30, 'Mono'); ctx.textBaseline = 'middle'; ctx.fillText(DEC2 + ' — Preview', 100, 270);
    const size = lerp(64, 720, zp);
    ctx.save(); ctx.translate(540, 700); ctx.rotate(sag * 0.12); ctx.translate(0, sag * 30);
    ctx.imageSmoothingEnabled = false;
    pixelThumb(ctx, -size / 2, -size / 2, size);
    ctx.restore();
    ctx.fillStyle = '#9A97A6'; ctx.font = font(34, 'NunitoXB'); ctx.textAlign = 'center';
    ctx.fillText('256 × 256  ·  1,142 bytes', 540, 1085); ctx.textAlign = 'left';
    ctx.restore();
    if (t < tiny + 0.1) {
      // arrow pointing at the tiny image
      const a = pop(t, sc + 0.15, 0.3);
      outlinedText(ctx, 'the file ↓', 540, 560 + wob(t, 1, 5) * 8, { size: 64 * a, fam: 'Lucky', fill: '#FFD23F', stroke: INK });
    }
    desaturate(ctx, 0.7 * prog(t, tromb, 0.6));
    const mp = E.outBack(prog(t, tromb - 0.1, 0.4), 1.5);
    if (mp > 0) {
      drawSpark(ctx, 540, 1290 + (1 - mp) * 500, 125, t, { expr: 'sad', lookY: -0.5 });
      rainCloud(ctx, 540, 1050 + (1 - mp) * 500, 150, t);
    }
  }

  // ================================================================== 7. the heist montage
  function envelope(ctx, x, y, s, label) {
    ctx.save(); ctx.translate(x, y);
    sticker(ctx, g => g.rect(-s, -s * 0.62, s * 2, s * 1.24), { fill: '#FFFDF4', outline: 8, shadow: 0.3 });
    ctx.strokeStyle = '#C9BFA8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-s, -s * 0.62); ctx.lineTo(0, s * 0.1); ctx.lineTo(s, -s * 0.62); ctx.stroke();
    ctx.fillStyle = '#C62828'; ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.14, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#222'; ctx.font = font(s * 0.17, 'MonoXB'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, s * 0.42);
    ctx.restore();
  }
  function worker(ctx, x, y, s, t, happy) {
    ctx.save(); ctx.translate(x, y);
    const teeth = 10;
    sticker(ctx, g => {
      for (let i = 0; i < teeth * 2; i++) {
        const a = (i / (teeth * 2)) * Math.PI * 2 + t;
        const r = i % 2 ? s * 0.62 : s * 0.78;
        if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r); else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      g.closePath();
    }, { fill: '#8E9AAF', outline: s * 0.04, texture: 0.2 });
    ctx.fillStyle = '#B7C0D1'; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 6.28); ctx.fill();
    // hard hat
    ctx.fillStyle = '#F7C325'; ctx.beginPath(); ctx.arc(0, -s * 0.42, s * 0.42, Math.PI, 0); ctx.fill(); ctx.fillRect(-s * 0.58, -s * 0.46, s * 1.16, s * 0.1);
    ctx.fillStyle = INK;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * s * 0.17, -s * 0.05, s * 0.06, s * 0.08, 0, 0, 6.28); ctx.fill(); }
    ctx.strokeStyle = INK; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round';
    ctx.beginPath(); if (happy) ctx.arc(0, s * 0.1, s * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); else { ctx.moveTo(-s * 0.1, s * 0.18); ctx.lineTo(s * 0.1, s * 0.18); } ctx.stroke();
    ctx.restore();
  }
  const HEIST_BG = ['#A8F03A', '#E07A55', '#7B61FF', '#111111', '#FFD23F', '#2EC4B6', '#FF5FD2', '#111111', '#A8F03A', '#7B61FF', '#E07A55', '#2F9E44'];
  function sHeist(ctx, t) {
    const beats = CU.beats.heist, drop = ev('drop'), ts = ev('tapestop'), cnt = ev('counter'), done = ev('done');
    let i = 0;
    while (i + 1 < beats.length && t >= beats[i + 1]) i++;
    const bt = beats[i];
    const bg = HEIST_BG[i % HEIST_BG.length];
    const dark = bg === '#111111';
    const slow = t >= ts ? prog(t, ts, 0.45) : 0;
    sunburst(ctx, 540, 760, 16, bg, dark ? '#222' : 'rgba(255,255,255,0.22)', t * 0.8 * (1 - slow));
    paperBG(ctx, 'rgba(0,0,0,0)', 0.18);
    const z = 1 + 0.14 * punch(t, bt, 0.3);
    const s1 = shake(t, bt, 0.2, 14);
    ctx.save(); ctx.translate(540 + s1.x, 760 + s1.y); ctx.scale(z, z); ctx.rotate(wob(i, 3, 1) * 0.04); ctx.translate(-540, -760);
    const lt = t - bt;
    if (i === 0) {
      U.speedLines(ctx, t, 540, 760, { color: 'rgba(0,0,0,0.25)' });
      drawSpark(ctx, 540, 760, 230, t, { expr: 'smug', glasses: true, scale: 1 + 0.1 * punch(t, bt, 0.3) });
      outlinedText(ctx, 'PLAN B', 540, 420, { size: 170, fam: 'Lucky', fill: '#fff', stroke: INK });
    } else if (i === 1) {
      U.speedLines(ctx, t, 540, 760, { color: 'rgba(255,255,255,0.35)' });
      envelope(ctx, lerp(-200, 540, E.outCubic(clamp(lt / 0.2))), 760, 300, 'POST /sharing/download');
      outlinedText(ctx, 'dear API,', 540, 420, { size: 110, fam: 'Hand', fill: '#fff', stroke: INK });
    } else if (i === 2) {
      ctx.save(); ctx.translate(540, 760);
      sticker(ctx, g => roundRectPath(g, -230, -300, 460, 600, 30), { fill: '#3A3F4B', outline: 9, shadow: 0.35 });
      for (let k = 0; k < 4; k++) { ctx.fillStyle = '#2A2E37'; ctx.fillRect(-190, -250 + k * 130, 380, 100); ctx.fillStyle = k % 2 ? LIME : '#FFD23F'; ctx.beginPath(); ctx.arc(150, -200 + k * 130, 14, 0, 6.28); ctx.fill(); }
      ctx.restore();
      const sp = E.outBack(prog(t, bt + 0.08, 0.25), 3);
      ctx.save(); ctx.translate(560, 760); ctx.rotate(-0.2); ctx.scale(sp, sp);
      ctx.strokeStyle = '#2F9E44'; ctx.lineWidth = 16; ctx.strokeRect(-300, -90, 600, 180);
      outlinedText(ctx, '200 OK', 0, 6, { size: 150, fam: 'MontBlack', fill: '#2F9E44', stroke: '#fff', lw: 10, shadow: false });
      ctx.restore();
    } else if (i === 3) {
      const url = 'https://sp1.limewire.network/…/fda3b299?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Signature=566848b066da9133d19843ac22d68dfeadb36df2183b52f981e5621839ec3534';
      for (let k = 0; k < 5; k++) {
        const y = 480 + k * 140, off = ((t * 1400 + k * 380) % 2400);
        ctx.save(); ctx.translate(0, y); ctx.rotate(-0.08);
        sticker(ctx, g => g.rect(-100, -44, W + 200, 88), { fill: '#FFFDF4', outline: 0, shadow: 0.25 });
        ctx.fillStyle = '#1D4ED8'; ctx.font = font(40, 'Mono'); ctx.textBaseline = 'middle';
        ctx.fillText(url + '   ' + url, -off, 2);
        ctx.restore();
      }
      outlinedText(ctx, 'FULL FILE PLS', 540, 330, { size: 120, fam: 'Lucky', fill: '#fff', stroke: INK });
    } else if (i === 4 || i === 5 || i === 6) {
      const happy = i === 6;
      worker(ctx, 360, 820, 230, t * (i === 6 ? 4 : 1), happy);
      outlinedText(ctx, 'service worker', 360, 1110, { size: 64, fam: 'NunitoBlack', fill: '#fff', stroke: INK, lw: 12 });
      const kx = i === 4 ? 850 : lerp(850, 600, E.outCubic(clamp(lt / 0.3)));
      U.padlock(ctx, 800, 600, 170, i === 6 ? E.outBack(clamp(lt / 0.25), 3) : 0);
      if (i >= 5) {
        ctx.save(); ctx.translate(kx, 860); ctx.rotate(-0.5);
        ctx.fillStyle = '#F2B705'; ctx.strokeStyle = '#fffdf7'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(-90, 0, 46, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.fillRect(-50, -14, 170, 28); ctx.fillRect(90, 0, 18, 40); ctx.fillRect(60, 0, 18, 30);
        ctx.restore();
        outlinedText(ctx, '#Fz9WUXYtjV', 760, 1000, { size: 54, fam: 'MonoXB', fill: LIME, stroke: INK, lw: 10 });
      }
      if (i === 6) for (let k = 0; k < 8; k++) U.sparkle(ctx, 800 + Math.cos(k) * 190 * clamp(lt / 0.3), 600 + Math.sin(k) * 190 * clamp(lt / 0.3), 34, t * 3);
      if (i === 4) outlinedText(ctx, 'hire this guy', 540, 380, { size: 96, fam: 'Hand', fill: '#fff', stroke: INK });
    } else if (i >= 7 && t < done) {
      // bytes pouring out + counter
      const r = mulberry32(Math.floor(t * 15));
      ctx.fillStyle = dark ? LIME : '#111'; ctx.font = font(46, 'MonoXB');
      for (let k = 0; k < 70; k++) ctx.fillText(r() < 0.5 ? '0' : '1', r() * W, ((r() * H + t * 900 * (0.5 + r())) % H));
      const cp = E.outCubic(prog(t, beats[7], done - beats[7]));
      const n = Math.round(8005518 * cp);
      ctx.save(); ctx.translate(540, 760);
      sticker(ctx, g => roundRectPath(g, -470, -190, 940, 380, 30), { fill: '#FFFDF4', outline: 9, shadow: 0.3 });
      ctx.fillStyle = '#111'; ctx.font = font(116, 'MonoXB'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.toLocaleString('en-US'), 0, -50);
      ctx.fillStyle = '#777'; ctx.font = font(40, 'NunitoBlack'); ctx.fillText('bytes, decrypted', 0, 40);
      U.retroBar(ctx, -400, 90, 800, 60, cp);
      ctx.restore();
    } else {
      const cp = E.outBack(prog(t, done, 0.3), 2.5);
      ctx.save(); ctx.translate(540, 700); ctx.scale(cp, cp);
      outlinedText(ctx, '✅ 2 VIDEOS', 0, 0, { size: 150, fam: 'MontBlack', fill: '#fff', stroke: INK, maxW: 920 });
      ctx.restore();
      U.confetti(ctx, t, done, { cy: 700, n: 90, spread: 1200 });
    }
    ctx.restore();
    flash(ctx, t, drop, 0.25, '255,255,255', 0.9);
    if (slow > 0) { desaturate(ctx, slow); ctx.fillStyle = `rgba(0,0,0,${slow})`; ctx.fillRect(0, 0, W, H); }
  }

  // ================================================================== 8. the reveal
  function bedroom(ctx, t, turned) {
    ctx.fillStyle = '#2C2466'; ctx.fillRect(0, 0, W, H);
    sticker(ctx, g => g.rect(300, 180, 480, 420), { fill: '#141040', outline: 14, outlineColor: '#E9D8B5', shadow: 0.3 });
    ctx.fillStyle = '#F2E6B8'; ctx.beginPath(); ctx.arc(640, 300, 60, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#141040'; ctx.beginPath(); ctx.arc(615, 285, 55, 0, 6.28); ctx.fill();
    for (let k = 0; k < 9; k++) U.sparkle(ctx, 330 + hash(k) * 420, 210 + hash(k + 9) * 360, 10 + hash(k + 3) * 8, 0, '#F9E79F');
    sticker(ctx, g => roundRectPath(g, 140, 1000, 800, 400, 40), { fill: '#7A4E3A', outline: 8, shadow: 0.3 });
    sticker(ctx, g => roundRectPath(g, 200, 900, 680, 200, 60), { fill: '#EDE6F7', outline: 6, shadow: 0.2 });
    drawSpark(ctx, 540, 930, 190, t, { expr: turned ? 'shock' : 'normal', lookY: turned ? 0 : 1, wiggle: 0.5 });
    const quilt = ['#E58B8B', '#8BC6E5', '#F2C66D', '#9ED39A', '#C59BE8'];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) { ctx.fillStyle = quilt[(i + j * 2) % 5]; ctx.fillRect(150 + i * 130, 1060 + j * 110, 128, 108); }
    ctx.save(); ctx.translate(540, 1100); ctx.rotate(-0.1);
    sticker(ctx, g => roundRectPath(g, -60, -100, 120, 200, 18), { fill: '#222', outline: 5, shadow: 0.3 });
    ctx.fillStyle = 'rgba(160,200,255,0.25)'; ctx.beginPath(); ctx.moveTo(-60, -100); ctx.lineTo(-260, -500); ctx.lineTo(260, -500); ctx.lineTo(60, -100); ctx.fill();
    ctx.restore();
    outlinedText(ctx, '3:07 am', 540, 110, { size: 70, fam: 'Hand', fill: '#fff', stroke: '#1a1440', lw: 8 });
  }
  const off = C.createCanvas(W, H);
  function sReveal(ctx, t) {
    const st = L('aboutme').start - 0.3, me = ev('me');
    const turned = t >= me;
    ctx.fillStyle = '#0E0B24'; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) { ctx.fillStyle = `rgba(255,255,230,${0.3 + 0.5 * hash(k + 40)})`; ctx.beginPath(); ctx.arc(hash(k) * W, hash(k + 5) * H, 2 + hash(k + 7) * 3, 0, 6.28); ctx.fill(); }
    const push = 1 + 0.08 * E.inOutSine(prog(t, st, 2.2)) + 0.05 * punch(t, me, 0.4);
    ctx.save(); ctx.translate(540, 800); ctx.scale(push, push); ctx.translate(-540, -800);
    // the video player
    sticker(ctx, g => roundRectPath(g, 100, 220, 880, 1100, 30), { fill: '#000', outline: 10, shadow: 0.4 });
    const g2 = off.getContext('2d');
    g2.save(); bedroom(g2, t, turned); g2.restore();
    ctx.save(); ctx.beginPath(); roundRectPath(ctx, 120, 240, 840, 990, 20); ctx.clip();
    ctx.drawImage(off, 0, 0, W, H, 120, 240, 840, 840 * H / W);
    ctx.restore();
    ctx.fillStyle = '#333'; ctx.fillRect(140, 1262, 800, 10);
    ctx.fillStyle = '#FE2C55'; ctx.fillRect(140, 1262, 800 * clamp((t - st) / 3), 10);
    ctx.fillStyle = '#fff'; ctx.font = font(30, 'NunitoB'); ctx.fillText('claudes_fyp_final_FINAL.mp4', 140, 1294);
    ctx.restore();
    // us, watching
    const turn = E.outBack(prog(t, me, 0.3), 2);
    drawSpark(ctx, 190, 1330, 120, t, { expr: turned ? 'shock' : 'normal', lookX: turned ? 0 : 1, lookY: turned ? 0 : -1, scale: 1 + 0.15 * punch(t, me, 0.3) });
    if (turned) {
      outlinedText(ctx, '!', 330, 1150, { size: 150 * turn, fam: 'Lucky', fill: '#FFD23F', stroke: INK });
      ctx.fillStyle = `rgba(255,120,150,${0.25 * punch(t, me + 0.35, 0.5)})`; ctx.fillRect(0, 0, W, H);
    }
    const fin = prog(t, st, 0.3);
    if (fin < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fin})`; ctx.fillRect(0, 0, W, H); }
  }

  // ================================================================== 9. outro
  const SNIPPETS = ['vine_boom()', 'cowbell(F#5)', 'drawSpark()', 'phonk(130)', 'sad_trombone()', 'scramble()', 'pizz(A2)', 'decode()', 'render.js', 'synth.py'];
  function desk(ctx, t) {
    paperBG(ctx, '#F2D6B3', 0.25);
    const lamp = ctx.createRadialGradient(300, 300, 50, 300, 300, 1200);
    lamp.addColorStop(0, 'rgba(255,240,200,0.5)'); lamp.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
    // flying snippets
    const ts0 = L('makeown').start - 0.2;
    for (let k = 0; k < 14; k++) {
      const born = ts0 + k * 0.22;
      if (t < born) continue;
      const a = (t - born) / 1.6;
      if (a > 1) continue;
      const r = mulberry32(k * 13 + 1);
      const x = 540 + (r() - 0.5) * 900 * a, y = 760 - 700 * a;
      ctx.save(); ctx.globalAlpha = 1 - a; ctx.translate(x, y); ctx.rotate((r() - 0.5) * 0.4);
      sticker(ctx, g => roundRectPath(g, -150, -38, 300, 76, 14), { fill: '#1E1B18', outline: 4, shadow: 0.2 });
      ctx.fillStyle = [LIME, '#FFD23F', '#7FDBFF', ORANGE][k % 4]; ctx.font = font(32, 'Mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(SNIPPETS[k % SNIPPETS.length], 0, 2);
      ctx.restore();
    }
    // mascot typing behind the laptop
    drawSpark(ctx, 540, 820 + Math.abs(Math.sin(t * 16)) * 10, 170, t, { expr: 'happy', wiggle: 2.5 });
    sticker(ctx, g => g.rect(-40, 1180, W + 80, 800), { fill: '#A86B42', outline: 0, shadow: 0.2, texture: 0.35 });
    // laptop (back of screen facing us)
    sticker(ctx, g => roundRectPath(g, 250, 860, 580, 360, 26), { fill: '#C9CED6', outline: 8, shadow: 0.3 });
    ctx.fillStyle = '#E07A55'; ctx.save(); ctx.translate(540, 1040); drawTinySpark(ctx, 40); ctx.restore();
    sticker(ctx, g => roundRectPath(g, 190, 1210, 700, 40, 14), { fill: '#B4BAC4', outline: 6, shadow: 0.3 });
    // raspberry pi
    ctx.save(); ctx.translate(870, 1400); ctx.rotate(-0.08);
    sticker(ctx, g => roundRectPath(g, -150, -100, 300, 200, 16), { fill: '#2E8B3E', outline: 7, shadow: 0.3 });
    ctx.fillStyle = '#1C1C1C'; ctx.fillRect(-60, -40, 90, 90); ctx.fillStyle = '#C0C0C0'; ctx.fillRect(60, -70, 70, 50); ctx.fillRect(60, 10, 70, 50);
    ctx.fillStyle = '#D4AF37'; for (let k = 0; k < 14; k++) ctx.fillRect(-130 + k * 18, -92, 10, 10);
    ctx.fillStyle = Math.sin(t * 20) > 0 ? '#FF3B3B' : '#551111'; ctx.beginPath(); ctx.arc(-120, 70, 9, 0, 6.28); ctx.fill();
    ctx.fillStyle = Math.sin(t * 13) > 0 ? '#3BFF6B' : '#114411'; ctx.beginPath(); ctx.arc(-95, 70, 9, 0, 6.28); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.translate(820, 1290); ctx.rotate(0.12);
    sticker(ctx, g => roundRectPath(g, -95, -32, 190, 64, 10), { fill: '#FFF08A', outline: 0, shadow: 0.2 });
    ctx.fillStyle = '#333'; ctx.font = font(36, 'Hand'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('34 GB free', 0, 2);
    ctx.restore();
  }
  function drawTinySpark(ctx, s) {
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.beginPath(); roundRectPath(ctx, -s * 0.1, 0, s * 0.2, s, s * 0.1); ctx.fill(); ctx.restore(); }
  }
  const off2 = C.createCanvas(W, H);
  function sOutro(ctx, t) {
    const zo = ev('zoomout'), fin = ev('final');
    const g2 = off2.getContext('2d');
    g2.save(); desk(g2, t); g2.restore();
    const zp = E.inOutCubic(prog(t, zo - 0.1, 0.45));
    ctx.fillStyle = '#16131F'; ctx.fillRect(0, 0, W, H);
    if (zp <= 0) { ctx.drawImage(off2, 0, 0); return; }
    // zoom out: the desk becomes a video playing inside the app
    const s = lerp(1, 0.78, zp);
    ctx.save(); ctx.translate(540, 900); ctx.scale(s, s); ctx.translate(-540, -960);
    ctx.drawImage(off2, 0, 0);
    ctx.globalAlpha = zp;
    U.phoneUI(ctx, { handle: '@claude', caption: 'pov: limewire in 2026 🍋 #fyp', sound: 'original sound - claude', likes: '404K', comments: '2,026', saves: '47K', shares: '8M', progress: clamp((t - 0.0) / DUR) });
    ctx.restore();
    if (t >= fin) {
      flash(ctx, t, fin, 0.2);
      const p = E.outBack(prog(t, fin, 0.35), 2);
      ctx.fillStyle = `rgba(14,11,36,${0.8 * clamp(p)})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(540, 760); ctx.scale(p, p);
      outlinedText(ctx, 'every frame + every sound', 0, -60, { size: 66, fam: 'MontBlack', fill: '#fff', stroke: INK });
      outlinedText(ctx, 'made with code', 0, 30, { size: 96, fam: 'MontBlack', fill: LIME, stroke: INK });
      outlinedText(ctx, '(rendered on a raspberry pi)', 0, 120, { size: 50, fam: 'Hand', fill: '#fff', stroke: INK, lw: 8 });
      ctx.restore();
      drawSpark(ctx, 540, 1180, 120 * p, t, { expr: 'happy' });
    }
  }

  // ================================================================== timeline of scenes
  const SC = [
    { name: 'chat', start: 0, draw: sChat, capY: 1470 },
    { name: 'xp', start: ev('dialup') + 0.3, draw: sXP, capY: 1560 },
    { name: 'site', start: L('encrypted').start - 0.35, draw: sSite, capY: 1540 },
    { name: 'wait', start: L('waiting').start - 0.15, draw: sWait, capY: 1560 },
    { name: 'disguise', start: L('robot').start - 0.2, draw: sDisguise, capY: 1560 },
    { name: 'fakeout', start: L('gotfile').start - 0.2, draw: sFake, capY: 1560 },
    { name: 'heist', start: ev('drop'), draw: sHeist, capY: 1480 },
    { name: 'reveal', start: L('aboutme').start - 0.3, draw: sReveal, capY: 1560 },
    { name: 'outro', start: L('makeown').start - 0.2, draw: sOutro, capY: 1560 },
  ];
  function sceneAt(t) { let s = SC[0]; for (const x of SC) if (t >= x.start) s = x; return s; }

  function draw(ctx, t, frame) {
    const sc = sceneAt(t);
    sc.draw(ctx, t);
    // quick whip-flash between most scenes
    if (['wait', 'disguise', 'fakeout', 'outro'].includes(sc.name)) flash(ctx, t, sc.start, 0.12, '255,255,255', 0.5);
    const hideCap = sc.name === 'outro' && t >= ev('final') + 0.1;
    caps.draw(ctx, t, { y: sc.capY, hide: hideCap });
    C.finishFrame(ctx, frame, { grain: 0.06, vig: 0.8 });
  }
  return { duration: DUR, draw };
}

module.exports = { setup };
