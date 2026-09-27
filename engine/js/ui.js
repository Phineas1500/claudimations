// UI pieces drawn in paper-craft style: retro OS windows, modern web bits, cursors, bars, phone chrome, particles.
const { W, H, sticker, roundRectPath, font, mulberry32, clamp, E, prog, lerp, wob } = require('./core');

// ------------------------------------------------------------------ retro desktop (XP-ish, original drawing)
function blissHills(ctx, t = 0) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  sky.addColorStop(0, '#2F6FD6'); sky.addColorStop(0.6, '#6FA8EE'); sky.addColorStop(1, '#BFDDF7');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // clouds
  const r = mulberry32(3);
  for (let i = 0; i < 7; i++) {
    const cx = ((r() * 1400 + t * (12 + i * 3)) % 1500) - 200, cy = 180 + r() * 600, s = 60 + r() * 90;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    for (let k = 0; k < 5; k++) ctx.ellipse(cx + (k - 2) * s * 0.55, cy + Math.sin(k * 2.3) * s * 0.18, s * 0.6, s * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // hill
  const hill = ctx.createLinearGradient(0, H * 0.5, 0, H);
  hill.addColorStop(0, '#7CC242'); hill.addColorStop(0.5, '#4E9A2A'); hill.addColorStop(1, '#2E6E18');
  ctx.fillStyle = hill;
  ctx.beginPath();
  ctx.moveTo(-50, H * 0.66);
  ctx.bezierCurveTo(W * 0.25, H * 0.5, W * 0.6, H * 0.52, W + 60, H * 0.62);
  ctx.lineTo(W + 60, H); ctx.lineTo(-50, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.ellipse(W * 0.35, H * 0.6, W * 0.4, 60, -0.08, 0, Math.PI * 2); ctx.fill();
}

function xpTaskbar(ctx, y = H - 90, clock = '3:07 AM') {
  const g = ctx.createLinearGradient(0, y, 0, y + 90);
  g.addColorStop(0, '#3D7BE8'); g.addColorStop(0.1, '#245EDB'); g.addColorStop(0.9, '#1F4FC2'); g.addColorStop(1, '#173C94');
  ctx.fillStyle = g; ctx.fillRect(0, y, W, 90);
  // start button
  const sg = ctx.createLinearGradient(0, y, 0, y + 90);
  sg.addColorStop(0, '#5FB94B'); sg.addColorStop(1, '#2F8A2A');
  ctx.fillStyle = sg;
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(210, y); ctx.quadraticCurveTo(250, y + 45, 210, y + 90); ctx.lineTo(0, y + 90); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = font(48, 'NunitoBlack'); ctx.textBaseline = 'middle';
  ctx.save(); ctx.translate(40, y + 46); ctx.transform(1, 0, -0.2, 1, 0, 0); ctx.fillText('start', 22, 0); ctx.restore();
  // tray
  ctx.fillStyle = '#1690E8'; ctx.fillRect(W - 230, y, 230, 90);
  ctx.fillStyle = '#fff'; ctx.font = font(34, 'NunitoB'); ctx.textAlign = 'center'; ctx.fillText(clock, W - 115, y + 46); ctx.textAlign = 'left';
}

function xpWindow(ctx, x, y, w, h, title, { icon = null, body = '#ECE9D8', active = true } = {}) {
  const tb = 58;
  sticker(ctx, g => { g.moveTo(x + 18, y); g.lineTo(x + w - 18, y); g.quadraticCurveTo(x + w, y, x + w, y + 18); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.lineTo(x, y + 18); g.quadraticCurveTo(x, y, x + 18, y); g.closePath(); },
    { fill: '#0A56D8', outline: 6, shadow: 0.28, texture: 0.08 });
  const g = ctx.createLinearGradient(0, y, 0, y + tb);
  if (active) { g.addColorStop(0, '#3C8CF6'); g.addColorStop(0.15, '#1662E0'); g.addColorStop(0.85, '#0B55D6'); g.addColorStop(1, '#0A47B8'); }
  else { g.addColorStop(0, '#9DB6E8'); g.addColorStop(1, '#7B98D6'); }
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x + 18, y); ctx.lineTo(x + w - 18, y); ctx.quadraticCurveTo(x + w, y, x + w, y + 18); ctx.lineTo(x + w, y + tb); ctx.lineTo(x, y + tb); ctx.lineTo(x, y + 18); ctx.quadraticCurveTo(x, y, x + 18, y); ctx.fill();
  ctx.fillStyle = body; ctx.fillRect(x + 6, y + tb, w - 12, h - tb - 6);
  // title
  let tx = x + 22;
  if (icon) { icon(ctx, x + 38, y + tb / 2, 34); tx = x + 66; }
  ctx.font = font(32, 'NunitoBlack'); ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText(title, tx + 2, y + tb / 2 + 2);
  ctx.fillStyle = '#fff'; ctx.fillText(title, tx, y + tb / 2);
  // buttons
  const bs = 40, by = y + (tb - bs) / 2;
  [['#2A6FF0', '_'], ['#2A6FF0', '□'], ['#E0512B', '✕']].forEach(([c, s], i) => {
    const bx = x + w - 16 - (3 - i) * (bs + 6);
    ctx.fillStyle = c; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
    ctx.beginPath(); roundRectPath(ctx, bx, by, bs, bs, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = font(26, 'NunitoBlack'); ctx.textAlign = 'center'; ctx.fillText(s, bx + bs / 2, by + bs / 2 + 1); ctx.textAlign = 'left';
  });
  return { x: x + 6, y: y + tb, w: w - 12, h: h - tb - 6 };
}

function warnIcon(ctx, x, y, s, kind = 'warn') {
  if (kind === 'error') {
    ctx.fillStyle = '#D9321F'; ctx.beginPath(); ctx.arc(x, y, s / 2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.13; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - s * 0.18, y - s * 0.18); ctx.lineTo(x + s * 0.18, y + s * 0.18); ctx.moveTo(x + s * 0.18, y - s * 0.18); ctx.lineTo(x - s * 0.18, y + s * 0.18); ctx.stroke();
    return;
  }
  ctx.fillStyle = '#F7C325'; ctx.strokeStyle = '#8A6A00'; ctx.lineWidth = s * 0.04; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.48); ctx.lineTo(x + s * 0.52, y + s * 0.42); ctx.lineTo(x - s * 0.52, y + s * 0.42); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#222'; ctx.font = font(s * 0.62, 'NunitoBlack'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('!', x, y + s * 0.08); ctx.textAlign = 'left';
}

function xpDialog(ctx, x, y, w, title, msg, { kind = 'warn', scale = 1, rot = 0 } = {}) {
  const h = 250;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale); ctx.translate(-w / 2, -h / 2);
  const b = xpWindow(ctx, 0, 0, w, h, title);
  warnIcon(ctx, b.x + 60, b.y + 62, 70, kind);
  ctx.fillStyle = '#111'; ctx.font = font(30, 'NunitoXB'); ctx.textBaseline = 'middle';
  const lines = Array.isArray(msg) ? msg : [msg];
  lines.forEach((l, i) => ctx.fillText(l, b.x + 115, b.y + 48 + i * 36));
  // OK button
  const bw = 130, bh = 46, bx = b.x + b.w / 2 - bw / 2, by = b.y + b.h - bh - 16;
  ctx.fillStyle = '#F4F3EE'; ctx.strokeStyle = '#003C74'; ctx.lineWidth = 2.5;
  ctx.beginPath(); roundRectPath(ctx, bx, by, bw, bh, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.font = font(28, 'NunitoB'); ctx.textAlign = 'center'; ctx.fillText('OK', bx + bw / 2, by + bh / 2 + 1);
  ctx.restore();
}

function retroBar(ctx, x, y, w, h, p, { blocks = true, color = '#3BBF3B' } = {}) {
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#7F9DB9'; ctx.lineWidth = 2;
  ctx.beginPath(); roundRectPath(ctx, x, y, w, h, 4); ctx.fill(); ctx.stroke();
  const inner = (w - 8) * clamp(p);
  if (!blocks) { ctx.fillStyle = color; ctx.fillRect(x + 4, y + 4, inner, h - 8); return; }
  const bw = h * 0.6, gap = 3;
  for (let bx = 0; bx + bw <= inner; bx += bw + gap) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#B9F5B0'); g.addColorStop(0.5, color); g.addColorStop(1, '#1E8A1E');
    ctx.fillStyle = g; ctx.fillRect(x + 4 + bx, y + 4, bw, h - 8);
  }
}

