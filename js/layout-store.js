// Shared layout helpers for plan.html, scene.html and models.html.
//   • models/layout.js is the committed source of truth.
//   • The planner autosaves a *draft* to localStorage; scene.html?draft=1 previews it in 3D
//     without any copy-paste. "Copy / Download layout.js" turns the draft back into the file.
import { ROOM as FILE_ROOM, ITEMS as FILE_ITEMS } from '../models/layout.js';

export const DRAFT_KEY = 'observatory-planner.draft.v1';
export const ROOM_KEYS = ['minX', 'maxX', 'minZ', 'maxZ', 'floorY', 'ceilY', 'camX', 'camZ', 'camY', 'camLookZ'];
const ITEM_KEYS = ['id', 'model', 'on', 'x', 'z', 'rot', 'h', 'foot', 'sprite', 'spin', 'hero'];

const clone = o => JSON.parse(JSON.stringify(o));

export function fileLayout() { return { ROOM: clone(FILE_ROOM), ITEMS: clone(FILE_ITEMS) }; }

export function readDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && d.ROOM && Array.isArray(d.ITEMS)) return d;
  } catch { /* storage blocked or corrupt → ignore */ }
  return null;
}
export function writeDraft(room, items) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ROOM: pick(room, ROOM_KEYS), ITEMS: items.map(cleanItem), savedAt: Date.now() }));
    return true;
  } catch { return false; }
}
export function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }

/** The layout a page should use: the draft when `?draft=1` (or `preferDraft`) and one exists, else the file. */
export function activeLayout({ preferDraft = /[?&]draft=1/.test(location.search) } = {}) {
  const d = preferDraft && readDraft();
  if (d) return { ROOM: { ...FILE_ROOM, ...d.ROOM }, ITEMS: d.ITEMS, fromDraft: true, savedAt: d.savedAt };
  return { ...fileLayout(), fromDraft: false };
}

function pick(o, keys) { const r = {}; keys.forEach(k => { if (o[k] !== undefined) r[k] = o[k]; }); return r; }
export function cleanItem(it) {
  const o = pick(it, ITEM_KEYS);
  if (!o.spin) delete o.spin;
  if (!o.hero) delete o.hero;
  return o;
}

const n = v => Math.round(+v || 0);
const q = s => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** Exact text of models/layout.js for the given room + items (sprite data-URLs become models/top/<id>.png). */
export function toLayoutJs(room, items) {
  const r = { ...FILE_ROOM, ...room };
  const rows = items.map(it => {
    const sp = it.sprite && it.sprite.startsWith('data:') ? `models/top/${it.id}.png` : (it.sprite || '');
    const p = [`id:${q(it.id)}`, `model:${q(it.model)}`, `on:${q(it.on)}`, `x:${n(it.x)}`, `z:${n(it.z)}`, `rot:${n(it.rot)}`,
      `h:${n(it.h)}`, `foot:[${n(it.foot[0])},${n(it.foot[1])}]`];
    if (sp) p.push(`sprite:${q(sp)}`);
    if (it.spin) p.push('spin:true');
    if (it.hero) p.push('hero:true');
    return p;
  });
  // align the fixed columns (id … foot) like the hand-written file, so exports diff cleanly
  const width = i => Math.max(0, ...rows.map(p => p[i].length + 1));
  const widths = Array.from({ length: 8 }, (_, i) => width(i));
  const lines = rows.map(p => '  { ' + p.map((c, i) => (i < 8 && i < p.length - 1 ? (c + ',').padEnd(widths[i] + 1) : c + (i < p.length - 1 ? ', ' : ''))).join('') + ' }');
  return `// Spirit Strikers — OBSERVATORY FLOOR PLAN (single source of truth for object placement).
// Both scene.html (the 3D room) and plan.html (the top-down architect editor) read this file.
// Units = the scene's internal units.  Top-down view: X = left↔right, Z = depth.
//   back wall = minZ (negative) is at the TOP of the plan; the camera/front is at +Z (bottom).
export const ROOM = {
  minX:${n(r.minX)}, maxX:${n(r.maxX)},        // side walls
  minZ:${n(r.minZ)}, maxZ:${n(r.maxZ)},        // back wall (${n(r.minZ)}) .. front edge (${n(r.maxZ)})
  floorY:${n(r.floorY)}, ceilY:${n(r.ceilY)},  // vertical extents
  camX:${n(r.camX)}, camZ:${n(r.camZ)}, camY:${n(r.camY)}, camLookZ:${n(r.camLookZ)}   // where the viewer ends up + gaze
};

// Each item:
//   on   : mount plane — 'floor' (on the floor) · 'table' (on the desk's measured top) · 'ceiling' (hangs from the ceiling)
//   x,z  : plan position (units)          rot : yaw in degrees
//   h    : target height (units)          foot: [w,d] footprint — used by the plan drawing only
//   spin : true → the item swivels in 3D (the "rotating TV")
//   hero : true → marks the hero character
// foot = REAL measured footprint (from models/top/*.png renders, 1 unit = 1 px at rot 0).
// sprite = true top-view render of the model — what you see in the plan IS the model.
export const ITEMS = [
${lines.join(',\n')}
];
`;
}
