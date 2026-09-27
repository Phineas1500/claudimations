// Core helpers for code-drawn vertical videos: fonts, easing, random, paper textures, stickers, text.
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const W = 1080, H = 1920, FPS = 30;

// ------------------------------------------------------------------ fonts
const FONT_FILES = {
  'Montserrat-Black.ttf': 'MontBlack', 'Montserrat-ExtraBold.ttf': 'MontXB', 'Montserrat-SemiBold.ttf': 'MontSB',
  'Nunito-Black.ttf': 'NunitoBlack', 'Nunito-ExtraBold.ttf': 'NunitoXB', 'Nunito-Bold.ttf': 'NunitoB', 'Nunito-Medium.ttf': 'NunitoM',
  'JetBrainsMono-Medium.ttf': 'Mono', 'JetBrainsMono-ExtraBold.ttf': 'MonoXB', 'LuckiestGuy-Regular.ttf': 'Lucky',
  'Bangers-Regular.ttf': 'Bangers', 'PatrickHand-Regular.ttf': 'Hand', 'NotoColorEmoji.ttf': 'Emoji',
};
let fontsLoaded = false;
function loadFonts() {
  if (fontsLoaded) return;
  const dir = path.join(__dirname, '..', 'fonts');
  for (const [f, alias] of Object.entries(FONT_FILES)) GlobalFonts.registerFromPath(path.join(dir, f), alias);
  fontsLoaded = true;
}
const font = (size, fam = 'MontBlack') => `${Math.round(size)}px ${fam}, Emoji`;