// ------------------------------------------------------------------ modern bits
function terminalCard(ctx, x, y, w, h, title) {
  sticker(ctx, g => roundRectPath(g, x, y, w, h, 28), { fill: '#1E1B18', outline: 8, shadow: 0.35, texture: 0.1 });
  ctx.fillStyle = '#2B2723';
  ctx.beginPath(); roundRectPath(ctx, x, y, w, 70, 28); ctx.fill();
  ctx.fillRect(x, y + 40, w, 30);
  ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 42 + i * 38, y + 36, 12, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = '#9C948A'; ctx.font = font(26, 'Mono'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(title, x + w / 2, y + 36); ctx.textAlign = 'left';
  return { x: x + 36, y: y + 100, w: w - 72, h: h - 130 };
}

function button(ctx, x, y, w, h, label, { fill = '#2F9E44', color = '#fff', size = 34, fam = 'NunitoBlack', r = 999, press = 0 } = {}) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2); ctx.scale(1 - press * 0.08, 1 - press * 0.08);
  sticker(ctx, g => roundRectPath(g, -w / 2, -h / 2, w, h, Math.min(r, h / 2)), { fill, outline: 5, shadow: 0.25 * (1 - press), sx: 4, sy: 6, texture: 0.08 });
  ctx.fillStyle = color; ctx.font = font(size, fam); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 2);
  ctx.restore();
}

