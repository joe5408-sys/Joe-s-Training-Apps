import { Config } from "@remotion/cli/config";
import fs from "fs";

// Use the pre-installed headless Chromium if present (no download needed).
const local =
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
if (fs.existsSync(local)) Config.setBrowserExecutable(local);

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(16);
Config.setConcurrency(4);
