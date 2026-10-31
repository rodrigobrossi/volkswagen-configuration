---
name: adapt-car-model
description: Adapt a new real car GLTF/GLB model into the Fusca configurator — register it, calibrate scale/orientation, and wire up every function (openable doors/hood/engine-lid, wheel swap, interior, body-paint recolor, engine bay, per-part editor). Use when asked to add/import a new 3D car model, make a model "the base", or make a model's doors/hoods/parts open/configure.
---

# Adapt a Car Model to the Configurator

End-to-end recipe for turning a raw `.glb` into a fully-functioning car in this app: it renders at
the right size, recolors, opens its doors/hood/engine-lid, swaps wheels, and shows up in the per-part
editor. Distilled from the real integrations in `src/data/carModels.ts` + `src/components/`.

**Read alongside:** [.specs/3d-model.spec.md](../../../.specs/3d-model.spec.md) (the authority on the
real-model pipeline) and [.specs/data-model.spec.md](../../../.specs/data-model.spec.md).

## Golden rules (learned the hard way)
- **Verify in a FRESH browser tab.** Adding/removing a React hook while the tab is open triggers a
  "change in order of Hooks" crash from HMR keeping the old hook list — it is a stale-tab artifact,
  not a real bug. Open a new tab (or hard-reload) after such edits.
- **Coordinate frames.** At build time (`useMemo` in `RealCarModel`) the model `object` is at native
  scale (its own units), reset to identity — NOT yet centered or scaled. The outer
  `<group scale rotation>` applies calibration; `centering = [-center.x, -box.min.y, -center.z]`
  centers X/Z and grounds Y. Real-world constants are written in metres and divided by
  `model.calibration.scale` so they land at a consistent world size (see `EngineBay`, wheels).
- **Prefer measuring over guessing** — read runtime world bounding boxes; don't trust offline
  numbers for placement (offline is fine for the initial scale estimate only).
- After each change: `node_modules/.bin/tsc -b` clean, then screenshot-verify.

## Step 0 — Inspect the GLB (offline, no browser)
```bash
node .claude/skills/adapt-car-model/inspect-glb.mjs "<path/to/model.glb>"
```
Gives node names, material names, and the native bounding box + a suggested `calibration.scale`
(target ~4.07 m length). Note which axis is longest (front-back), and whether NODE names or MATERIAL
names are the cleaner way to tell parts apart — that decides `partGroupBy`.

## Step 1 — Register the model
1. Copy the file: `cp "<src>.glb" public/models/fusca-<key>.glb`.
2. Add the key to `CarModelKey` and an entry to `carModels` in `src/data/carModels.ts`:
   ```ts
   'model-1973': {
     key: 'model-1973',
     path: '/models/fusca-1973.glb',
     label: 'VW Fusca 1973 (base)',
     credit: '...',
     calibration: { rotationY: 0, scale: 100.4 }, // scale from inspect-glb; rotationY tuned by screenshot
     partGroupBy: 'material', // or 'node' — whichever names are meaningful (see carParts.ts)
     nodeName: undefined,     // set only if the file bundles more than one car (see model-1968)
   },
   ```
3. Add `useGLTF.preload('/models/fusca-<key>.glb')` at the bottom of `RealCarModel.tsx`.

## Step 2 — Wire the trigger
In `carModels.ts`, point a preset and/or chassis year at the model (see `PRESET_MODEL` /
`CHASSIS_YEAR_MODEL`, consumed by `pickRealModel`). Presets win over chassis year; presets without
their own model fall through to the chassis-year model.

## Step 3 — Verify render (scale + orientation)
Fresh tab → select the trigger. The car should be ~4 m, grounded, upright. If it faces the wrong way,
adjust `calibration.rotationY` (radians). If mis-scaled, adjust `calibration.scale`. The built-in
**model calibration editor** (per-part editor → "Ajuste" → Escala/Girar Y) lets you fine-tune live to
match a real gabarito; persisted per model in `partsStore`.

## Step 4 — Openable parts (`openableParts` in the CarModelDef)
`riggPart()` (`RealCarModel.tsx`) detaches a node into a hinge `THREE.Group` at the node's own
bounding-box edge and rotates it. Config per part:
```ts
{ part: 'doors'|'frontTrunk'|'engineLid', nodeNames: ['<node>'], hingeAxis: 'y'|'x',
  openAngle: 1.1, pivotZ: 'min'|'max', pivotY: 'min'|'max'|'center', openSigns?: [..], splitLeftRight?: bool,
  captureNodes?: ['..'], captureSplitNodes?: ['..'] }
```
- `hingeAxis`: `'y'` = doors (swing out around a vertical edge), `'x'` = lids (swing up).
- `pivotZ`/`pivotY`: which edge of the node hinges — **tune by screenshot** (a lid must hinge at the
  cabin-side top edge and swing the outer tip up; a door at its front vertical edge). Wrong pivot =
  the panel swings through a huge arc / detaches ("opening out of scope").
