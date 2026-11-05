// Spirit Strikers observatory — texture loader with procedural fallbacks.
//
// The room art (images/obs-*.png, compass.png, striker-swoosh.png, …) lives in the
// spirit-strikers-site repo. When those files are dropped into ./images they are used as-is.
// When they are missing, each surface gets a hand-tuned canvas texture in the same palette
// (stone, brass, copper, walnut, gold) so the room never renders as flat grey boxes.
import * as THREE from 'three';

const TL = new THREE.TextureLoader();
const cache = new Map();

// deterministic pseudo-random so the generated art is stable between reloads
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function noise(g, w, h, amt, seed) {
  const r = rng(seed), img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
}
function rivet(g, x, y, r) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
  gr.addColorStop(0, '#f2d79a'); gr.addColorStop(0.5, '#a8743a'); gr.addColorStop(1, '#3a2410');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
}
function brassGrad(g, x0, y0, x1, y1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, '#e9c082'); gr.addColorStop(0.18, '#c9863f'); gr.addColorStop(0.5, '#7d4a22');
  gr.addColorStop(0.82, '#b9772f'); gr.addColorStop(1, '#5a3414');
  return gr;
}

const GEN = {
  stone() {
    const S = 512, [c, g] = canvas(S), r = rng(7);
    g.fillStyle = '#1e232b'; g.fillRect(0, 0, S, S);
    const T = 128;
    for (let y = 0; y < S; y += T) for (let x = 0; x < S; x += T) {
      const l = 30 + r() * 14; g.fillStyle = `hsl(215 10% ${l}%)`;
      g.fillRect(x + 3, y + 3, T - 6, T - 6);
      g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(x + 3, y + 3, T - 6, 6);
    }
    noise(g, S, S, 26, 11);
    return c;
  },
  wall(hero) {
    const W = 1024, H = 256, [c, g] = canvas(W, H);
    g.fillStyle = '#2a1c10'; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 64) {               // walnut boards
      const gr = g.createLinearGradient(x, 0, x + 64, 0);
      gr.addColorStop(0, '#3b2614'); gr.addColorStop(0.5, '#4a3019'); gr.addColorStop(1, '#2e1d0e');
      g.fillStyle = gr; g.fillRect(x + 1, 0, 62, H);
    }
    g.fillStyle = brassGrad(g, 0, 0, 0, 28); g.fillRect(0, 0, W, 22);          // brass rails top + bottom
    g.fillStyle = brassGrad(g, 0, H - 30, 0, H); g.fillRect(0, H - 30, W, 30);
    for (let x = 16; x < W; x += 64) { rivet(g, x, 11, 5); rivet(g, x, H - 15, 5); }
    if (hero) {
      // porthole + two gauges on the back wall
      const cx = W / 2, cy = H / 2;
      g.fillStyle = brassGrad(g, 0, cy - 70, 0, cy + 70); g.beginPath(); g.arc(cx, cy, 70, 0, Math.PI * 2); g.fill();
      const sky = g.createRadialGradient(cx, cy - 10, 5, cx, cy, 56); sky.addColorStop(0, '#22406a'); sky.addColorStop(1, '#050913');
      g.fillStyle = sky; g.beginPath(); g.arc(cx, cy, 56, 0, Math.PI * 2); g.fill();
      const r = rng(3); g.fillStyle = '#eaf1ff';
      for (let i = 0; i < 40; i++) { const a = r() * Math.PI * 2, d = r() * 52; g.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 1.6); }
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rivet(g, cx + Math.cos(a) * 63, cy + Math.sin(a) * 63, 3.5); }
      [cx - 260, cx + 260].forEach((gx, k) => {
        g.fillStyle = brassGrad(g, 0, cy - 38, 0, cy + 38); g.beginPath(); g.arc(gx, cy, 38, 0, Math.PI * 2); g.fill();
        g.fillStyle = '#efe4c4'; g.beginPath(); g.arc(gx, cy, 30, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#3a2410'; g.lineWidth = 2;
        for (let t = 0; t <= 10; t++) { const a = Math.PI * (0.8 + t * 0.14); g.beginPath();
          g.moveTo(gx + Math.cos(a) * 24, cy + Math.sin(a) * 24); g.lineTo(gx + Math.cos(a) * 29, cy + Math.sin(a) * 29); g.stroke(); }
        const a = Math.PI * (k ? 1.5 : 1.15); g.strokeStyle = '#a3321f'; g.lineWidth = 3;
        g.beginPath(); g.moveTo(gx, cy); g.lineTo(gx + Math.cos(a) * 24, cy + Math.sin(a) * 24); g.stroke();
      });
    }
    noise(g, W, H, 14, hero ? 5 : 9);
    return c;
  },
  dome() {
    const S = 1024, [c, g] = canvas(S, S / 2);
    g.fillStyle = '#2a1b0e'; g.fillRect(0, 0, S, S / 2);
    for (let x = 0; x < S; x += 64) {                // copper panels between brass ribs
      const gr = g.createLinearGradient(x, 0, x + 64, 0);
      gr.addColorStop(0, '#5a3418'); gr.addColorStop(0.5, '#7d4a22'); gr.addColorStop(1, '#4a2a12');
      g.fillStyle = gr; g.fillRect(x, 0, 64, S / 2);
      g.fillStyle = brassGrad(g, x, 0, x + 8, 0); g.fillRect(x, 0, 7, S / 2);
      for (let y = 24; y < S / 2; y += 48) rivet(g, x + 3.5, y, 3);
    }
    noise(g, S, S / 2, 18, 21);
    return c;
  },
  doors() {
    const S = 512, [c, g] = canvas(S), cx = S / 2;
    g.fillStyle = '#3a2a14'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 8; i++) {                    // iris blades
      g.save(); g.translate(cx, cx); g.rotate(i / 8 * Math.PI * 2);
      g.fillStyle = i % 2 ? '#6d4220' : '#8a5a2b';
      g.beginPath(); g.moveTo(0, 0); g.lineTo(S, -40); g.lineTo(S, 160); g.closePath(); g.fill();
      g.strokeStyle = '#2a1708'; g.lineWidth = 4; g.stroke(); g.restore();
    }
    g.strokeStyle = brassGrad(g, 0, 0, 0, S); g.lineWidth = 26; g.beginPath(); g.arc(cx, cx, cx - 14, 0, Math.PI * 2); g.stroke();
    rivet(g, cx, cx, 22);
    return c;
  },
  wood() {
    const W = 512, H = 256, [c, g] = canvas(W, H), r = rng(13);
    g.fillStyle = '#4a311a'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { g.fillStyle = `rgba(${30 + r() * 30},${18 + r() * 14},8,${0.25 + r() * 0.25})`; g.fillRect(0, y, W, 1 + r() * 2); }
    noise(g, W, H, 12, 17);
    return c;
  },
  hatch() {
    const S = 512, [c, g] = canvas(S), cx = S / 2;
    g.fillStyle = brassGrad(g, 0, 0, 0, S); g.beginPath(); g.arc(cx, cx, cx, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2b1c0e'; g.beginPath(); g.arc(cx, cx, cx - 34, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; rivet(g, cx + Math.cos(a) * (cx - 17), cx + Math.sin(a) * (cx - 17), 8); }
    g.strokeStyle = '#a8743a'; g.lineWidth = 10;
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; g.beginPath(); g.moveTo(cx, cx); g.lineTo(cx + Math.cos(a) * 170, cx + Math.sin(a) * 170); g.stroke(); }
    rivet(g, cx, cx, 34);
    return c;
  },
  copper() {
    const S = 256, [c, g] = canvas(S);
    const gr = g.createLinearGradient(0, 0, S, 0);
    gr.addColorStop(0, '#7a4520'); gr.addColorStop(0.5, '#c07a3c'); gr.addColorStop(1, '#7a4520');
    g.fillStyle = gr; g.fillRect(0, 0, S, S);
    g.fillStyle = 'rgba(40,20,6,.55)'; g.fillRect(0, S - 6, S, 6); g.fillRect(S - 4, 0, 4, S);
    for (let x = 16; x < S; x += 48) rivet(g, x, S - 16, 4);
    noise(g, S, S, 20, 31);
    return c;
  },
  compass() {
    const S = 1024, [c, g] = canvas(S), cx = S / 2;
    g.clearRect(0, 0, S, S);
    g.strokeStyle = 'rgba(214,170,96,.85)'; g.lineWidth = 8;
    [480, 440, 300].forEach(r => { g.beginPath(); g.arc(cx, cx, r, 0, Math.PI * 2); g.stroke(); });
    g.lineWidth = 3;
    for (let i = 0; i < 72; i++) { const a = i / 72 * Math.PI * 2, l = i % 6 ? 16 : 36;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * 440, cx + Math.sin(a) * 440); g.lineTo(cx + Math.cos(a) * (440 - l), cx + Math.sin(a) * (440 - l)); g.stroke(); }
    for (let i = 0; i < 8; i++) {                    // 8-point star
      const a = i / 8 * Math.PI * 2 - Math.PI / 2, len = i % 2 ? 250 : 420, w = i % 2 ? 34 : 54;
      g.save(); g.translate(cx, cx); g.rotate(a);
      g.fillStyle = i % 2 ? 'rgba(150,104,48,.85)' : 'rgba(233,192,130,.9)';
      g.beginPath(); g.moveTo(0, -w); g.lineTo(len, 0); g.lineTo(0, w); g.closePath(); g.fill();
      g.fillStyle = 'rgba(60,34,12,.5)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.lineTo(0, w); g.closePath(); g.fill();
      g.restore();
    }
    g.fillStyle = 'rgba(233,192,130,.95)'; g.font = 'bold 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    [['N', 0, -1], ['E', 1, 0], ['S', 0, 1], ['W', -1, 0]].forEach(([t, x, y]) => g.fillText(t, cx + x * 362, cx + y * 362));
    rivet(g, cx, cx, 30);
    return c;
  },
  logo() {
    const W = 1040, H = 314, [c, g] = canvas(W, H);
    g.clearRect(0, 0, W, H);
    g.font = '800 112px "Playfair Display", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(243,230,132,.7)'; g.shadowBlur = 26;
    const gr = g.createLinearGradient(0, 60, 0, 220); gr.addColorStop(0, '#fff3b8'); gr.addColorStop(0.55, '#f3e684'); gr.addColorStop(1, '#b98a3a');
    g.fillStyle = gr; g.fillText('SPIRIT STRIKERS', W / 2, H / 2 - 6);
    g.shadowBlur = 0; g.strokeStyle = '#caa86a'; g.lineWidth = 6;
    g.beginPath(); g.moveTo(140, H / 2 + 74); g.quadraticCurveTo(W / 2, H / 2 + 40, W - 140, H / 2 + 74); g.stroke();
    return c;
  },
};
GEN.wall2 = () => GEN.wall(true);
GEN.wallPlain = () => GEN.wall(false);

