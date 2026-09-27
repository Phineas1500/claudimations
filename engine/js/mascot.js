// The spark: a paper-cutout Claude-style asterisk character with expressions and props.
const { sticker, mulberry32, wob, font, clamp, roundRectPath } = require('./core');

const ORANGE = '#E07A55';
const INK = '#2A1710';
const RAYS = (() => {
  const r = mulberry32(42);
  return Array.from({ length: 12 }, (_, i) => ({ a: (i / 12) * Math.PI * 2 + (r() - 0.5) * 0.12, l: 0.86 + r() * 0.16 }));
})();

function sparkPath(ctx, s, t = 0, wiggle = 0) {
  const w = s * 0.105;
  RAYS.forEach((ray, i) => {
    const a = ray.a + wob(t, i, 1.5) * 0.03 * wiggle;
    const L = s * ray.l * (1 + wob(t, i + 20, 3) * 0.04 * wiggle);
    const ca = Math.cos(a), sa = Math.sin(a);
    const px = -sa * w, py = ca * w;
    ctx.moveTo(px, py);
    ctx.lineTo(ca * L + px, sa * L + py);
    ctx.arc(ca * L, sa * L, w, a + Math.PI / 2, a - Math.PI / 2, true);
    ctx.lineTo(-px, -py);
    ctx.closePath();
  });
  // same winding as the rays so the nonzero fill is a clean union
  ctx.moveTo(s * 0.5, 0);
  ctx.arc(0, 0, s * 0.5, 0, -Math.PI * 2, true);
  ctx.closePath();
}

function eye(ctx, x, y, s, { open = 1, lookX = 0, lookY = 0, big = false }) {
  const rx = s * (big ? 0.075 : 0.055), ry = s * (big ? 0.095 : 0.078) * Math.max(0.08, open);
  if (big) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(x, y, rx * 1.25, ry * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = s * 0.012; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(x + lookX * rx * 0.5, y + lookY * ry * 0.5, rx * 0.45, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(x + lookX * s * 0.02, y + lookY * s * 0.02, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  if (open > 0.4) {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + lookX * s * 0.02 - rx * 0.3, y + lookY * s * 0.02 - ry * 0.35, rx * 0.32, 0, Math.PI * 2); ctx.fill();
  }
}

function face(ctx, s, o) {
  const ex = s * 0.15, ey = -s * 0.05;
  const lx = o.lookX || 0, ly = o.lookY || 0;
  const open = o.blink ?? 1;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = INK; ctx.fillStyle = INK;
  const ex_ = o.expr || 'normal';
  // blush
  if (ex_ !== 'dead' && ex_ !== 'deadpan') {
    ctx.fillStyle = 'rgba(255,120,120,0.45)';
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * s * 0.25, s * 0.07, s * 0.06, s * 0.035, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = INK;
  }
  if (ex_ === 'happy') {
    ctx.lineWidth = s * 0.03;
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * ex + lx * s * 0.02, ey + s * 0.02, s * 0.05, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, s * 0.06, s * 0.09, 0.15 * Math.PI, 0.85 * Math.PI); ctx.closePath();
    ctx.fillStyle = INK; ctx.fill();
    ctx.fillStyle = '#E86A6A'; ctx.beginPath(); ctx.arc(0, s * 0.13, s * 0.04, 0, Math.PI); ctx.fill();
    return;
  }
  if (ex_ === 'dead') {
    ctx.lineWidth = s * 0.028;
    for (const sx of [-1, 1]) {
      const x = sx * ex, y = ey, d = s * 0.045;
      ctx.beginPath(); ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d); ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-s * 0.06, s * 0.12); ctx.lineTo(s * 0.06, s * 0.12); ctx.stroke();
    return;
  }
  if (ex_ === 'deadpan' || ex_ === 'smug') {
    for (const sx of [-1, 1]) {
      eye(ctx, sx * ex, ey + s * 0.01, s, { open: 0.55, lookX: lx, lookY: ly });
      // heavy lid
      ctx.fillStyle = ORANGE;
      ctx.fillRect(sx * ex - s * 0.08, ey - s * 0.1, s * 0.16, s * 0.1);
      ctx.strokeStyle = INK; ctx.lineWidth = s * 0.022;
      ctx.beginPath(); ctx.moveTo(sx * ex - s * 0.07, ey + s * 0.003); ctx.lineTo(sx * ex + s * 0.07, ey + s * 0.003); ctx.stroke();
    }
    ctx.lineWidth = s * 0.025;
    ctx.beginPath();
    if (ex_ === 'smug') { ctx.moveTo(-s * 0.07, s * 0.11); ctx.quadraticCurveTo(s * 0.03, s * 0.15, s * 0.1, s * 0.07); }
    else { ctx.moveTo(-s * 0.07, s * 0.12); ctx.lineTo(s * 0.07, s * 0.12); }
    ctx.stroke();
    return;
  }
  const big = ex_ === 'shock';
  for (const sx of [-1, 1]) eye(ctx, sx * ex, ey, s, { open, lookX: lx, lookY: ly, big });
  ctx.lineWidth = s * 0.025;
  if (ex_ === 'shock') {
    ctx.beginPath(); ctx.ellipse(0, s * 0.14, s * 0.045, s * 0.06, 0, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
  } else if (ex_ === 'sad') {
    ctx.beginPath(); ctx.arc(0, s * 0.17, s * 0.07, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * (ex + s * 0.06), ey - s * 0.12); ctx.lineTo(sx * (ex - s * 0.05), ey - s * 0.09); ctx.stroke(); }
  } else if (ex_ === 'worried') {
    ctx.beginPath(); ctx.moveTo(-s * 0.07, s * 0.13); ctx.quadraticCurveTo(-s * 0.035, s * 0.1, 0, s * 0.13); ctx.quadraticCurveTo(s * 0.035, s * 0.16, s * 0.07, s * 0.13); ctx.stroke();
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx * (ex + s * 0.06), ey - s * 0.09); ctx.lineTo(sx * (ex - s * 0.05), ey - s * 0.125); ctx.stroke(); }
  } else {
    ctx.beginPath(); ctx.arc(0, s * 0.07, s * 0.06, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
}

function groucho(ctx, s) {
  // eyebrows
  ctx.fillStyle = '#1b1b1b';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sx * s * 0.15, -s * 0.2, s * 0.09, s * 0.03, sx * -0.2, 0, Math.PI * 2); ctx.fill(); }
  // rims
  ctx.lineWidth = s * 0.03; ctx.strokeStyle = '#111';
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * s * 0.15, -s * 0.05, s * 0.1, 0, Math.PI * 2); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 0.06); ctx.quadraticCurveTo(0, -s * 0.1, s * 0.05, -s * 0.06); ctx.stroke();
  // nose
  ctx.fillStyle = '#F2B8A0';
  ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.07, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = s * 0.012; ctx.strokeStyle = '#A0624C'; ctx.stroke();
  // mustache
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath();
  ctx.moveTo(0, s * 0.11);
  ctx.bezierCurveTo(-s * 0.08, s * 0.08, -s * 0.2, s * 0.1, -s * 0.24, s * 0.2);
  ctx.bezierCurveTo(-s * 0.16, s * 0.17, -s * 0.08, s * 0.2, 0, s * 0.16);
  ctx.bezierCurveTo(s * 0.08, s * 0.2, s * 0.16, s * 0.17, s * 0.24, s * 0.2);
  ctx.bezierCurveTo(s * 0.2, s * 0.1, s * 0.08, s * 0.08, 0, s * 0.11);
  ctx.fill();
}

