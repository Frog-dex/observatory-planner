// Spirit Strikers — OBSERVATORY FLOOR PLAN (single source of truth for object placement).
// Both scene.html (the 3D room) and plan.html (the top-down architect editor) read this file.
// Units = the scene's internal units.  Top-down view: X = left↔right, Z = depth.
//   back wall = minZ (negative) is at the TOP of the plan; the camera/front is at +Z (bottom).
export const ROOM = {
  minX:-820, maxX:820,        // side walls
  minZ:-720, maxZ:520,        // back wall (-720) .. front edge (520)
  floorY:-1790, ceilY:-1430,  // vertical extents
  camX:0, camZ:360, camY:-1604, camLookZ:-380   // where the viewer ends up + gaze
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
  { id:'desk',        model:'desk.glb',        on:'floor', x:0,    z:-560, rot:0,   h:150, foot:[94,160],  sprite:'models/top/desk.png' },
  { id:'monitor',     model:'terminal.glb',    on:'table', x:0,    z:-585, rot:180, h:120, foot:[90,92],   sprite:'models/top/monitor.png', spin:true },
  { id:'books',       model:'books.glb',       on:'table', x:-22,  z:-500, rot:-15, h:58,  foot:[40,36],   sprite:'models/top/books.png' },
  { id:'signalscope', model:'signalscope.glb', on:'table', x:22,   z:-498, rot:35,  h:66,  foot:[48,68],   sprite:'models/top/signalscope.png' },
  { id:'lamp',        model:'lamp.glb',        on:'floor', x:95,   z:-600, rot:0,   h:105, foot:[44,44],   sprite:'models/top/lamp.png' },
  { id:'clock',       model:'clock.glb',       on:'floor', x:-90,  z:-605, rot:20,  h:72,  foot:[28,44],   sprite:'models/top/clock.png' },
  { id:'telescope',   model:'telescope.glb',   on:'floor', x:-440, z:-330, rot:30,  h:185, foot:[90,174],  sprite:'models/top/telescope.png' },
  { id:'globe',       model:'globe.glb',       on:'floor', x:430,  z:-300, rot:0,   h:150, foot:[100,100], sprite:'models/top/globe.png' },
  { id:'lizard',      model:'lizard.glb',      on:'floor', x:330,  z:-120, rot:180, h:230, foot:[168,130], sprite:'models/top/lizard.png', hero:true }
];
