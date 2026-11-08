#!/usr/bin/env node
// Drives scene.html in headless Chromium, captures every frame and encodes an MP4.
// Usage: node render3d.js [out.mp4]            full render
//        node render3d.js --preview <dir> t1 t2 ...   PNG stills
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const FPS = 30;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript' };

async function openPage() {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error') console.error('page:', m.text()); });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.route('http://scene.local/**', route => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, '');
    const file = path.resolve(DIR, rel);
    if (!file.startsWith(DIR) || !fs.existsSync(file)) return route.fulfill({ status: 404 });
    route.fulfill({ status: 200, contentType: TYPES[path.extname(file)] || 'application/octet-stream',
                    body: fs.readFileSync(file) });
  });
  await page.goto('http://scene.local/scene.html');
  await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
  return { browser, page };
}

async function preview(dir, times) {
  fs.mkdirSync(dir, { recursive: true });
  const { browser, page } = await openPage();
  for (const t of times) {
    const t0 = Date.now();
    const url = await page.evaluate(t => window.frame(t, 'image/png'), t);
    fs.writeFileSync(path.join(dir, `t${String(t).padStart(5, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log(`t=${t} ${Date.now() - t0} ms`);
  }
  await browser.close();
}

async function full(outFile) {
  const wav = outFile.replace(/\.mp4$/, '.wav');
  execFileSync('python3', [path.join(DIR, 'audio3d.py'), wav], { stdio: 'inherit' });
  const { browser, page } = await openPage();
  const duration = await page.evaluate(() => window.DURATION);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS),
    '-c:v', 'mjpeg', '-i', '-', '-i', wav, '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
    '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k',
    '-ar', '44100', '-movflags', '+faststart', '-shortest', outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(duration * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const url = await page.evaluate(t => window.frame(t), i / FPS);
    if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  fs.unlinkSync(wav);
  console.log('wrote', outFile);
}

const a = process.argv.slice(2);
if (a[0] === '--preview') preview(a[1], a.slice(2).map(Number));
else full(path.resolve(a[0] || path.join(DIR, '..', 'what-if-asteroid-missed-3d.mp4')));