function cursorArrow(ctx, x, y, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 58); ctx.lineTo(14, 45); ctx.lineTo(25, 68); ctx.lineTo(35, 63); ctx.lineTo(24, 41); ctx.lineTo(42, 41); ctx.closePath();
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function handPointer(ctx, x, y, s = 1, press = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (1 - press * 0.1), s * (1 - press * 0.1));
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 8); ctx.arc(6, 8, 6, Math.PI, 0); ctx.lineTo(12, 34);
  ctx.arc(17, 34, 5, Math.PI, 0); ctx.lineTo(22, 38); ctx.arc(27, 38, 5, Math.PI, 0); ctx.lineTo(32, 42); ctx.arc(37, 42, 5, Math.PI, 0);
  ctx.lineTo(42, 64); ctx.quadraticCurveTo(40, 80, 28, 84); ctx.lineTo(14, 84); ctx.quadraticCurveTo(4, 78, -8, 58); ctx.lineTo(-12, 48);
  ctx.quadraticCurveTo(-12, 40, -4, 42); ctx.lineTo(0, 48); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

function padlock(ctx, x, y, s, open = 0, color = '#F2B705') {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = '#8A8F98'; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -s * 0.28 - open * s * 0.25, s * 0.3, Math.PI, Math.PI * 2 - open * 0.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.28 - open * s * 0.25); ctx.lineTo(-s * 0.3, -s * 0.1 - open * s * 0.25); ctx.stroke();
  sticker(ctx, g => roundRectPath(g, -s * 0.48, -s * 0.2, s * 0.96, s * 0.72, s * 0.12), { fill: color, outline: s * 0.05, shadow: 0.2, sx: 3, sy: 5, texture: 0.1 });
  ctx.fillStyle = '#5A4300'; ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.09, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(-s * 0.035, s * 0.1, s * 0.07, s * 0.2);
  ctx.restore();
}

