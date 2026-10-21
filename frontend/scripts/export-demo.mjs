import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(frontend, '..', 'demo');
const mp4 = path.join(outDir, 'walkthrough.mp4');
const gif = path.join(outDir, 'walkthrough.gif');
const palette = path.join(frontend, 'demo-results', 'palette.png');
const gifLimit = 9 * 1024 * 1024;

mkdirSync(outDir, { recursive: true });
mkdirSync(path.dirname(palette), { recursive: true });

const webm = newestWebm(path.join(frontend, 'demo-results'));
if (!webm) {
  console.error('No Playwright video was written to frontend/demo-results.');
  process.exit(1);
}

execFileSync('ffmpeg', [
  '-y', '-i', webm,
  '-an',
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  '-crf', '23',
  '-preset', 'medium',
  mp4,
], { stdio: 'inherit' });

// GitHub hides images over 10 MB. Flat UI frames stay small with a short palette and no dither.
const gifPasses = [
  { fps: 5, width: 800, colors: 64 },
  { fps: 4, width: 800, colors: 48 },
  { fps: 4, width: 640, colors: 40 },
];

let gifBytes = Number.POSITIVE_INFINITY;
for (const pass of gifPasses) {
  const scale = `fps=${pass.fps},scale=${pass.width}:-1:flags=lanczos`;
  execFileSync('ffmpeg', [
    '-y', '-i', webm,
    '-vf', `${scale},palettegen=max_colors=${pass.colors}:stats_mode=diff`,
    '-update', '1',
    palette,
  ], { stdio: 'inherit' });
  execFileSync('ffmpeg', [
    '-y', '-i', webm, '-i', palette,
    '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=none:diff_mode=rectangle`,
    '-loop', '0',
    gif,
  ], { stdio: 'inherit' });
  gifBytes = statSync(gif).size;
  console.log(`GIF pass ${pass.width}px @ ${pass.fps}fps: ${formatMb(gifBytes)}`);
  if (gifBytes <= gifLimit) break;
}

console.log(`MP4 ${formatMb(statSync(mp4).size)} -> ${mp4}`);
console.log(`GIF ${formatMb(gifBytes)} -> ${gif}`);
if (gifBytes > gifLimit) {
  console.error('The GIF is still over 9 MB, so GitHub may not show it in the README.');
  process.exit(1);
}

function newestWebm(dir) {
  const found = [];
  walk(dir, found);
  found.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return found[0];
}

function walk(dir, found) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (name.endsWith('.webm')) found.push(full);
  }
}

function formatMb(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
