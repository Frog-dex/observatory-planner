# Observatory Planner — top-down layout editor for a 3D room

Plan a Three.js room **from above**, like furniture on graph paper — then copy the exact `layout.js`
the 3D scene consumes. What you drag on the plan is what the camera flies through in 3D.

Part of the Spirit Strikers world: a Victorian observatory (telescope, terminal, globe, clock, books,
the lizard) that the site's intro sequence flies into.

## The pieces

| File | Role |
|---|---|
| `plan.html` | **The planner.** Top-down SVG floor plan: drag objects to place them, drag the gold ◉ to move the camera target, click an object to set rotation / height / mount plane (floor · table top · ceiling) / spin. Emits the exact `models/layout.js` code — copy-paste, done. |
| `scene.html` | The 3D room (Three.js). Loads the GLB models and places them from `models/layout.js`. |
| `intro.html` | Telescope → tunnel → room: one continuous scroll-driven camera pan into the observatory. |
| `models/*.glb` | Low-poly furniture set: telescope, signalscope, desk, terminal, globe, dome, clock, lamp, books, tunnels, the lizard (~2 MB total). |
| `models/layout.js` | The single source of truth for object placement — written by `plan.html`, read by `scene.html`. |

## Use

```bash
python3 -m http.server 8803
# http://localhost:8803/plan.html    → arrange the room, Copy layout code
# paste into models/layout.js
# http://localhost:8803/scene.html   → see it in 3D
# http://localhost:8803/intro.html   → fly into it
```

No build step, no dependencies beyond Three.js (loaded in the scene page).

## The workflow idea

The planner and the scene share one data file. That means layout is **plannable by anyone —
including AI models** — without touching 3D code: edit `layout.js` (or export it from `plan.html`)
and the room rearranges. Rotation, height, mount plane, and spin flags are all in the same flat
object format.

---
Built for [spiritstriker.app](https://spiritstriker.app) (see *spirit-strikers-site*).
Sibling tool: *site-blueprint* — the same plan-and-code philosophy applied to 2D web pages.