function nametag(ctx, s, text, sub = null) {
  ctx.save();
  ctx.translate(s * 0.05, s * 0.62);
  ctx.rotate(-0.06);
  const w = s * 1.25, h = s * 0.5;
  sticker(ctx, g => roundRectPath(g, -w / 2, -h / 2, w, h, s * 0.05), { fill: '#fff', outline: 0, shadow: 0.25, sx: 4, sy: 6, texture: 0.1 });
  ctx.fillStyle = '#E0342F';
  ctx.beginPath(); roundRectPath(ctx, -w / 2, -h / 2, w, h * 0.34, s * 0.05); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = font(s * 0.085, 'NunitoBlack');
  ctx.fillText('HELLO my name is', 0, -h / 2 + h * 0.17);
  ctx.fillStyle = '#1a1a1a';
  let fs = s * 0.15;
  ctx.font = font(fs, 'Hand');
  const m = ctx.measureText(text).width;
  if (m > w * 0.9) { fs *= w * 0.9 / m; ctx.font = font(fs, 'Hand'); }
  ctx.fillText(text, 0, sub ? h * 0.08 : h * 0.16);
  if (sub) { ctx.font = font(s * 0.075, 'Hand'); ctx.fillStyle = '#555'; ctx.fillText(sub, 0, h * 0.33); }
  ctx.restore();
}

// opts: expr, lookX/lookY, blink, wiggle, squash, color, glasses, tag {text, sub}, sweat, gray
function drawSpark(ctx, x, y, s, t, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (o.rot) ctx.rotate(o.rot);
  const sq = o.squash || 0;
  ctx.scale((o.scale || 1) * (1 + sq), (o.scale || 1) * (1 - sq));
  sticker(ctx, g => sparkPath(g, s, t, o.wiggle ?? 1), { fill: o.color || ORANGE, outline: s * 0.045, shadow: 0.22, sx: s * 0.04, sy: s * 0.06, texture: 0.13 });
  if (o.gray) { ctx.save(); ctx.beginPath(); sparkPath(ctx, s, t, o.wiggle ?? 1); ctx.fillStyle = `rgba(150,150,150,${o.gray})`; ctx.fill(); ctx.restore(); }
  ctx.save(); ctx.scale(o.faceScale || 1.4, o.faceScale || 1.4);
  face(ctx, s, o);
  if (o.glasses) groucho(ctx, s);
  ctx.restore();
  if (o.sweat) {
    ctx.fillStyle = '#7CC6F2';
    ctx.beginPath(); ctx.moveTo(s * 0.42, -s * 0.26); ctx.quadraticCurveTo(s * 0.52, -s * 0.08, s * 0.42, -s * 0.04); ctx.quadraticCurveTo(s * 0.32, -s * 0.08, s * 0.42, -s * 0.26); ctx.fill();
  }
  if (o.tag) nametag(ctx, s, o.tag.text, o.tag.sub);
  ctx.restore();
}

function rainCloud(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(90,140,220,0.8)'; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const px = -s * 0.5 + i * s * 0.17, ph = ((t * 2.2 + i * 0.37) % 1);
    ctx.beginPath(); ctx.moveTo(px, s * 0.1 + ph * s * 0.9); ctx.lineTo(px - s * 0.03, s * 0.2 + ph * s * 0.9); ctx.stroke();
  }
  sticker(ctx, g => {
    for (const [cx, cy, r] of [[-0.35, 0, 0.25], [-0.05, -0.15, 0.33], [0.3, -0.02, 0.26], [0, 0.05, 0.28]]) { g.moveTo(cx * s + r * s, cy * s); g.arc(cx * s, cy * s, r * s, 0, Math.PI * 2); }
  }, { fill: '#8C96A8', outline: s * 0.03, shadow: 0.2, texture: 0.25 });
  ctx.restore();
}

module.exports = { drawSpark, sparkPath, rainCloud, groucho, ORANGE, INK };