// ------------------------------------------------------------------ phone chrome (short-video app look, generic)
function phoneUI(ctx, { handle = '@claude', caption = '', sound = 'original sound', likes = '1.2M', comments = '4,096', saves = '88K', shares = '31K', time = '3:07', progress = 0.3, dark = true } = {}) {
  const fg = '#fff';
  ctx.save();
  ctx.fillStyle = fg; ctx.textBaseline = 'middle';
  ctx.font = font(30, 'NunitoBlack'); ctx.fillText(time, 46, 44);
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.6; ctx.font = font(34, 'NunitoXB'); ctx.fillText('Following', W / 2 - 110, 118);
  ctx.globalAlpha = 1; ctx.font = font(36, 'NunitoBlack'); ctx.fillText('For You', W / 2 + 95, 118);
  ctx.fillRect(W / 2 + 70, 146, 50, 5);
  // right rail
  const rx = W - 78;
  const rail = [['♥', likes, 1080], ['💬', comments, 1215], ['🔖', saves, 1340], ['↪', shares, 1460]];
  ctx.font = font(30, 'NunitoBlack');
  for (const [ic, n, y] of rail) {
    ctx.save(); ctx.font = font(64, 'NunitoBlack, Emoji'); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8; ctx.fillText(ic, rx, y); ctx.restore();
    ctx.fillText(n, rx, y + 58);
  }
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6;
  ctx.font = font(38, 'NunitoBlack'); ctx.fillText(handle, 40, 1620);
  ctx.font = font(32, 'NunitoB'); ctx.fillText(caption, 40, 1672);
  ctx.font = font(30, 'NunitoB'); ctx.fillText('♫  ' + sound, 40, 1724);
  ctx.shadowBlur = 0;
  // progress + nav
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(0, 1772, W, 5);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 1772, W * progress, 5);
  ctx.fillStyle = dark ? '#000' : '#fff'; ctx.fillRect(0, 1777, W, H - 1777);
  ctx.fillStyle = dark ? '#fff' : '#000'; ctx.textAlign = 'center';
  ctx.font = font(26, 'NunitoB');
  ['Home', 'Friends', '', 'Inbox', 'Profile'].forEach((l, i) => { if (l) ctx.fillText(l, 108 + i * 216, 1878); });
  ctx.font = font(44, 'NunitoBlack');
  ['⌂', '⚇', '', '✉', '☺'].forEach((l, i) => { if (l) ctx.fillText(l, 108 + i * 216, 1826); });
  ctx.fillStyle = '#fff'; ctx.beginPath(); roundRectPath(ctx, W / 2 - 58, 1800, 116, 70, 18); ctx.fill();
  ctx.fillStyle = '#FE2C55'; ctx.fillRect(W / 2 + 40, 1800, 18, 70); ctx.fillStyle = '#25F4EE'; ctx.fillRect(W / 2 - 58, 1800, 18, 70);
  ctx.fillStyle = '#fff'; ctx.beginPath(); roundRectPath(ctx, W / 2 - 44, 1800, 88, 70, 14); ctx.fill();
  ctx.fillStyle = '#000'; ctx.font = font(56, 'NunitoBlack'); ctx.fillText('+', W / 2, 1836);
  ctx.restore();
}

// ------------------------------------------------------------------ particles & fx
function confetti(ctx, t, t0, { n = 70, cx = W / 2, cy = H * 0.4, seed = 9, spread = 900, colors = ['#F94144', '#F9C74F', '#90BE6D', '#577590', '#F8961E', '#A8F03A', '#C77DFF'] } = {}) {
  if (t < t0) return;
  const r = mulberry32(seed);
  const dt = t - t0;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 2.4, v = spread * (0.5 + r() * 0.8);
    const x = cx + Math.cos(a) * v * dt * 1.2, y = cy + Math.sin(a) * v * dt + 900 * dt * dt;
    if (y > H + 50) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * 6 + dt * (r() * 10 - 5));
    ctx.fillStyle = colors[i % colors.length];
    ctx.scale(1, Math.cos(dt * (6 + r() * 8)));
    ctx.fillRect(-9, -5, 18, 10);
    ctx.restore();
  }
}

function speedLines(ctx, t, cx = W / 2, cy = H / 2, { n = 40, color = 'rgba(255,255,255,0.8)', inner = 380, seed = 4 } = {}) {
  const r = mulberry32(seed + Math.floor(t * 20));
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, w = 0.004 + r() * 0.012, r0 = inner + r() * 250;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a - w) * 1600, cy + Math.sin(a - w) * 1600);
    ctx.lineTo(cx + Math.cos(a + w) * 1600, cy + Math.sin(a + w) * 1600);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function sparkle(ctx, x, y, s, rot = 0, color = '#FFE066') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
    ctx.lineTo(Math.cos(a + Math.PI / 4) * s * 0.28, Math.sin(a + Math.PI / 4) * s * 0.28);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function emoji(ctx, ch, x, y, size, rot = 0, scale = 1) {
  if (scale <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(scale, scale);
  ctx.font = font(size, 'Emoji'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(ch, 0, 0);
  ctx.restore();
}

module.exports = { blissHills, xpTaskbar, xpWindow, xpDialog, warnIcon, retroBar, terminalCard, button, cursorArrow, handPointer, padlock, phoneUI, confetti, speedLines, sparkle, emoji };
