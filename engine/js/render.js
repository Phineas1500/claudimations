#!/usr/bin/env node
// Frame renderer: node render.js <videoDir> [--stills 1.2,5,9] [--sheet] [--workers 3] [--from s] [--to s] [--out file.mp4]
// A video dir provides scenes.js exporting setup() -> { duration, draw(ctx, t, frame) } and build/audio.wav.
const fs = require('fs');
const path = require('path');
const { spawn, fork } = require('child_process');
const C = require('./core');

const args = process.argv.slice(2);
const videoDir = path.resolve(args[0] || '.');
const opt = (k, d = null) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };

C.loadFonts();
const video = require(path.join(videoDir, 'scenes.js')).setup();
const build = path.join(videoDir, 'build');
fs.mkdirSync(build, { recursive: true });

function renderFrame(canvas, ctx, frame) {
  const t = frame / C.FPS;
  ctx.save();
  video.draw(ctx, t, frame);
  ctx.restore();
}

async function stills(times, sheet) {
  const canvas = C.createCanvas(C.W, C.H), ctx = canvas.getContext('2d');
  const outDir = path.join(build, 'stills');
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  for (const ts of times) {
    const frame = Math.round(ts * C.FPS);
    const t0 = Date.now();
    renderFrame(canvas, ctx, frame);
    const f = path.join(outDir, `still_${ts.toFixed(2)}.png`);
    fs.writeFileSync(f, canvas.toBuffer('image/png'));
    files.push(f);
    console.log(f, `${Date.now() - t0}ms`);
  }
  if (sheet) {
    const cols = Math.min(6, files.length), rows = Math.ceil(files.length / cols);
    const tw = 270, th = 480;
    const sc = C.createCanvas(cols * tw, rows * th), g = sc.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, sc.width, sc.height);
    const { loadImage } = require('@napi-rs/canvas');
    for (let i = 0; i < files.length; i++) {
      const img = await loadImage(files[i]);
      g.drawImage(img, (i % cols) * tw, Math.floor(i / cols) * th, tw - 4, th - 4);
      g.fillStyle = '#000'; g.font = '22px sans-serif'; g.fillText(times[i].toFixed(2), (i % cols) * tw + 6, Math.floor(i / cols) * th + 24);
    }
    const sf = path.join(outDir, 'sheet.png');
    fs.writeFileSync(sf, sc.toBuffer('image/png'));
    console.log('sheet', sf);
  }
}

function encodeRange(f0, f1, outFile) {
  return new Promise((resolve, reject) => {
    const canvas = C.createCanvas(C.W, C.H), ctx = canvas.getContext('2d');
    const ff = spawn('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${C.W}x${C.H}`, '-r', String(C.FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
    ff.on('error', reject);
    ff.on('close', code => (code === 0 ? resolve() : reject(new Error('ffmpeg exit ' + code))));
    let frame = f0;
    const t0 = Date.now();
    const pump = () => {
      while (frame < f1) {
        renderFrame(canvas, ctx, frame);
        const ok = ff.stdin.write(Buffer.from(canvas.data()));
        frame++;
        if ((frame - f0) % 60 === 0) process.stdout.write(`  [${path.basename(outFile)}] ${frame - f0}/${f1 - f0} frames, ${((Date.now() - t0) / (frame - f0)).toFixed(0)} ms/f\n`);
        if (!ok) { ff.stdin.once('drain', pump); return; }
      }
      ff.stdin.end();
    };
    pump();
  });
}

async function main() {
  if (opt('part')) {  // worker mode
    const [f0, f1] = opt('part').split(':').map(Number);
    await encodeRange(f0, f1, opt('out'));
    return;
  }
  if (opt('stills')) {
    await stills(String(opt('stills')).split(',').map(Number), !!opt('sheet'));
    return;
  }
  const from = Number(opt('from', 0)), to = Number(opt('to', video.duration));
  const F0 = Math.round(from * C.FPS), F1 = Math.round(to * C.FPS);
  const workers = Number(opt('workers', 3));
  const out = path.resolve(opt('out', path.join(build, 'video.mp4')));
  const t0 = Date.now();
  const per = Math.ceil((F1 - F0) / workers);
  const parts = [];
  const jobs = [];
  for (let k = 0; k < workers; k++) {
    const a = F0 + k * per, b = Math.min(F1, a + per);
    if (a >= b) break;
    const pf = path.join(build, `part${k}.mp4`);
    parts.push(pf);
    jobs.push(new Promise((res, rej) => {
      const p = fork(__filename, [videoDir, '--part', `${a}:${b}`, '--out', pf]);
      p.on('exit', c => (c === 0 ? res() : rej(new Error('worker ' + k + ' failed'))));
    }));
  }
  await Promise.all(jobs);
  const list = path.join(build, 'parts.txt');
  fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  const audio = path.join(build, 'audio.wav');
  await new Promise((res, rej) => {
    const ff = spawn('ffmpeg', ['-nostdin', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-ss', String(from), '-t', String(to - from), '-i', audio,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
    ff.on('close', c => (c === 0 ? res() : rej(new Error('mux failed'))));
  });
  parts.forEach(p => fs.unlinkSync(p));
  console.log(`done ${out} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

main().catch(e => { console.error(e); process.exit(1); });
