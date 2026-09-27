// Karaoke-style captions driven by the TTS timeline (words with start/end times).
const { W, font, E, prog, clamp, wob } = require('./core');

function chunkLine(line, maxWords = 3, maxChars = 14) {
  const chunks = [];
  let cur = null;
  for (const w of line.words) {
    if (w.emoji) {
      if (cur) cur.emoji.push(w); else if (chunks.length) chunks[chunks.length - 1].emoji.push(w);
      continue;
    }
    const chars = cur ? cur.words.reduce((n, x) => n + x.shown.length + 1, 0) + w.shown.length : 0;
    if (!cur || cur.words.length >= maxWords || chars > maxChars || /[,.!?]$/.test(cur.words[cur.words.length - 1].shown)) {
      cur = { words: [], emoji: [] };
      chunks.push(cur);
    }
    cur.words.push(w);
  }
  for (const c of chunks) { c.start = c.words[0].start; c.end = c.words[c.words.length - 1].end; }
  return chunks;
}

class Captions {
  constructor(timeline, opts = {}) {
    this.o = Object.assign({ size: 100, fam: 'MontBlack', hi: '#A8F03A', base: '#FFFFFF', stroke: '#141414', maxW: 940, hold: 0.45 }, opts);
    this.chunks = [];
    const lines = timeline.lines;
    lines.forEach((l, li) => {
      const cs = chunkLine(l);
      const nextLineStart = li + 1 < lines.length ? lines[li + 1].start : timeline.duration;
      cs.forEach((c, ci) => {
        c.showFrom = c.start - 0.04;
        c.showTo = ci + 1 < cs.length ? cs[ci + 1].start - 0.04 : Math.min(nextLineStart - 0.06, c.end + this.o.hold);
        this.chunks.push(c);
      });
    });
  }

  active(t) { return this.chunks.find(c => t >= c.showFrom && t < c.showTo) || null; }

  draw(ctx, t, { y = 1390, scale = 1, hi = null, hide = false } = {}) {
    if (hide) return;
    const c = this.active(t);
    if (!c) return;
    const o = this.o;
    let size = o.size * scale;
    ctx.save();
    ctx.font = font(size, o.fam);
    const space = size * 0.36;
    const measure = () => c.words.map(w => ctx.measureText(w.shown).width);
    let widths = measure();
    let total = widths.reduce((a, b) => a + b, 0) + space * (widths.length - 1);
    const emojiW = c.emoji.length ? size * 1.15 * c.emoji.length + space : 0;
    // two rows if too wide
    let rows = [c.words.map((w, i) => i)];
    if (total + emojiW > o.maxW && c.words.length > 1) {
      const half = Math.ceil(c.words.length / 2);
      rows = [c.words.slice(0, half).map((w, i) => i), c.words.slice(half).map((w, i) => i + half)];
    }
    const rowW = r => r.reduce((a, i) => a + widths[i], 0) + space * (r.length - 1);
    const widest = Math.max(...rows.map(rowW)) + emojiW;
    if (widest > o.maxW) { size *= o.maxW / widest; ctx.font = font(size, o.fam); widths = measure(); }
    const lh = size * 1.02;
    // entrance pop for the whole chunk
    const ent = E.outBack(prog(t, c.showFrom, 0.14), 2.2);
    const cx = W / 2, cy = y;
    ctx.translate(cx, cy);
    ctx.scale(0.75 + 0.25 * ent, 0.75 + 0.25 * ent);
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    rows.forEach((r, ri) => {
      const rw = rowW(r) + (ri === rows.length - 1 ? emojiW : 0);
      let x = -rw / 2;
      const ry = (ri - (rows.length - 1) / 2) * lh;
      for (const i of r) {
        const w = c.words[i];
        const on = t >= w.start - 0.02 && t < (i + 1 < c.words.length ? c.words[i + 1].start - 0.02 : c.showTo);
        const k = on ? 1 + 0.08 * E.outBack(prog(t, w.start - 0.02, 0.12), 3) : 1;
        ctx.save();
        ctx.translate(x + widths[i] / 2, ry);
        ctx.scale(k, k);
        ctx.textAlign = 'center';
        ctx.lineWidth = size * 0.22;
        ctx.strokeStyle = 'rgba(0,0,0,0.35)';
        ctx.strokeText(w.shown, size * 0.04, size * 0.08);
        ctx.strokeStyle = o.stroke;
        ctx.strokeText(w.shown, 0, 0);
        ctx.fillStyle = on ? (hi || o.hi) : o.base;
        ctx.fillText(w.shown, 0, 0);
        ctx.restore();
        x += widths[i] + space;
      }
      if (ri === rows.length - 1) {
        c.emoji.forEach((em, ei) => {
          if (t < em.start) return;
          const p = E.outBack(prog(t, em.start, 0.25), 3);
          ctx.save();
          ctx.translate(x + size * 0.62 + ei * size * 1.15, ry);
          ctx.rotate(wob(t, ei + 3, 2) * 0.15);
          ctx.scale(p * 1.1, p * 1.1);
          ctx.font = font(size, 'Emoji');
          ctx.textAlign = 'center';
          ctx.fillText(em.shown, 0, size * 0.04);
          ctx.restore();
        });
      }
    });
    ctx.restore();
  }
}

module.exports = { Captions, chunkLine };