- `openSigns`: per-node rotation-sign override when the auto sign is wrong.
- **GLTFLoader sanitizes node names** (spaces/`:` → `_`) at load. Match the SANITIZED name; confirm
  by logging loaded node names in the browser, not by reading raw glТF JSON.

**When the part is a SEPARATE node** (e.g. this 1973's `SM_Hood`): list it in `nodeNames` directly.

**When both sides are ONE merged mesh** (e.g. model-1980 `porte_1` = both doors): set
`splitLeftRight: true` — `splitNodeByWorldX()` splits its triangles by world-X into two hinged doors.

**When the part is FUSED into the body shell** (this 1973's doors live inside `SM_Base`; no door
node): the panel itself can't be detached cleanly. Two tools:
- `captureNodes: [...]` — per-side DETAIL meshes (handle, mirror, weatherstrip) that live as their own
  meshes are whole-reparented to the nearest door hinge so they swing with the door.
- `captureSplitNodes: [...]` — a mesh whose door part is fused into a bigger glass/trim mesh (door
  window baked with the quarter glass; belt-line friso running into the fenders) is TRIANGLE-SPLIT by
  each door panel's X/Z footprint; each door takes its slice, the rest stays.
For a door fused into the painted body with no separate door node at all, opening it requires either a
re-export with a separated door mesh, or splitting `SM_Base` by the door region (advanced) — document
the limitation if not doing it.

Hinges are tagged `userData.isHinge = true` so the per-part transform editor skips articulated parts.

## Step 5 — Wheels
The 3 bundled wheel `.glb` assets are inconsistent (two render without a tire), so real-model wheels
render the **procedural `Wheel.tsx`** (always tyred; varies by `rimStyle`/`tireProfile`/`rimColor`),
scaled to the measured baked-wheel diameter. To enable the swap, add `wheelMounts` naming the baked
wheel node(s) to hide + measure (`measureWheelMount` derives hub position + diameter at runtime;
`splitLeftRight` if one node merges both wheels of an axle). Omit `wheelMounts` to keep the model's
own baked wheels (fine when they already look right, as on this 1973).

## Step 6 — Interior
If the model has its own cabin, leave `hasInterior` default (true). If it's an exterior-only shell,
set `hasInterior: false` — `RealInterior` overlays 1968's dashboard/seats, placed by reproducing
1968's own interior-to-body bbox relationship; set `interiorFlipZ: true` if the model faces −Z.

## Step 7 — Body paint (recolor)
`useBodyPaint` recolors the dominant paint material to the selected exterior color + finish. It
auto-detects the largest opaque non-glass material; if the paint is split across several materials or
white-with-texture, pin them with `paintMaterialNames: ['..']`. Set `recolorable: false` to opt a
model out entirely (e.g. all-rust textures). Textured paint has its base-color map dropped so the
color reads cleanly.

## Step 8 — Engine
Models with a working `engineLid` also get `EngineBlock` + a body-coloured `EngineBay` cradle (the
shells are hollow, so the bay hides the dark interior). Constants in `RealCarModel.tsx`
(`ENGINE_*`). No config needed beyond having an `engineLid` openable part.

## Step 9 — Per-part editor + labels
`partGroupBy` groups the model's meshes into named parts (by node base name or material). Friendly PT
labels live in `PART_LABELS` in `src/data/carParts.ts` — add entries for this model's key part names
(node bases or material names) so the "Peças" panel reads well; unknown keys fall back to a
prettified raw name.

## Step 10 — Keep specs in sync
Update [.specs/3d-model.spec.md](../../../.specs/3d-model.spec.md): the model table, and any new
openable/wheel/paint config. Update `CREDITS.md` with the asset's license/source.

## Verification checklist (fresh tab)
- Loads at ~4 m, grounded, upright; correct trigger selects it.
- Exterior color repaints it; each configured door/hood/engine-lid opens the right way and stays
  attached; wheels tyred + consistent size; interior visible; per-part editor lists sensible parts.
- `node_modules/.bin/tsc -b` clean; no console errors.