// ------------------------------------------------------------------ math / easing
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, t0, d) => clamp((t - t0) / d);
const remap = (x, a, b, c, d) => c + (d - c) * clamp((x - a) / (b - a));
const E = {
  linear: x => x,
  inQuad: x => x * x,
  outQuad: x => 1 - (1 - x) * (1 - x),
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  inOutSine: x => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  outElastic: x => (x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
  outExpo: x => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inExpo: x => (x === 0 ? 0 : Math.pow(2, 10 * x - 10)),
};
// 0 before t0, overshooting pop to 1
const pop = (t, t0, d = 0.32, s = 2.4) => (t < t0 ? 0 : E.outBack(prog(t, t0, d), s));
// decaying "punch" 1 -> 0 used for zoom/shake impulses
const punch = (t, t0, d = 0.25) => (t < t0 || t > t0 + d ? 0 : Math.pow(1 - (t - t0) / d, 2));

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
// smooth pseudo-random wobble in [-1, 1]
const wob = (t, seed = 0, f = 1) => Math.sin(t * f * 2.1 + seed * 13.7) * 0.5 + Math.sin(t * f * 3.7 + seed * 7.3) * 0.3 + Math.sin(t * f * 7.9 + seed * 3.1) * 0.2;
function shake(t, t0, d = 0.35, amp = 20) {
  const k = punch(t, t0, d);
  return { x: wob(t * 9, 1, 6) * amp * k, y: wob(t * 9, 2, 6) * amp * k };
}

// ------------------------------------------------------------------ textures (generated once)
function makeNoiseCanvas(w, h, seed, fn) {
  const c = createCanvas(w, h);
  const g = c.getContext('2d');
  const img = g.createImageData(w, h);
  const r = mulberry32(seed);
  for (let i = 0; i < w * h; i++) {
    const [v, a] = fn(r, i % w, (i / w) | 0);
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  return c;
}
let _paper = null, _grain = null, _vignette = null;
function paperTexture() {
  if (_paper) return _paper;
  const c = makeNoiseCanvas(512, 512, 11, (r) => [128 + (r() - 0.5) * 70, 255]);
  const g = c.getContext('2d');
  const r = mulberry32(5);
  // fibers
  for (let i = 0; i < 260; i++) {
    const x = r() * 512, y = r() * 512, a = r() * Math.PI, l = 8 + r() * 30;
    g.strokeStyle = r() < 0.5 ? 'rgba(90,80,70,0.35)' : 'rgba(255,255,255,0.45)';
    g.lineWidth = 0.6 + r() * 0.8;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 6, y + Math.sin(a) * l * 0.5 + (r() - 0.5) * 6, x + Math.cos(a) * l, y + Math.sin(a) * l);
    g.stroke();
  }
  // soft blotches
  for (let i = 0; i < 40; i++) {
    const x = r() * 512, y = r() * 512, rad = 20 + r() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() < 0.5;
    gr.addColorStop(0, dark ? 'rgba(100,90,80,0.12)' : 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, 'rgba(128,128,128,0)');
    g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  _paper = c;
  return c;
}
function grainFrames() {
  if (_grain) return _grain;
  _grain = [0, 1, 2, 3].map(s => makeNoiseCanvas(540, 960, 100 + s, (r) => [r() * 255, 255]));
  return _grain;
}
function vignette() {
  if (_vignette) return _vignette;
  const c = createCanvas(W, H), g = c.getContext('2d');
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.75);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(20,10,5,0.42)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  _vignette = c;
  return c;
}
function finishFrame(ctx, frame, { grain = 0.07, vig = 1 } = {}) {
  if (vig > 0) { ctx.globalAlpha = vig; ctx.drawImage(vignette(), 0, 0); ctx.globalAlpha = 1; }
  if (grain > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = grain;
    ctx.drawImage(grainFrames()[frame % 4], 0, 0, W, H);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ paper sticker shapes
// pathFn(ctx) must build a path (no beginPath needed). Draws: offset shadow, white cut outline, fill, paper texture.
function sticker(ctx, pathFn, { fill = '#fff', outline = 9, outlineColor = '#fffdf7', shadow = 0.22, sx = 7, sy = 10, texture = 0.16, stroke = null } = {}) {
  if (shadow > 0) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.beginPath(); pathFn(ctx);
    ctx.fillStyle = `rgba(30,15,5,${shadow})`;
    ctx.fill();
    if (outline > 0) { ctx.lineWidth = outline * 2; ctx.strokeStyle = ctx.fillStyle; ctx.lineJoin = 'round'; ctx.stroke(); }
    ctx.restore();
  }
  ctx.beginPath(); pathFn(ctx);
  if (outline > 0) {
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.lineWidth = outline * 2; ctx.strokeStyle = outlineColor; ctx.stroke();
    ctx.fillStyle = outlineColor; ctx.fill();
  }
  ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = stroke.w; ctx.strokeStyle = stroke.c; ctx.stroke(); }
  if (texture > 0) {
    ctx.save();
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = texture;
    ctx.fillStyle = ctx.createPattern(paperTexture(), 'repeat');
    ctx.fillRect(-4000, -4000, 8000, 8000);
    ctx.restore();
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
// wobbly torn-paper rectangle
function tornRectPath(ctx, x, y, w, h, seed = 1, amp = 5) {
  const r = mulberry32(seed);
  const step = 26;
  ctx.moveTo(x, y);
  for (let i = step; i < w; i += step) ctx.lineTo(x + i, y + (r() - 0.5) * amp);
  ctx.lineTo(x + w, y);
  for (let i = step; i < h; i += step) ctx.lineTo(x + w + (r() - 0.5) * amp, y + i);
  ctx.lineTo(x + w, y + h);
  for (let i = w - step; i > 0; i -= step) ctx.lineTo(x + i, y + h + (r() - 0.5) * amp);
  ctx.lineTo(x, y + h);
  for (let i = h - step; i > 0; i -= step) ctx.lineTo(x + (r() - 0.5) * amp, y + i);
  ctx.closePath();
}

// full-frame background with paper texture
function paperBG(ctx, color, tex = 0.22, grad = null) {
  ctx.fillStyle = color; ctx.fillRect(0, 0, W, H);
  if (grad) { ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H); }
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = tex;
  ctx.fillStyle = ctx.createPattern(paperTexture(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function sunburst(ctx, cx, cy, n, c1, c2, rot = 0, R = 2400) {
  ctx.save();
  ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = c2;
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2, a1 = a0 + Math.PI / n;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
    ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ text
function outlinedText(ctx, text, x, y, { size = 80, fam = 'MontBlack', fill = '#fff', stroke = '#111', lw = null, align = 'center', baseline = 'middle', shadow = true, maxW = null } = {}) {
  ctx.save();
  let s = size;
  ctx.font = font(s, fam);
  if (maxW) { const m = ctx.measureText(text).width; if (m > maxW) { s = s * maxW / m; ctx.font = font(s, fam); } }
  ctx.textAlign = align; ctx.textBaseline = baseline;
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const lwid = lw == null ? s * 0.2 : lw;
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = lwid; ctx.strokeText(text, x + s * 0.05, y + s * 0.07); }
  if (lwid > 0) { ctx.strokeStyle = stroke; ctx.lineWidth = lwid; ctx.strokeText(text, x, y); }
  ctx.fillStyle = fill; ctx.fillText(text, x, y);
  ctx.restore();
  return s;
}

function textW(ctx, text, size, fam = 'MontBlack') { ctx.save(); ctx.font = font(size, fam); const w = ctx.measureText(text).width; ctx.restore(); return w; }

module.exports = {
  W, H, FPS, createCanvas, loadFonts, font, clamp, lerp, prog, remap, E, pop, punch, mulberry32, hash, wob, shake,
  paperTexture, finishFrame, sticker, roundRectPath, tornRectPath, paperBG, sunburst, outlinedText, textW,
};