/** A procedural CanvasTexture by key (stone, wall2, wallPlain, dome, doors, wood, hatch, copper, compass, logo). */
export function proceduralTexture(key) {
  if (!GEN[key]) return null;
  if (!cache.has(key)) cache.set(key, GEN[key]());
  const t = new THREE.CanvasTexture(cache.get(key));
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function applyMap(m, t, opts) {
  t.colorSpace = THREE.SRGBColorSpace;
  if (opts.rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opts.rep[0], opts.rep[1]); }
  m.map = t; m.color.set(0xffffff); m.needsUpdate = true;
}

/**
 * Unlit material that tries `src` (owner art) first and falls back to a procedural texture.
 * opts: { side, transparent, opacity, rep:[u,v], gen:'stone'|… }
 */
export function texMat(src, fallbackColor, opts = {}) {
  const m = new THREE.MeshBasicMaterial({
    color: fallbackColor, side: opts.side || THREE.FrontSide,
    transparent: !!opts.transparent, opacity: opts.opacity == null ? 1 : opts.opacity,
  });
  const fallback = () => { const t = opts.gen && proceduralTexture(opts.gen); if (t) applyMap(m, t, opts); };
  if (src && !window.__OBS_NO_IMAGES) TL.load(src, t => applyMap(m, t, opts), undefined, fallback);
  else fallback();
  return m;
}

/** Load a texture into an existing material's map (e.g. the shaft), with the same fallback rule. */
export function loadInto(mat, src, gen, rep) {
  const opts = { rep };
  const fallback = () => { const t = proceduralTexture(gen); if (t) applyMap(mat, t, opts); };
  if (src && !window.__OBS_NO_IMAGES) TL.load(src, t => applyMap(mat, t, opts), undefined, fallback);
  else fallback();
}
