// Render arbitrary frames of a composition to PNG for visual QA.
// Usage: node rendering/stills.mjs <compId> <outDir> <frame> [frame...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";

const [compId, outDir, ...frames] = process.argv.slice(2);
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const composition = await selectComposition({ serveUrl, id: compId, browserExecutable });
for (const fr of frames) {
  const out = path.join(outDir, `${compId}_f${String(fr).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: Number(fr), output: out, browserExecutable, scale: 0.5 });
  console.log(out);
}
