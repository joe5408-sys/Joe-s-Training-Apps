import {Config} from '@remotion/cli/config';

// Assets (audio, stills) are served from ./assets via staticFile().
Config.setPublicDir('./assets');
// Use the Chromium that ships with this environment (no download needed).
Config.setBrowserExecutable(
  process.env.REMOTION_BROWSER ??
    '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
);
Config.setChromiumOpenGlRenderer('swangle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setConcurrency(4);
