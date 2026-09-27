// "does this spark joy?" — tidying up a Raspberry Pi. Every frame drawn in code.
const C = require('../../engine/js/core');
const U = require('../../engine/js/ui');
const { drawSpark } = require('../../engine/js/mascot');
const { Captions } = require('../../engine/js/captions');
const { W, H, E, clamp, lerp, prog, pop, punch, wob, shake, sticker, roundRectPath, tornRectPath, paperBG, sunburst, outlinedText, font, mulberry32, hash } = C;

const LIME = '#A8F03A', ORANGE = '#E07A55', INK = '#1E1B18', RED = '#E0342F', PCB = '#2E8B3E';

function desaturate(ctx, amt) {
  if (amt <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = clamp(amt); ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function flash(ctx, t, t0, d = 0.18, color = '255,255,255', a = 0.8) {
  const k = punch(t, t0, d);
  if (k > 0) { ctx.fillStyle = `rgba(${color},${a * k})`; ctx.fillRect(0, 0, W, H); }
}
function label(ctx, text, x, y, { size = 40, fam = 'NunitoBlack', fill = '#FFFDF4', color = INK, rot = 0, scale = 1, pad = 26 } = {}) {
  if (scale <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.font = font(size, fam);
  const w = ctx.measureText(text).width + pad * 2, h = size * 1.6;
  sticker(ctx, g => roundRectPath(g, -w / 2, -h / 2, w, h, h * 0.3), { fill, outline: 6, shadow: 0.25 });
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 3);
  ctx.restore();
}

// ------------------------------------------------------------------ characters
function piBoard(ctx, x, y, s, t, { mood = 'ok', shakeAmt = 0, squash = 0 } = {}) {
  ctx.save();
  ctx.translate(x + wob(t * 8, 1, 6) * shakeAmt, y + wob(t * 8, 2, 6) * shakeAmt);
  ctx.scale(1 + squash, 1 - squash);
  const w = s * 1.5, h = s;
  sticker(ctx, g => roundRectPath(g, -w / 2, -h / 2, w, h, s * 0.08), { fill: mood === 'stressed' ? '#3E8E3A' : PCB, outline: s * 0.04, texture: 0.25 });
  // mounting holes
  ctx.fillStyle = '#D4AF37';
  for (const [hx, hy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(hx * (w / 2 - s * 0.09), hy * (h / 2 - s * 0.09), s * 0.045, 0, 6.28); ctx.fill(); }
  // GPIO header
  ctx.fillStyle = '#1A1A1A'; ctx.fillRect(-w / 2 + s * 0.22, -h / 2 + s * 0.05, w - s * 0.44, s * 0.1);
  ctx.fillStyle = '#D4AF37';
  for (let i = 0; i < 18; i++) ctx.fillRect(-w / 2 + s * 0.25 + i * (w - s * 0.5) / 18, -h / 2 + s * 0.075, s * 0.03, s * 0.05);
  // ports
  ctx.fillStyle = '#C8CCD2';
  ctx.fillRect(w / 2 - s * 0.12, -s * 0.3, s * 0.2, s * 0.22); ctx.fillRect(w / 2 - s * 0.12, s * 0.02, s * 0.2, s * 0.22);
  // small chips
  ctx.fillStyle = '#222';
  ctx.fillRect(s * 0.25, -s * 0.2, s * 0.2, s * 0.14); ctx.fillRect(s * 0.25, s * 0.12, s * 0.16, s * 0.16);
  // SoC with a face
  const cx = -s * 0.18, cy = s * 0.05, cs = s * 0.5;
  sticker(ctx, g => roundRectPath(g, cx - cs / 2, cy - cs / 2, cs, cs, s * 0.04), { fill: '#2D2D33', outline: 0, shadow: 0.3, sx: 3, sy: 4, texture: 0 });
  ctx.fillStyle = '#44444C'; ctx.fillRect(cx - cs * 0.38, cy - cs * 0.38, cs * 0.76, cs * 0.76);
  const ey = cy - cs * 0.08, ex = cs * 0.18;
  if (mood === 'happy') {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + d * ex, ey + s * 0.02, s * 0.04, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(cx, cy + cs * 0.12, s * 0.07, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  } else {
    for (const d of [-1, 1]) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx + d * ex, ey, s * 0.055, s * (mood === 'stressed' ? 0.075 : 0.06), 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(cx + d * ex, ey + s * 0.01, s * (mood === 'stressed' ? 0.018 : 0.028), 0, 6.28); ctx.fill();
    }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.025; ctx.lineCap = 'round'; ctx.beginPath();
    if (mood === 'stressed') { ctx.moveTo(cx - s * 0.08, cy + cs * 0.2); for (let i = 1; i <= 4; i++) ctx.lineTo(cx - s * 0.08 + i * s * 0.04, cy + cs * 0.2 + (i % 2 ? -1 : 1) * s * 0.02); }
    else ctx.arc(cx, cy + cs * 0.1, s * 0.05, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
  if (mood === 'stressed') {
    ctx.fillStyle = '#7CC6F2';
    for (const [dx, dy, k] of [[-0.62, -0.45, 1], [0.5, -0.55, 0.8]]) {
      const yy = dy * s + ((t * 1.5 + k) % 1) * s * 0.3;
      ctx.beginPath(); ctx.moveTo(dx * s, yy - s * 0.08); ctx.quadraticCurveTo(dx * s + s * 0.06, yy + s * 0.03, dx * s, yy + s * 0.04); ctx.quadraticCurveTo(dx * s - s * 0.06, yy + s * 0.03, dx * s, yy - s * 0.08); ctx.fill();
    }
  }
  // status LEDs
  ctx.fillStyle = Math.sin(t * (mood === 'stressed' ? 40 : 12)) > 0 ? '#FF4040' : '#661111'; ctx.beginPath(); ctx.arc(-w / 2 + s * 0.12, h / 2 - s * 0.2, s * 0.03, 0, 6.28); ctx.fill();
  ctx.fillStyle = '#3BFF6B'; ctx.beginPath(); ctx.arc(-w / 2 + s * 0.2, h / 2 - s * 0.2, s * 0.03, 0, 6.28); ctx.fill();
  ctx.restore();
}

function llamaChar(ctx, x, y, s, t, { mouth = 0, look = 0, smug = false, wetFace = false } = {}) {
  ctx.save(); ctx.translate(x, y);
  const fluff = (g, cx, cy, rx, ry, n = 14) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
      g.moveTo(px + s * 0.09, py); g.arc(px, py, s * 0.09, 0, Math.PI * 2);
    }
    g.moveTo(cx + rx, cy); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  };
  // legs
  ctx.fillStyle = '#E8DCC6';
  for (const lx of [-0.35, -0.15, 0.2, 0.38]) sticker(ctx, g => roundRectPath(g, lx * s - s * 0.06, s * 0.2, s * 0.12, s * 0.45, s * 0.05), { fill: '#EFE4CF', outline: s * 0.02, shadow: 0.15, texture: 0.15 });
  // body + neck
  sticker(ctx, g => { fluff(g, 0, 0, s * 0.5, s * 0.3); g.moveTo(s * 0.45, -s * 0.1); roundRectPath(g, s * 0.2, -s * 0.85, s * 0.26, s * 0.9, s * 0.13); }, { fill: '#F4EBDA', outline: s * 0.03, texture: 0.2 });
  // head
  const hx = s * 0.36 + look * s * 0.05, hy = -s * 0.92;
  sticker(ctx, g => {
    g.moveTo(hx - s * 0.12, hy - s * 0.12); g.ellipse(hx - s * 0.1, hy - s * 0.2, s * 0.05, s * 0.12, -0.3, 0, Math.PI * 2);
    g.moveTo(hx + s * 0.14, hy - s * 0.12); g.ellipse(hx + s * 0.12, hy - s * 0.2, s * 0.05, s * 0.12, 0.3, 0, Math.PI * 2);
    g.moveTo(hx + s * 0.2, hy); g.ellipse(hx, hy, s * 0.2, s * 0.16, 0, 0, Math.PI * 2);
    g.moveTo(hx + s * 0.28, hy + s * 0.1); g.ellipse(hx + s * 0.12, hy + s * 0.1, s * 0.16, s * 0.1, 0, 0, Math.PI * 2);
  }, { fill: '#F4EBDA', outline: s * 0.03, texture: 0.2 });
  ctx.fillStyle = '#F7B6B6'; ctx.beginPath(); ctx.ellipse(hx - s * 0.1, hy - s * 0.2, s * 0.02, s * 0.07, -0.3, 0, 6.28); ctx.fill();
  // eyes: half-lidded judging
  for (const d of [-1, 1]) {
    const ex = hx + d * s * 0.08 - s * 0.02, ey = hy - s * 0.03;
    ctx.fillStyle = '#1A1A1A'; ctx.beginPath(); ctx.ellipse(ex, ey, s * 0.03, s * 0.035, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#F4EBDA'; ctx.fillRect(ex - s * 0.04, ey - s * 0.05, s * 0.08, smug ? s * 0.035 : s * 0.028);
    ctx.strokeStyle = '#1A1A1A'; ctx.lineWidth = s * 0.012; ctx.beginPath(); ctx.moveTo(ex - s * 0.035, ey - s * 0.02 + (smug ? s * 0.012 : 0)); ctx.lineTo(ex + s * 0.035, ey - s * 0.02 + (smug ? s * 0.012 : 0)); ctx.stroke();
  }
  // snout + mouth (chewing)
  ctx.fillStyle = '#6B4F3A'; ctx.beginPath(); ctx.ellipse(hx + s * 0.2, hy + s * 0.06, s * 0.012, s * 0.02, 0, 0, 6.28); ctx.fill();
  const chew = mouth > 0 ? mouth : 0.3 + 0.3 * Math.sin(t * 9);
  ctx.strokeStyle = '#6B4F3A'; ctx.lineWidth = s * 0.018; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(hx + s * 0.16, hy + s * 0.14, s * 0.06, s * 0.012 + s * 0.035 * chew, 0, 0, Math.PI); ctx.stroke();
  if (smug) U.emoji(ctx, '😤', hx + s * 0.35, hy - s * 0.25, s * 0.2, 0, 1);
  ctx.restore();
}

function folderIcon(ctx, x, y, w, name, { rot = 0, scale = 1, color = '#F5C451' } = {}) {
  if (scale <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  const h = w * 0.72;
  sticker(ctx, g => { g.moveTo(-w / 2, -h / 2 + w * 0.08); g.lineTo(-w / 2, -h / 2 - w * 0.02); g.lineTo(-w / 2 + w * 0.34, -h / 2 - w * 0.02); g.lineTo(-w / 2 + w * 0.42, -h / 2 + w * 0.06); g.lineTo(w / 2, -h / 2 + w * 0.06); g.lineTo(w / 2, h / 2); g.lineTo(-w / 2, h / 2); g.closePath(); }, { fill: color, outline: w * 0.035, texture: 0.2 });
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w / 2 + w * 0.04, -h / 2 + w * 0.14, w * 0.92, w * 0.04);
  if (name) {
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let fs = w * 0.16; ctx.font = font(fs, 'MonoXB');
    const m = ctx.measureText(name).width; if (m > w * 0.9) { fs *= w * 0.9 / m; ctx.font = font(fs, 'MonoXB'); }
    ctx.fillText(name, 0, h * 0.12);
  }
  ctx.restore();
}

function jsonSheet(ctx, x, y, w, rot, seed) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const h = w * 1.3;
  sticker(ctx, g => g.rect(-w / 2, -h / 2, w, h), { fill: '#FFFDF4', outline: 0, shadow: 0.18, sx: 3, sy: 4, texture: 0.25 });
  ctx.fillStyle = '#B08A2E'; ctx.font = font(w * 0.22, 'MonoXB'); ctx.textBaseline = 'middle';
  ctx.fillText('{', -w * 0.4, -h * 0.34);
  const r = mulberry32(seed);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = ['#C9C2B0', '#8FB3D9', '#D9A38F'][i % 3]; ctx.fillRect(-w * 0.3, -h * 0.2 + i * h * 0.1, w * (0.3 + r() * 0.4), h * 0.04); }
  ctx.fillStyle = '#B08A2E'; ctx.fillText('}', -w * 0.4, h * 0.36);
  ctx.restore();
}

function box(ctx, x, y, w, name, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const h = w * 0.75;
  sticker(ctx, g => g.rect(-w / 2, -h / 2, w, h), { fill: '#C9955B', outline: w * 0.03, texture: 0.3 });
  ctx.fillStyle = '#B07E45'; ctx.fillRect(-w * 0.08, -h / 2, w * 0.16, h);
  ctx.fillStyle = '#FFFDF4'; ctx.fillRect(-w * 0.38, -h * 0.12, w * 0.76, h * 0.34);
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = w * 0.14; ctx.font = font(fs, 'MonoXB');
  const m = ctx.measureText(name).width; if (m > w * 0.7) { fs *= w * 0.7 / m; ctx.font = font(fs, 'MonoXB'); }
  ctx.fillText(name, 0, h * 0.05);
  ctx.restore();
}

function diskBar(ctx, x, y, w, h, p, { showPct = true, big = true } = {}) {
  sticker(ctx, g => roundRectPath(g, x, y, w, h, h / 2), { fill: '#2A2622', outline: 7, shadow: 0.3 });
  const iw = (w - 16) * clamp(p);
  const col = p > 0.9 ? RED : p > 0.8 ? '#F2A33A' : '#3BBF5B';
  if (iw > 0) {
    ctx.fillStyle = col; ctx.beginPath(); roundRectPath(ctx, x + 8, y + 8, Math.max(iw, h - 16), h - 16, (h - 16) / 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 20, y + 14, Math.max(0, iw - 30), (h - 16) * 0.22);
  }
  if (showPct) outlinedText(ctx, `${Math.round(p * 100)}%`, x + w / 2, y + h / 2 + 2, { size: h * (big ? 0.62 : 0.5), fam: 'MontBlack', fill: '#fff', stroke: INK, lw: h * 0.1 });
}

function noJoyStamp(ctx, t, t0) {
  if (t < t0) return;
  const p = prog(t, t0, 0.18);
  const s = lerp(2.6, 1, E.outCubic(p));
  ctx.save(); ctx.translate(540, 700); ctx.rotate(-0.22); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3) * 0.92;
  ctx.strokeStyle = RED; ctx.lineWidth = 22;
  ctx.beginPath(); roundRectPath(ctx, -390, -130, 780, 260, 26); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); roundRectPath(ctx, -360, -100, 720, 200, 16); ctx.stroke();
  ctx.fillStyle = RED; ctx.font = font(170, 'MontBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NO JOY', 0, 10);
  // worn-ink speckle
  ctx.globalCompositeOperation = 'destination-out';
  const r = mulberry32(77);
  for (let i = 0; i < 160; i++) { ctx.beginPath(); ctx.arc((r() - 0.5) * 780, (r() - 0.5) * 260, 2 + r() * 6, 0, 6.28); ctx.fill(); }
  ctx.restore();
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

  // ================================================================== 1. df -h
  function sDF(ctx, t) {
    const full = ev('full'), skull = ev('skull');
    paperBG(ctx, '#1C1916', 0.3);
    const gr = ctx.createRadialGradient(540, 700, 50, 540, 700, 1000);
    const alarmK = t >= full ? 0.5 + 0.5 * Math.sin((t - full) * 18) : 0;
    gr.addColorStop(0, t >= full ? `rgba(224,52,47,${0.25 + 0.2 * alarmK})` : 'rgba(224,122,85,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const s1 = shake(t, full, 0.5, 30);
    const z = 1 + 0.08 * punch(t, full, 0.45);
    ctx.save(); ctx.translate(540 + s1.x, 800 + s1.y); ctx.scale(z, z); ctx.translate(-540, -800);
    const b = U.terminalCard(ctx, 40, 230, 1000, 520, 'claude — ~');
    ctx.textBaseline = 'middle';
    ctx.font = font(38, 'Mono'); ctx.fillStyle = '#8A8178'; ctx.fillText('>', b.x, b.y + 10);
    ctx.fillStyle = '#F2EDE6'; ctx.fillText('how much storage is left on', b.x + 46, b.y + 10); ctx.fillText('this raspberry pi?', b.x + 46, b.y + 60);
    if (t > 0.9) { ctx.fillStyle = '#9C948A'; ctx.font = font(34, 'Mono'); ctx.fillText('⏺ Bash(df -h)', b.x, b.y + 140); }
    if (t > 1.5) {
      ctx.font = font(27, 'Mono'); ctx.fillStyle = '#8A8178';
      ctx.fillText('Filesystem      Size Used Avail Use%', b.x + 30, b.y + 200);
      ctx.fillStyle = '#F2EDE6'; ctx.fillText('/dev/mmcblk0p2  117G 104G  7.0G', b.x + 30, b.y + 244);
      const hot = t >= full;
      ctx.fillStyle = hot ? '#FF5A52' : '#F2EDE6'; ctx.font = font(hot ? 34 : 27, 'MonoXB');
      ctx.fillText('94%', b.x + 30 + ctx.measureText('/dev/mmcblk0p2  117G 104G  7.0G ').width * (hot ? 27 / 34 : 1), b.y + 244);
    }
    ctx.restore();
    // usage bar
    const bp = 0.94 * E.inOutCubic(prog(t, 1.7, full - 1.7));
    const bs = 1 + 0.12 * punch(t, full, 0.4);
    ctx.save(); ctx.translate(540 + s1.x, 900); ctx.scale(bs, bs); ctx.translate(-540, -900);
    diskBar(ctx, 70, 850, 940, 110, bp);
    ctx.restore();
    piBoard(ctx, 540, 1200, 230, t, { mood: t >= full ? 'stressed' : 'ok', shakeAmt: t >= full ? 10 : 0, squash: -0.08 * punch(t, full, 0.4) + (t >= full ? 0.03 * Math.sin(t * 20) : 0) });
    // storage banner
    const bin = E.outBack(prog(t, 0.0, 0.35), 1.3) * (1 - E.inCubic(prog(t, 1.9, 0.3)));
    if (bin > 0.001) {
      ctx.save(); ctx.translate(0, lerp(-260, 40, bin));
      sticker(ctx, g => roundRectPath(g, 40, 0, 1000, 170, 40), { fill: 'rgba(245,242,236,0.97)', outline: 4, shadow: 0.3 });
      ctx.fillStyle = '#E0342F'; ctx.beginPath(); roundRectPath(ctx, 72, 38, 90, 90, 22); ctx.fill();
      U.emoji(ctx, '💾', 117, 84, 56);
      ctx.fillStyle = '#111'; ctx.font = font(38, 'NunitoBlack'); ctx.textBaseline = 'middle'; ctx.fillText('Storage Almost Full', 190, 62);
      ctx.fillStyle = '#555'; ctx.font = font(30, 'NunitoB'); ctx.fillText('raspberrypi · 7.0 GB left', 190, 110);
      ctx.fillStyle = '#999'; ctx.font = font(26, 'NunitoB'); ctx.fillText('now', 950, 62);
      ctx.restore();
    }
    if (t >= skull) U.emoji(ctx, '💀', 540 + s1.x, 560, 380, wob(t, 3, 2) * 0.12, E.outBack(prog(t, skull, 0.3), 2.5));
  }

  // ================================================================== 2. the show
  const FOLDERS = ['data/', 'Desktop/', 'Downloads/', '.local/', '/tmp', 'CPJourney/', '/var/log', '.npm/'];
  function sShow(ctx, t) {
    const st = L('method').start - 0.15, sj = ev('sparkjoy');
    sunburst(ctx, 540, 900, 20, '#FFE3E8', '#FFD1DA', t * 0.25);
    paperBG(ctx, 'rgba(0,0,0,0)', 0.22);
    // title card
    const tp = E.outBack(prog(t, st, 0.4), 1.8);
    ctx.save(); ctx.translate(540, 330); ctx.rotate(-0.04 + wob(t, 1, 0.5) * 0.02); ctx.scale(tp, tp);
    sticker(ctx, g => roundRectPath(g, -420, -150, 840, 300, 40), { fill: '#FFFDF7', outline: 10, shadow: 0.25 });
    ctx.fillStyle = '#2B2B2B'; ctx.font = font(122, 'Lucky'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TIDYING UP', 0, -30);
    ctx.fillStyle = ORANGE; ctx.font = font(78, 'Hand'); ctx.fillText('with claude ✨', 0, 72);
    ctx.restore();
    // orbiting folders
    const orbit = E.outCubic(prog(t, st + 0.3, 0.6));
    const lift = t >= sj;
    FOLDERS.forEach((nm, i) => {
      const a = (i / FOLDERS.length) * Math.PI * 2 + t * 0.9;
      const r = 330 * orbit;
      const fx = 540 + Math.cos(a) * r, fy = 1020 + Math.sin(a) * r * 0.55;
      if (lift && i === 0) return;
      folderIcon(ctx, fx, fy, 170, nm, { rot: Math.sin(a) * 0.15, scale: orbit * (0.85 + 0.15 * Math.sin(a)) });
    });
    const sp = E.outBack(prog(t, st + 0.1, 0.4), 2);
    drawSpark(ctx, 540, 1040, 170 * sp, t, { expr: lift ? 'happy' : 'normal', lookY: lift ? 0 : -0.5 });
    if (lift) {
      const lp_ = E.outBack(prog(t, sj, 0.35), 2);
      ctx.save(); ctx.globalAlpha = 0.5 * clamp(lp_);
      const halo = ctx.createRadialGradient(540, 760, 20, 540, 760, 360);
      halo.addColorStop(0, 'rgba(255,240,150,0.9)'); halo.addColorStop(1, 'rgba(255,240,150,0)');
      ctx.fillStyle = halo; ctx.fillRect(0, 300, W, 900); ctx.restore();
      folderIcon(ctx, 540, lerp(1000, 760, lp_), 210, 'data/', { rot: wob(t, 4, 2) * 0.05 });
      for (let k = 0; k < 7; k++) U.sparkle(ctx, 540 + Math.cos(k * 0.9 + t) * 230, 760 + Math.sin(k * 1.3 + t) * 150, 26 + 14 * Math.sin(t * 6 + k), t * 2 + k, '#FFD84D');
    }
  }

  // ================================================================== 3. the JSON attic
  function sJSON(ctx, t) {
    const st = L('json').start - 0.2, dust = ev('dust'), stamp = ev('stamp', 0), disc = ev('discard', 0);  // discard = stamp + 0.35
    paperBG(ctx, '#5B4636', 0.3);
    ctx.fillStyle = '#4A382B'; ctx.fillRect(0, 1320, W, H - 1320);
    const s1 = shake(t, stamp, 0.35, 22);
    ctx.save(); ctx.translate(s1.x, s1.y);
    // calendar
    ctx.save(); ctx.translate(840, 380); ctx.rotate(0.06);
    sticker(ctx, g => g.rect(-120, -140, 240, 280), { fill: '#FFFDF4', outline: 0, shadow: 0.3 });
    ctx.fillStyle = RED; ctx.fillRect(-120, -140, 240, 70);
    ctx.fillStyle = '#fff'; ctx.font = font(44, 'NunitoBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('JAN', 0, -104);
    ctx.fillStyle = INK; ctx.font = font(96, 'MontBlack'); ctx.fillText('2024', 0, 10);
    ctx.font = font(26, 'Hand'); ctx.fillStyle = '#777'; ctx.fillText('(last opened)', 0, 90);
    ctx.restore();
    // piles
    const piles = [[150, 12], [330, 16], [520, 20], [720, 14], [910, 10]];
    piles.forEach(([px, n], pi) => {
      for (let k = 0; k < n; k++) {
        const r = hash(pi * 50 + k);
        jsonSheet(ctx, px + (r - 0.5) * 40, 1300 - k * 52, 150, (r - 0.5) * 0.3, pi * 50 + k);
      }
    });
    // dust motes
    ctx.fillStyle = 'rgba(255,240,210,0.5)';
    for (let k = 0; k < 40; k++) { const x = (hash(k) * W + t * 20 * (hash(k + 3) - 0.5)) % W, y = (hash(k + 9) * 1300 + t * 15) % 1300; ctx.beginPath(); ctx.arc(x, y, 2 + hash(k + 1) * 3, 0, 6.28); ctx.fill(); }
    if (t >= dust) {
      const p = prog(t, dust, 1.0);
      ctx.fillStyle = `rgba(210,195,170,${0.5 * (1 - p)})`;
      for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.arc(520 + Math.cos(k) * 260 * p, 700 + Math.sin(k * 1.7) * 160 * p, 70 + 80 * p, 0, 6.28); ctx.fill(); }
    }
    ctx.restore();
    label(ctx, 'search_results/  ·  256,888 files  ·  17.7 GB', 540, 170, { size: 34, fam: 'MonoXB', scale: E.outBack(prog(t, st + 0.2, 0.3), 2) });
    // spark inspecting one page
    const judged = t >= stamp;
    drawSpark(ctx, 300, 1400, 140, t, { expr: judged ? 'deadpan' : t >= dust ? 'worried' : 'normal', lookX: 0.8, lookY: -0.5 });
    jsonSheet(ctx, 440, 1310 + Math.sin(t * 3) * 6, 120, 0.2, 999);
    noJoyStamp(ctx, t, stamp);
    if (t >= disc) {
      const p = E.outBack(prog(t, disc, 0.3), 2);
      ctx.save(); ctx.translate(760, 1000); ctx.rotate(0.1); ctx.scale(p, p);
      sticker(ctx, g => g.rect(-170, -90, 340, 180), { fill: '#FFF08A', outline: 0, shadow: 0.3 });
      ctx.fillStyle = '#333'; ctx.font = font(44, 'Hand'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('saving this one', 0, -25); ctx.fillText('for later 😈', 0, 32);
      ctx.restore();
    }
  }

  // ================================================================== 4. the packages
  const PKGS = ['left-pad', 'is-odd', 'is-even', 'lodash', 'is-number', 'moment', 'request', 'colors', 'react@16', 'node-sass', 'leftest-pad', 'is-thirteen', 'webpack@4', 'jquery', 'babel-core', 'uuid', 'chalk', 'rimraf'];
  function sPkgs(ctx, t) {
    const st = L('pkgs').start - 0.2, stamp = ev('stamp', 1), disc = ev('discard', 1);
    paperBG(ctx, '#DCC9A8', 0.28);
    const s1 = shake(t, stamp, 0.35, 22);
    const suck = E.inCubic(prog(t, disc, 0.7));
    const bhx = 540, bhy = 760;
    if (t >= disc - 0.1) {
      const bp = E.outBack(prog(t, disc - 0.1, 0.3), 1.5);
      ctx.save(); ctx.translate(bhx, bhy); ctx.rotate(t * 3);
      for (let k = 5; k >= 0; k--) {
        ctx.fillStyle = ['#000', '#1A0B2E', '#35105C', '#5C1F8A', '#8A3FC2', '#C79BFF'][k];
        ctx.beginPath(); ctx.ellipse(0, 0, bp * (120 + k * 40), bp * (120 + k * 40) * 0.92, k * 0.4, 0, 6.28); ctx.globalAlpha = k === 0 ? 1 : 0.5; ctx.fill();
      }
      ctx.restore(); ctx.globalAlpha = 1;
      label(ctx, 'pnpm store prune', bhx, bhy + 330, { size: 42, fam: 'MonoXB', fill: '#1E1B18', color: LIME, scale: bp });
    }
    ctx.save(); ctx.translate(s1.x, s1.y);
    const r = mulberry32(21);
    for (let k = 0; k < 34; k++) {
      const col = k % 6, row = Math.floor(k / 6);
      let x = 110 + col * 172 + (r() - 0.5) * 40, y = 1300 - row * 132 + (r() - 0.5) * 20;
      let rot = (r() - 0.5) * 0.3, sc = 1;
      if (suck > 0) {
        const d = clamp(suck * (1.2 + r() * 0.8) - r() * 0.3);
        const ang = Math.atan2(y - bhy, x - bhx) + d * 4;
        const rad = Math.hypot(x - bhx, y - bhy) * (1 - d);
        x = bhx + Math.cos(ang) * rad; y = bhy + Math.sin(ang) * rad; rot += d * 8; sc = 1 - d;
        if (sc <= 0.02) continue;
      }
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
      box(ctx, 0, 0, 160, PKGS[k % PKGS.length], rot);
      ctx.restore();
    }
    ctx.restore();
    const cnt = t < disc ? 1802 : Math.round(1802 * (1 - suck));
    label(ctx, `unused packages: ${cnt.toLocaleString('en-US')}  ·  ${t < disc ? '6.8 GB' : (6.8 * (1 - suck)).toFixed(1) + ' GB'}`, 540, 170, { size: 38, fam: 'MonoXB', scale: E.outBack(prog(t, st + 0.1, 0.3), 2) });
    drawSpark(ctx, 900, 1480, 120, t, { expr: t >= stamp ? 'deadpan' : 'worried', lookX: -0.8, lookY: -0.6 });
    noJoyStamp(ctx, t, stamp);
    if (t >= disc) ctx.globalAlpha = 1;
  }

  // ================================================================== 5. the llama
  function sLlama(ctx, t) {
    const st = L('llama').start + 0.1, lt = ev('llama'), guard = ev('guard'), spit = ev('spit');
    paperBG(ctx, '#C9D6E3', 0.25);
    ctx.fillStyle = '#AFC0D2'; ctx.fillRect(0, 1250, W, H - 1250);
    label(ctx, '/tmp', 140, 170, { size: 54, fam: 'MonoXB' });
    folderIcon(ctx, 640, 1150, 560, 'ollama3344022036/', { color: '#F5C451' });
    ctx.fillStyle = INK; ctx.font = font(40, 'MonoXB'); ctx.textAlign = 'center'; ctx.fillText('2.1 GB', 640, 1300); ctx.textAlign = 'left';
    if (t >= guard) {
      const p = E.outBack(prog(t, guard, 0.3), 2);
      ctx.save(); ctx.translate(880, 1370); ctx.rotate(-0.08); ctx.scale(p, p);
      sticker(ctx, g => roundRectPath(g, -150, -55, 300, 110, 14), { fill: RED, outline: 6 });
      ctx.fillStyle = '#fff'; ctx.font = font(34, 'NunitoBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('IN USE', 0, -16); ctx.font = font(28, 'MonoXB'); ctx.fillText('pid 1508', 0, 24);
      ctx.restore();
    }
    const lk = 1 + 0.12 * punch(t, lt, 0.35);
    const spitting = t >= spit - 0.25 && t < spit + 0.1;
    ctx.save(); ctx.translate(690, 1050); ctx.scale(lk, lk); ctx.translate(-690, -1050);
    llamaChar(ctx, 690, 880, 340, t, { mouth: spitting ? 1 : 0, look: t >= guard ? -1 : 0, smug: t > spit + 0.3 });
    ctx.restore();
    // spark walks up with the "spark joy" gesture
    const walk = E.outCubic(prog(t, st, 0.6));
    const hit = t >= spit + 0.28;
    drawSpark(ctx, lerp(-160, 230, walk) - (hit ? 60 * E.outCubic(prog(t, spit + 0.28, 0.3)) : 0), 1250, 140, t, { expr: hit ? 'deadpan' : 'happy', lookX: 1, squash: -0.15 * punch(t, spit + 0.28, 0.3) });
    if (!hit && t > st + 0.4) folderIcon(ctx, lerp(-60, 330, walk), 1090 + Math.sin(t * 5) * 8, 110, '', { rot: 0.2 });
    // spit projectile
    if (t >= spit && t < spit + 0.3) {
      const p = prog(t, spit, 0.28);
      const x = lerp(760, 230, p), y = lerp(760, 1230, p) - Math.sin(p * Math.PI) * 220;
      ctx.fillStyle = 'rgba(190,230,255,0.9)'; ctx.beginPath(); ctx.ellipse(x, y, 34, 26, p * 3, 0, 6.28); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(x - 8, y - 8, 8, 0, 6.28); ctx.fill();
    }
    if (hit) {
      const p = clamp((t - spit - 0.28) / 1.2);
      ctx.fillStyle = 'rgba(160,215,250,0.8)';
      for (let k = 0; k < 6; k++) { const dx = 170 + k * 22 - 60 * E.outCubic(prog(t, spit + 0.28, 0.3)); ctx.beginPath(); ctx.ellipse(dx, 1200 + p * 120 + (k % 3) * 20, 9, 16, 0, 0, 6.28); ctx.fill(); }
      outlinedText(ctx, 'fair.', 200, 1040, { size: 80 * E.outBack(prog(t, spit + 0.4, 0.25), 2), fam: 'Hand', fill: '#fff', stroke: INK, lw: 10 });
    }
  }

  // ================================================================== 6. the logs fake-out
  function sLogs(ctx, t) {
    const st = L('zero').start - 0.05, z0 = ev('zero'), rw = ev('rewind'), r13 = ev('reveal13'), bad = ev('mybad');
    paperBG(ctx, '#1C1916', 0.3);
    const scrolled = E.inOutCubic(prog(t, rw + 0.15, 0.45));
    const zz = t >= z0 && t < rw ? 1 + 0.35 * E.outBack(prog(t, z0, 0.25), 2) : 1;
    const s1 = shake(t, z0, 0.3, 20);
    ctx.save(); ctx.translate(540 + s1.x, 640 + s1.y); ctx.scale(zz, zz); ctx.translate(-540 - (t >= z0 && t < rw ? 80 : 0), -640);
    const b = U.terminalCard(ctx, 30, 220, 1020, 760, 'claude — ~');
    ctx.save(); ctx.beginPath(); ctx.rect(b.x - 10, b.y - 20, b.w + 20, b.h + 30); ctx.clip();
    ctx.translate(0, scrolled * 180);
    ctx.textBaseline = 'middle';
    const cmd = 'sudo journalctl --vacuum-size=200M | tail -2';
    ctx.fillStyle = '#9C948A'; ctx.font = font(30, 'Mono');
    ctx.fillText('⏺ Bash(' + cmd.slice(0, Math.floor(clamp((t - st) / 0.7) * cmd.length)) + ')', b.x, b.y + 10);
    // the lines tail -2 hid (revealed by the rewind scroll)
    ctx.font = font(28, 'Mono'); ctx.fillStyle = '#8A8178';
    ctx.fillText('Deleted archived journal system@7c1…', b.x + 20, b.y - 150);
    if (t >= r13) { ctx.fillStyle = 'rgba(168,240,58,0.25)'; ctx.fillRect(b.x + 10, b.y - 118, 940, 44); }
    ctx.fillStyle = t >= r13 ? LIME : '#8A8178';
    ctx.fillText('Vacuuming done, freed 1.3G from', b.x + 20, b.y - 96);
    ctx.fillStyle = '#8A8178'; ctx.fillText('/var/log/journal/abb98d57…', b.x + 20, b.y - 56);
    if (t > st + 0.6) {
      ctx.fillStyle = '#F2EDE6'; ctx.font = font(30, 'Mono');
      ctx.fillText('Vacuuming done, freed', b.x + 20, b.y + 80);
      const hot = t >= z0;
      ctx.fillStyle = hot ? '#FF5A52' : '#F2EDE6'; ctx.font = font(hot ? 44 : 30, 'MonoXB');
      ctx.fillText('0B', b.x + 430, b.y + 80);
      ctx.fillStyle = '#F2EDE6'; ctx.font = font(30, 'Mono');
      ctx.fillText('of archived journals from', b.x + 20, b.y + 126); ctx.fillText('/var/log/journal.', b.x + 20, b.y + 170);
      ctx.fillText('Vacuuming done, freed 0B of', b.x + 20, b.y + 236); ctx.fillText('archived journals from /run/log/journal.', b.x + 20, b.y + 280);
    }
    ctx.restore();
    ctx.restore();
    // VHS rewind overlay
    if (t >= rw && t < rw + 0.75) {
      const r = mulberry32(Math.floor(t * 30));
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      for (let k = 0; k < 8; k++) ctx.fillRect(0, r() * H, W, 6 + r() * 30);
      ctx.fillStyle = '#fff'; ctx.font = font(64, 'MonoXB'); ctx.textBaseline = 'top'; ctx.fillText('◀◀ REW', 60, 90);
      desaturate(ctx, 0.4);
    }
    const embarrassed = t >= bad;
    drawSpark(ctx, 540, 1230, 150, t, { expr: embarrassed ? 'worried' : t >= z0 ? 'shock' : 'normal', sweat: embarrassed, lookY: -1, scale: 1 + 0.12 * punch(t, z0, 0.3) });
    if (embarrassed) label(ctx, 'I piped it through tail -2 🙃', 540, 1010, { size: 50, fam: 'Hand', scale: E.outBack(prog(t, bad, 0.3), 2), rot: -0.04 });
  }

  // ================================================================== 7. hydraulic press + drop
  function cube(ctx, x, y, w, h, t, label2) {
    ctx.save(); ctx.translate(x, y);
    sticker(ctx, g => g.rect(-w / 2, -h, w, h), { fill: '#FFFDF4', outline: 8, shadow: 0.35, texture: 0.25 });
    // stacked paper edges
    const n = Math.max(1, Math.floor(h / 18));
    ctx.strokeStyle = '#D8CFB8'; ctx.lineWidth = 2;
    for (let k = 1; k < n; k++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, -k * (h / n)); ctx.lineTo(w / 2 - 6, -k * (h / n) + (hash(k) - 0.5) * 4); ctx.stroke(); }
    if (h > 120) {
      ctx.fillStyle = '#B08A2E'; ctx.font = font(Math.min(120, h * 0.35), 'MonoXB'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('{ }', 0, -h * 0.62);
    }
    if (label2) { ctx.fillStyle = INK; ctx.font = font(Math.min(54, Math.max(26, h * 0.6)), 'MontBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label2, 0, -h * (h > 120 ? 0.25 : 0.5)); }
    ctx.restore();
  }
  function sPress(ctx, t) {
    const bo = ev('bigone'), big = ev('big'), pr = ev('press'), cr = ev('crush'), ver = ev('verify');
    const beats = CU.beats.drop;
    const crushed = t >= cr;
    ctx.fillStyle = '#2B2B30'; ctx.fillRect(0, 0, W, H);
    // hazard stripes band
    ctx.save(); ctx.beginPath(); ctx.rect(0, 1380, W, 120); ctx.clip();
    ctx.fillStyle = '#F2C230'; ctx.fillRect(0, 1380, W, 120); ctx.fillStyle = '#111';
    for (let k = -2; k < 16; k++) { ctx.beginPath(); ctx.moveTo(k * 90, 1380); ctx.lineTo(k * 90 + 45, 1380); ctx.lineTo(k * 90 - 75, 1500); ctx.lineTo(k * 90 - 120, 1500); ctx.fill(); }
    ctx.restore();
    paperBG(ctx, 'rgba(0,0,0,0)', 0.25);
    const dropBeat = crushed ? beats.filter(b => b <= t).length - 1 : -1;
    const bt = dropBeat >= 0 ? beats[dropBeat] : cr;
    const zDrama = 1 + 0.2 * E.inOutCubic(prog(t, bo, 0.8)) * (crushed ? 0 : 1) + 0.06 * punch(t, big, 0.3) + 0.08 * punch(t, ev('bigone') + 0.6, 0.3);
    const zBeat = crushed ? 1 + 0.07 * punch(t, bt, 0.25) : 1;
    const s1 = shake(t, cr, 0.6, 45), s2 = crushed ? shake(t, bt, 0.15, 12) : { x: 0, y: 0 };
    ctx.save(); ctx.translate(540 + s1.x + s2.x, 1000 + s1.y + s2.y); ctx.scale(zDrama * zBeat, zDrama * zBeat); ctx.translate(-540, -1000);
    const showVerify = t >= ver;
    if (!showVerify || (dropBeat % 2 === 0 && t < ev('bar') - 0.2 && false)) {
      // frame
      sticker(ctx, g => { g.rect(120, 240, 90, 1150); g.rect(870, 240, 90, 1150); g.rect(80, 200, 920, 130); }, { fill: '#6B7280', outline: 8, shadow: 0.35, texture: 0.25 });
      ctx.fillStyle = RED; ctx.font = font(64, 'MontBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HYDRAULIC PRESS', 540, 268);
      // ram
      const cubeH = crushed ? lerp(40, 22, E.outCubic(prog(t, cr, 0.2))) : 520 * (1 + 0.04 * clamp((t - (cr - 0.15)) / 0.15));
      const cubeTop = 1380 - cubeH;
      const ramStart = 360, ramTouch = cubeTop - 40;
      let ramY = ramStart;
      if (t >= pr && !crushed) ramY = lerp(ramStart, 1380 - 520 - 40, E.inCubic(prog(t, pr, cr - pr - 0.05)));
      if (crushed) ramY = ramTouch;
      ctx.fillStyle = '#9CA3AF'; ctx.fillRect(500, 330, 80, ramY - 330);
      sticker(ctx, g => g.rect(230, ramY, 620, 60), { fill: '#4B5563', outline: 6, shadow: 0.3 });
      cube(ctx, 540, 1380, crushed ? 640 : 480, cubeH, t, crushed ? '' : '18 GB');
      if (!crushed) label(ctx, '256,888 files', 540, 1440, { size: 38, fam: 'MonoXB', scale: 1 });
      if (crushed) {
        // paper burst
        const p = prog(t, cr, 0.9);
        for (let k = 0; k < 26; k++) {
          const a = -Math.PI * (0.05 + 0.9 * hash(k)), v = 500 + 700 * hash(k + 5);
          const x = 540 + Math.cos(a) * v * p * (hash(k + 2) < 0.5 ? -1 : 1), y = 1360 + Math.sin(a) * v * p + 900 * p * p;
          if (y < H) jsonSheet(ctx, x, y, 70, p * 10 * (hash(k) - 0.5), k);
        }
        const lp2 = E.outBack(prog(t, cr + 0.05, 0.35), 2.2);
        ctx.save(); ctx.translate(540, 880); ctx.scale(lp2, lp2);
        outlinedText(ctx, '250 MB', 0, 0, { size: 190, fam: 'MontBlack', fill: LIME, stroke: INK });
        ctx.restore();
        label(ctx, '70× smaller', 540, 1060, { size: 56, fam: 'Lucky', fill: '#FFD23F', scale: E.outBack(prog(t, cr + 0.3, 0.3), 2.5), rot: -0.05 });
      }
    } else {
      // verification montage: every file, byte for byte
      const vb = beats.filter(b => b >= ver);
      const vi = Math.max(0, vb.filter(b => b <= t).length - 1);
      sunburst(ctx, 540, 900, 18, vi % 2 ? '#1F3D2A' : '#16301F', vi % 2 ? '#24503A' : '#1E4430', t * 0.6);
      const cols = 9, rows = 11, total = cols * rows;
      const fill = clamp((t - ver) / (ev('bar') - ver - 0.1));
      for (let k = 0; k < total; k++) {
        const on = k / total < fill;
        const x = 150 + (k % cols) * 97, y = 330 + Math.floor(k / cols) * 97;
        ctx.fillStyle = on ? '#3BBF5B' : 'rgba(255,255,255,0.12)';
        ctx.beginPath(); ctx.arc(x, y, 38, 0, 6.28); ctx.fill();
        if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 16, y); ctx.lineTo(x - 4, y + 13); ctx.lineTo(x + 18, y - 14); ctx.stroke(); }
      }
      const n = Math.round(256888 * fill);
      label(ctx, `${n.toLocaleString('en-US')} / 256,888 match`, 540, 1450, { size: 50, fam: 'MonoXB', fill: '#FFFDF4' });
      outlinedText(ctx, 'BYTE FOR BYTE', 540, 200, { size: 110, fam: 'Lucky', fill: '#fff', stroke: INK });
    }
    ctx.restore();
    flash(ctx, t, cr, 0.25, '255,255,255', 0.95);
    if (!crushed && t >= bo) { ctx.fillStyle = `rgba(0,0,0,${0.3 * prog(t, bo, 0.5)})`; ctx.fillRect(0, 0, W, H); }
  }

  // ================================================================== 8. the bar
  function sBar(ctx, t) {
    const st = L('free').start - 0.2, b34 = ev('bar34');
    const beats = CU.beats.drop;
    const bt = beats.filter(b => b <= t).pop() || st;
    sunburst(ctx, 540, 800, 18, '#E9F9DD', '#D5F2C0', t * 0.4);
    paperBG(ctx, 'rgba(0,0,0,0)', 0.2);
    const p = E.inOutCubic(prog(t, st + 0.2, b34 - st - 0.2));
    const pct = lerp(0.94, 0.70, p);
    const free = lerp(7.0, 34, p);
    const z = 1 + 0.05 * punch(t, bt, 0.25);
    ctx.save(); ctx.translate(540, 700); ctx.scale(z, z); ctx.translate(-540, -700);
    outlinedText(ctx, `${free < 10 ? free.toFixed(1) : Math.round(free)} GB FREE`, 540, 420, { size: 150, fam: 'MontBlack', fill: p >= 1 ? LIME : '#fff', stroke: INK });
    diskBar(ctx, 60, 580, 960, 150, pct);
    ctx.restore();
    piBoard(ctx, 540, 1080, 240, t, { mood: p > 0.6 ? 'happy' : 'ok', squash: 0.05 * punch(t, b34, 0.4) });
    if (t >= b34) for (let k = 0; k < 8; k++) U.sparkle(ctx, 540 + Math.cos(k * 0.8) * 300, 1080 + Math.sin(k * 1.4) * 200, 30 * punch(t, b34, 0.9) + 10, t * 2 + k, '#FFD84D');
    U.confetti(ctx, t, b34, { cy: 600, n: 90, spread: 1200 });
  }

  // ================================================================== 9. ending
  function thumbLime(ctx, x, y, w, h) {
    ctx.fillStyle = '#1C1916'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#2B2723'; ctx.fillRect(x + w * 0.08, y + h * 0.1, w * 0.84, h * 0.3);
    ctx.fillStyle = LIME; ctx.fillRect(x + w * 0.14, y + h * 0.24, w * 0.6, h * 0.035);
    ctx.save(); ctx.translate(x + w / 2, y + h * 0.62); ctx.fillStyle = ORANGE;
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.fillRect(-w * 0.025, 0, w * 0.05, w * 0.2); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, w * 0.1, 0, 6.28); ctx.fill(); ctx.restore();
  }
  function thumbJoy(ctx, x, y, w, h) {
    ctx.fillStyle = '#FFD1DA'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#F5C451'; ctx.fillRect(x + w * 0.3, y + h * 0.25, w * 0.4, h * 0.2);
    ctx.save(); ctx.translate(x + w / 2, y + h * 0.66); ctx.fillStyle = ORANGE;
    for (let i = 0; i < 12; i++) { ctx.save(); ctx.rotate(i * Math.PI / 6); ctx.fillRect(-w * 0.025, 0, w * 0.05, w * 0.18); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, w * 0.09, 0, 6.28); ctx.fill(); ctx.restore();
  }
  function sEnding(ctx, t) {
    const st = L('brainrot').start - 0.3, br = ev('brainrot'), back = ev('back'), does = ev('does'), yeah = ev('yeah'), spk = ev('sparkle_end');
    paperBG(ctx, '#2A2350', 0.25);
    const lamp = ctx.createRadialGradient(300, 250, 40, 300, 250, 1300);
    lamp.addColorStop(0, 'rgba(255,220,160,0.35)'); lamp.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = lamp; ctx.fillRect(0, 0, W, H);
    // small disk bar at top
    const bp = t < back ? 0.70 : lerp(0.70, 0.71, E.outCubic(prog(t, back, 0.4)));
    ctx.save(); ctx.translate(540, 190); ctx.scale(1 + 0.15 * punch(t, back, 0.4), 1 + 0.15 * punch(t, back, 0.4)); ctx.translate(-540, -190);
    diskBar(ctx, 190, 140, 700, 90, bp, { big: false });
    ctx.restore();
    // renders folder window
    const wp = E.outBack(prog(t, st + 0.1, 0.35), 1.6);
    ctx.save(); ctx.translate(540, 640); ctx.scale(wp, wp); ctx.translate(-540, -640);
    sticker(ctx, g => roundRectPath(g, 90, 320, 900, 640, 28), { fill: '#FFFDF7', outline: 9, shadow: 0.35 });
    ctx.fillStyle = '#EDE8DD'; ctx.beginPath(); roundRectPath(ctx, 90, 320, 900, 80, 28); ctx.fill(); ctx.fillRect(90, 370, 900, 30);
    ctx.fillStyle = INK; ctx.font = font(36, 'MonoXB'); ctx.textBaseline = 'middle'; ctx.fillText('~/claudimations/renders/', 130, 362);
    const items = [['01-limewire.mp4', thumbLime], ['02-spark-joy.mp4', thumbJoy]];
    items.forEach(([nm, th], i) => {
      const ip = E.outBack(prog(t, br + 0.5 + i * 0.35, 0.3), 2.2);
      if (ip <= 0) return;
      const x = 170 + i * 400, y = 450;
      ctx.save(); ctx.translate(x + 160, y + 200); ctx.scale(ip, ip); ctx.translate(-x - 160, -y - 200);
      sticker(ctx, g => roundRectPath(g, x, y, 320, 400, 16), { fill: '#222', outline: 6, shadow: 0.3 });
      ctx.save(); ctx.beginPath(); roundRectPath(ctx, x + 10, y + 10, 300, 330, 10); ctx.clip(); th(ctx, x + 10, y + 10, 300, 330); ctx.restore();
      ctx.fillStyle = '#fff'; ctx.font = font(26, 'MonoXB'); ctx.textAlign = 'center'; ctx.fillText(nm, x + 160, y + 372); ctx.textAlign = 'left';
      ctx.restore();
    });
    ctx.restore();
    // sticker update on the Pi
    piBoard(ctx, 800, 1260, 170, t, { mood: t >= yeah ? 'happy' : 'ok' });
    ctx.save(); ctx.translate(820, 1120); ctx.rotate(0.1);
    sticker(ctx, g => roundRectPath(g, -120, -36, 240, 72, 10), { fill: '#FFF08A', outline: 0, shadow: 0.25 });
    ctx.fillStyle = '#333'; ctx.font = font(40, 'Hand'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('34 GB free', 0, 2);
    if (t >= back) {
      const sp = E.outCubic(prog(t, back, 0.25));
      ctx.strokeStyle = RED; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-100, 10); ctx.lineTo(lerp(-100, 100, sp), lerp(10, -6, sp)); ctx.stroke();
      if (sp >= 1) { ctx.fillStyle = RED; ctx.font = font(44, 'Hand'); ctx.fillText('33', -60, 62); }
    }
    ctx.restore();
    // spark with the video held to its chest
    const holding = t >= does - 0.1;
    const happy = t >= yeah;
    drawSpark(ctx, 300, 1260, 150, t, { expr: happy ? 'happy' : holding ? 'normal' : t >= back ? 'worried' : 'happy', sweat: t >= back && !holding, lookY: holding && !happy ? 0.6 : 0 });
    if (holding) {
      const hp = E.outBack(prog(t, does - 0.1, 0.35), 1.8);
      ctx.save(); ctx.translate(300, 1330); ctx.rotate(-0.08); ctx.scale(hp, hp);
      sticker(ctx, g => roundRectPath(g, -90, -115, 180, 230, 14), { fill: '#222', outline: 6, shadow: 0.3 });
      ctx.save(); ctx.beginPath(); roundRectPath(ctx, -80, -105, 160, 210, 8); ctx.clip(); thumbLime(ctx, -80, -105, 160, 210); ctx.restore();
      ctx.restore();
    }
    if (happy) {
      const hp = prog(t, yeah, 0.5);
      ctx.save(); ctx.globalAlpha = 0.45 * hp;
      const halo = ctx.createRadialGradient(300, 1260, 20, 300, 1260, 420);
      halo.addColorStop(0, 'rgba(255,230,140,1)'); halo.addColorStop(1, 'rgba(255,230,140,0)');
      ctx.fillStyle = halo; ctx.fillRect(0, 800, W, 900); ctx.restore();
      for (let k = 0; k < 9; k++) U.sparkle(ctx, 300 + Math.cos(k * 0.7 + t) * 260, 1260 + Math.sin(k * 1.1 + t) * 220, 24 + 12 * Math.sin(t * 5 + k), t * 2 + k, '#FFD84D');
    }
    if (t >= spk + 0.6) {
      const p = E.outBack(prog(t, spk + 0.6, 0.35), 2);
      ctx.fillStyle = `rgba(20,16,40,${0.72 * clamp(p)})`; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(540, 820); ctx.scale(p, p);
      outlinedText(ctx, 'episode 2', 0, -150, { size: 64, fam: 'Hand', fill: '#FFD84D', stroke: INK, lw: 10 });
      outlinedText(ctx, 'every frame + every sound', 0, -60, { size: 66, fam: 'MontBlack', fill: '#fff', stroke: INK });
      outlinedText(ctx, 'made with code', 0, 30, { size: 96, fam: 'MontBlack', fill: LIME, stroke: INK });
      outlinedText(ctx, '(on the same raspberry pi)', 0, 120, { size: 50, fam: 'Hand', fill: '#fff', stroke: INK, lw: 8 });
      ctx.restore();
    }
  }

  const SC = [
    { name: 'df', start: 0, draw: sDF, capY: 1560 },
    { name: 'show', start: L('method').start - 0.15, draw: sShow, capY: 1580 },
    { name: 'json', start: L('json').start - 0.2, draw: sJSON, capY: 1650 },
    { name: 'pkgs', start: L('pkgs').start - 0.2, draw: sPkgs, capY: 1650 },
    { name: 'llama', start: L('llama').start + 0.1, draw: sLlama, capY: 1600 },
    { name: 'logs', start: L('zero').start - 0.05, draw: sLogs, capY: 1520 },
    { name: 'press', start: L('bigone').start - 0.15, draw: sPress, capY: 1640 },
    { name: 'bar', start: L('free').start - 0.2, draw: sBar, capY: 1560 },
    { name: 'ending', start: L('brainrot').start - 0.3, draw: sEnding, capY: 1600 },
  ];
  const sceneAt = t => { let s = SC[0]; for (const x of SC) if (t >= x.start) s = x; return s; };

  function draw(ctx, t, frame) {
    const sc = sceneAt(t);
    sc.draw(ctx, t);
    if (sc.start > 0 && !['press', 'bar'].includes(sc.name)) flash(ctx, t, sc.start, 0.12, '255,255,255', 0.45);
    const hideCap = sc.name === 'ending' && t >= ev('sparkle_end') + 0.6;
    caps.draw(ctx, t, { y: sc.capY, hide: hideCap });
    C.finishFrame(ctx, frame, { grain: 0.06, vig: 0.8 });
  }
  return { duration: DUR, draw };
}

module.exports = { setup };
