// Render selected frames as PNG stills for visual QA.
// Usage: [COMP=Episode02] node tests/preview_frames.mjs <outDir> <scale> <frame> [frame...]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir = 'output/previews/frames', scale = '0.5', ...frames] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'assets')});
const composition = await selectComposition({serveUrl, id: process.env.COMP ?? 'Episode01', browserExecutable, inputProps: {episode: (process.env.COMP ?? 'Episode01').replace('Episode', 'e'), withAudio: false}});
for (const fr of frames.map(Number)) {
  const output = path.join(outDir, `f${String(fr).padStart(4, '0')}.png`);
  await renderStill({serveUrl, composition, frame: fr, output, scale: Number(scale), browserExecutable, chromiumOptions: {gl: 'swangle'}, inputProps: composition.props});
  console.log('rendered', output);
}
