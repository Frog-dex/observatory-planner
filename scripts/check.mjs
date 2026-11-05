// Smoke test: serves the repo, opens every page in headless Chromium, and fails on JS errors
// or broken requests. `--shots` also writes README screenshots to docs/screenshots/.
//   npm run check        npm run screenshots
// Missing files under images/ are reported but allowed: that art lives in the site repo and
// every page falls back to procedural textures without it.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = await import('playwright')); }

const ROOT = process.cwd();
const SHOTS = process.argv.includes('--shots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.css': 'text/css' };

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, path || 'index.html'));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/`;

const PAGES = [
  { path: 'index.html', wait: 600, shot: 'hub' },
  { path: 'plan.html', wait: 800, shot: 'planner', check: async p => {
      const n = await p.evaluate(() => window.getLayout().length);
      const code = await p.evaluate(() => window.layoutCode());
      if (n < 9) throw new Error(`planner shows ${n} items`);
      if (!code.includes('export const ROOM') || !code.includes('export const ITEMS')) throw new Error('layout code is incomplete');
    } },
  { path: 'scene.html?p=100', wait: 4500, shot: 'room', check: async p => {
      const n = await p.evaluate(() => Object.keys(window.SS.models).length);
      if (n < 9) throw new Error(`scene placed ${n} models`);
    } },
  { path: 'scene.html?p=8', wait: 1500, shot: 'signalscope' },
  { path: 'intro.html?p=100', wait: 2500 },
  { path: 'models.html?m=lizard', wait: 3000, shot: 'cabinet' },
];
const VIEWPORTS = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true }];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;
if (SHOTS) await mkdir('docs/screenshots', { recursive: true });
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: SHOTS ? 2 : 1 });
  for (const pg of PAGES) {
    const page = await ctx.newPage(), errors = [], missingArt = new Set();
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
    page.on('response', r => { if (r.status() >= 400) { const u = new URL(r.url()).pathname; if (u.startsWith('/images/')) missingArt.add(u); else errors.push(`HTTP ${r.status()} ${u}`); } });
    await page.goto(base + pg.path, { waitUntil: 'load' });
    await page.waitForTimeout(pg.wait);
    if (pg.check) { try { await pg.check(page); } catch (e) { errors.push('check: ' + e.message); } }
    const hscroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (hscroll) errors.push('horizontal page scroll at this width');
    if (SHOTS && pg.shot) await page.screenshot({ path: `docs/screenshots/${pg.shot}-${vp.name}.png` });
    const tag = `${vp.name.padEnd(7)} ${pg.path}`;
    if (errors.length) { failures++; console.log(`✗ ${tag}\n    ${errors.join('\n    ')}`); }
    else console.log(`✓ ${tag}${missingArt.size ? `  (site art not in repo, used fallback: ${missingArt.size} file(s))` : ''}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close(); server.close();
if (failures) { console.log(`\n${failures} page(s) failed`); process.exit(1); }
console.log('\nall pages OK');
