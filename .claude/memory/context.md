# Project Memory / Context Registry

Running log of project context and decisions for the Fusca 3D Configurator, for any Claude
Code session (or the `/add-catalog-option` skill) to read before making changes. Newest entries
at the top. This is a project-committed file (not personal/cross-session memory) — it travels
with the repo.

For the current architecture/data-model reference, see [docs/SDD.md](../../docs/SDD.md) and
[.specs/](../../.specs/) — this file is the *history/rationale* log, not the current-state doc;
update those when structure changes, and add an entry here for *why*.

---

## 2026-07-17 (very late) — 5th real model, real openable doors, engine block, interior merge

- **5th real model**: `fusca-1980.glb` (VW 1303 "Super Beetle", Configcars/maxipub, CC-BY-4.0),
  wired to the `meu-fusca` preset and the `square-71-85` chassis year — closes the gap flagged
  in the previous entry (no real model matched the user's own reference-car era). Exterior-only
  (confirmed via its node list: only body panels/trim/glass/lights, no seat/dash naming).
- **Real doors/hood/engine-lid now actually open** on 3 of the 5 models
  (`fusca-1968.glb`/`fusca-callook.glb`/`fusca-1980.glb`, whichever have segmented node names —
  see `CarModelDef.openableParts`). Generalized `RealCarModel.tsx`'s single-object rendering
  into a `riggPart()` mechanism: detach the named node(s), reparent under a hinge `THREE.Group`
  at the node's own bounding-box edge, rotate that group on toggle.
  - **Hard bug, worth remembering**: initial version called `node.parent.remove(node)` *before*
    `hinge.attach(node)`. `Object3D.attach()` reads `object.parent.matrixWorld` to correctly
    compose the reparented transform, and handles the actual detach itself (via `add()`) —
    nulling `node.parent` first makes `attach()` silently skip that composition step and fall
    back to the node's raw pre-parent-chain local matrix. This looked fine for shallow nodes but
    catastrophically scrambled `fusca-1968.glb`'s hood/trunk (nested under `Root_37`/`Body_35`,
    which carry an FBX-export Z-up→Y-up axis-conversion rotation that only cancels out once
    properly composed through the full parent chain) — full-car rendering corruption, visible
    even with all parts closed, since the bug is in the static rigging, not the toggle. Took a
    long isolate-by-disabling-parts-one-at-a-time pass to pin down. Fix: don't manually detach —
    just call `hinge.attach(node)` while the node still has its original parent.
  - CalLook's real door (`Door_R.001` subtree) was measured and used to correct the procedural
    model's `DOOR_WIDTH`: was a guessed `0.7`, measured real value is `1.01` (~25% of the car's
    4.07m length) — the door was previously noticeably too narrow.
- **Engine block**: `src/components/EngineBlock.tsx`, a new shared component wrapping
  `public/models/engine/scene.gltf` (no `license.txt` bundled — included on the project owner's
  explicit confirmation of the source, see CREDITS.md). Self-centers, takes
  `position`/`scale`/`rotation` props. Rendered in the procedural engine bay (`FuscaModel.tsx`)
  and in `fusca-1980.glb`'s real engine bay (`RealCarModel.tsx`, positioned via that model's own
  `engineLid` hinge pivot) — both **only while the engine lid is open**, and both with
  `depthTest={false}` + high `renderOrder`, since neither bay is a true hollow cavity.
- **Interior merge**: extracted `FuscaModel.tsx`'s dashboard/steering-wheel/seats into a shared
  `src/components/CarInterior.tsx` (position-parameterized), merged into `fusca-1980.glb` and
  `fusca-1948.glb` (`CarModelDef.hasInterior: false` — neither has baked-in cabin geometry).
  - **Placement is fraction-of-bounding-box, not absolute coordinates** —
    `interiorAnchor.heightFraction`/`depthFraction` (0..1 across the model's own *runtime*
    height/length), deliberately not fixed native-unit numbers. First attempt used absolute
    coordinates computed *offline* from each `.glb`'s declared accessor min/max (via a
    standalone Node script parsing the raw glTF JSON) — this placed the interior floating above
    the roofline in-browser. The offline accessor-based bbox didn't match what
    `THREE.Box3.setFromObject` computes from the actual loaded geometry closely enough to use
    directly. Fraction-of-bounding-box sidesteps the mismatch entirely (self-corrects to
    whatever the runtime box actually is) and was confirmed by screenshot on both models.
  - Real models' "front" is `-Z` (per their `openableParts` `pivotZ:'min'` on the front trunk)
    vs. the procedural model's `+Z` — `CarInterior`'s shared steering/seat relative-offset
    constants are Z-mirrored when reused in `RealCarModel.tsx`.
- **R3F + Vite Fast Refresh gotcha, worth remembering**: while debugging the above, added
  `console.error`/`document.title` probes inside `RealCarModel`'s render body and a `useEffect`
  — none of them ever fired, across many edits and full `location.reload()`s, even though
  `curl`-fetching the served module confirmed the new code was there and a *module-level*
  `console.error` (outside the component function) fired reliably on every reload. Root cause:
  components rendered inside `<Canvas>` don't reliably hot-reload via React Fast Refresh, since
  React Three Fiber's custom reconciler isn't the one Vite's Fast Refresh plugin integrates
  with — an already-mounted instance can keep running the *old* closure indefinitely. If a debug
  log inside a Canvas-tree component ever seems to silently not fire, don't assume the code
  path isn't reached — hard-reload harder (cache-busted URL) or just switch to a
  runtime-introspection-free approach (this session ended up using the fraction-of-bounding-box
  redesign above instead of chasing the introspection further, which turned out cleaner anyway).
- All 5 models' assets, `CREDITS.md`, `.specs/3d-model.spec.md`, and `docs/SDD.md` updated to
  match — see those for the current-state reference, this entry is just the *why*.

## 2026-07-17 (night) — Real GLTF models integrated: 4 licensed Beetles, preset/era-keyed swap

- User asked me to find a free Beetle GLTF and integrate it. Sketchfab has models but gates
  *all* downloads behind account login, even CC0/free ones — I can't create an account on the
  user's behalf, so I couldn't fetch one automatically. User downloaded models manually instead
  and ended up sourcing **4 distinct, real, licensed models** covering different eras/styles,
  not one model to parametrically reconfigure:
  - `1948/` → VW Typ 11 1948 (Peter Boehm, CC-BY-4.0)
  - `1968/` → 1968 Volkswagen Beetle LP (KrStolorz, Sketchfab Standard)
  - `Style/CalLook/` → VW Beetle Florida v2 (Libau Media, CC-BY-4.0)
  - `Style/ratlook/` → Old VW Bug (jtressle, CC-BY-4.0)
  All confirmed commercially usable by reading each bundled `license.txt` directly, not assumed.
  3 need attribution (now in `CREDITS.md`); Sketchfab Standard doesn't strictly require it but
  got credited anyway.
- **The 1968 file bundles two car objects in one scene** (`"1968 Volkswagen Beetle (new)_38"`,
  clean; `"Volkswagen Beetle (old)_64"`, has a broken/floating geometry chunk) — confirmed by
  parsing the raw glTF JSON with a Node script, then visually by rendering both side-by-side in
  a temporary debug harness (`GltfInspector.tsx` + `?inspect=1` route, since removed). Resolved
  by rendering only the "new" node at runtime (`findByName` in `RealCarModel.tsx`), not by
  physically editing the binary file.
- **Real bug, real lesson**: raw glTF JSON showed the node name with *spaces*
  (`"1968 Volkswagen Beetle (new)_38"`); three.js's `GLTFLoader` sanitizes node names at load
  time (spaces → underscores), so the actual runtime name is
  `"1968_Volkswagen_Beetle_(new)_38"`. Using the raw-JSON name in `carModels.ts` silently
  matched nothing and fell back to rendering the *whole* scene (both bundled cars overlapping) —
  caught by screenshot, not by any thrown error. **Always verify node names against what
  `useGLTF` actually loads in the browser, never against the raw file's JSON.**
- **Every model needed different scale/position calibration** — each was authored by a
  different artist at a different native unit scale: `fusca-callook.glb` ~100x too large
  (~226×152×388 units, needed `scale: 0.0105`), `fusca-1948.glb` ~5.6x too small (~0.27×0.26×0.72
  units, needed `scale: 5.62`), `fusca-1968.glb` and `fusca-ratlook.glb` already ~meters
  (`scale: 1`). Determined by temporarily logging each object's `THREE.Box3` bounding size
  (`console.log` in a `useEffect`, removed once calibrated) and dividing the real target length
  (4.07m, from `.specs/3d-model.spec.md`) by the logged length — not guessed. X/Z centering and
  Y ground-contact are computed automatically from the bounding box every render in
  `RealCarModel.tsx` (not hardcoded), so only `rotationY` and `scale` need manual tuning per
  model. CalLook also needed a 180° `rotationY` flip — rendered rear-first by default.
- **Design call**: swap the whole visible car per style-preset/chassis-year rather than trying
  to make one external mesh reactive to every config option. None of the 4 files have
  identifiable per-part nodes (materials range from clear names in `fusca-1968.glb` to fully
  generic `material0000..0007` in `fusca-ratlook.glb`) — real per-model wheel/color/door
  wiring would need hours of manual trial-and-error per file. Mapping logic
  (`pickRealModel` in `carModels.ts`) explicitly gives **style preset priority over chassis
  year** — `baja-bug` (whose era is `round-66-70`) must NOT silently show the clean stock 1968
  model, which would misrepresent a raised/off-road build. `ConfigPanel` shows an inline hint
  when a real model is active instead of hiding the now-inert wheel/color/door controls (kept
  the panel code simpler; the controls still update the store correctly for when the user
  switches back to a procedural preset).
- Committed `public/models/*.glb` (~45MB total) to git — licenses are unambiguous enough
  (CC-BY-4.0 ×3, Sketchfab Standard ×1) to justify it, unlike `reference/fusca-photos/` (the
  user's personal photos, still git-ignored) or `reference/gltf-models/` (an earlier debug-only
  copy, since deleted along with the rest of the investigation scaffolding).

## 2026-07-17 (evening) — Mirrors, indicators, two-tone taillights, wheel spoke geometry

- User asked for the model to "consider glass windows and everything that details this model":
  mirrors, indicator (turn signal) lights, front/rear headlights, and wheels that look like
  their real style rather than just changing color.
- Added `WheelOption.rimStyle` (`hubcap | five-spoke | multi-spoke`) to `data/fusca.ts` and
  rewrote `Wheel.tsx`'s rim rendering (`WheelFace`) to build actual spoke geometry per style
  (N boxes fanned out via `rotation.y` steps in the disc's own local plane + a torus rim lip +
  center hub) instead of one flat colored disc. Mapped existing wheels: EMPI → `five-spoke`,
  BRM → `multi-spoke` (10 thin spokes), everything else → `hubcap`. Verified all three read as
  visually distinct in the browser (EMPI's 5 spokes, BRM's dense 10-spoke pattern, plain hubcap).
- Added side mirrors (arm + housing + dark glass face, body-colored) near the A-pillar, reusing
  `DOOR_X`/`DOOR_HINGE_Z` for positioning rather than new magic numbers.
- Added front turn-signal indicators (amber, fender-mounted between headlight and windshield) —
  a detail directly visible in `reference/fusca-photos/`, not invented.
- Taillights are now **two-toned** (amber turn-signal section stacked over red brake/tail
  section) for all three `taillightShape` variants, instead of a single uniform red blob —
  also matches the reference photos, which clearly show amber-over-red rear lights.
- Added a chrome beltline trim strip (each side, at the `CABIN`/`LOWER_BODY` shoulder line) —
  covers the "everything that details this model" / window-trim part of the ask without trying
  to wrap a literal chrome ring around the curved glass dome (would hit the same
  straight-element-vs-curved-surface problem as the door/pillar work earlier — not worth it for
  a thin trim strip that reads fine as a straight line at the relatively flat beltline region).
- Updated `.specs/3d-model.spec.md` (Exterior body, new Lights/Mirrors/Wheels subsections) and
  `.specs/data-model.spec.md` (added `rimStyle`, corrected `SteeringWheelOption`/`InteriorOption`
  rows that were stale from the earlier "data-only" era) in the same change.

---

## 2026-07-17 (later still) — Openable doors/trunk/engine lid + interior, final 3d-model.spec.md

- User asked to make `.specs/3d-model.spec.md` the "final version," covering interior,
  opening doors, a visible steering wheel, opening front trunk (porta-malas) and engine lid
  (tampa do motor), and accuracy vs. the reference car. Rewrote the spec to cover all of it
  (marked `[implemented]` vs `[target]`), then implemented the target sections rather than
  leaving them as pure documentation — see `.specs/3d-model.spec.md` for the current spec.
- **Trunk/engine lid**: reused the existing `HOOD`/`REAR_DECK` meshes as the lids, wrapped each
  in a `<group>` positioned at a hinge point (near the cowl for the trunk, near the cabin for
  the engine lid) with the mesh offset from that group's local origin — rotating the group
  swings the part around the hinge instead of its own center. `configStore.frontTrunkOpen` /
  `engineLidOpen` booleans drive the rotation directly (no easing/animation). Verified both
  open convincingly in the browser on the first working attempt once the hinge-offset math was
  right — no sign-flip debugging needed this time (see the rotation.y torus lesson below from
  earlier in the day, applied proactively here for the X-axis rotations).
- **Doors**: the old crease-only "seam painted on the body" couldn't open — nothing to rotate.
  Replaced with a real box panel mesh, hinged at its front edge (`rotation.y`, not `rotation.x`
  like the lids since doors swing on a vertical axis). Bug caught by screenshot: first pass
  hardcoded the panel color to black instead of `exteriorColor.hex` — always check a new mesh's
  material against the existing color-reactive pattern before screenshotting, not after.
- **Interior visibility — a real structural limitation, not just tuning**: the exterior body is
  4 *solid* overlapping ellipsoids (see the shoulder/beltline entry above) with no actual cavity
  anywhere — `LOWER_BODY` and `CABIN` together solidly fill the entire y-range of the car, so
  anything positioned "inside" (dashboard, seats, steering wheel) is geometrically buried inside
  opaque paint regardless of doors or window transparency. Confirmed this by hand (ellipsoid
  point-in-solid test) before trying to fix it, rather than guessing from the render. Real fix
  would be hollowing the shells (no CSG available without an extra library) — out of scope for
  now. Pragmatic fix shipped instead: interior meshes render with `depthTest={false}` + a higher
  `renderOrder`, i.e. they always draw on top regardless of what's technically in front. This is
  a deliberate, documented approximation (see `.specs/3d-model.spec.md` Interior section) — an
  "always visible" cheat, not true occlusion. If this ever gets confusing to look at from some
  angle, that's the mechanism to revisit, not a rendering bug to chase.
- **Steering wheel** reacts to `steeringWheelOptions[selected].rimMaterial` (color + tube
  thickness); **seats** react to `interiorOptions[selected].hex`. Both previously data-only,
  spec-sheet-only fields — removed from the `ConfigPanel` spec sheet now that they're rendered
  (see `.specs/config-panel.spec.md`).
- New `ConfigPanel` "Openable Parts" section: 3 toggle buttons (Doors / Porta-malas / Tampa do
  Motor), Portuguese labels for the two engine-compartment ones since that's the natural term
  for this product (PT-BR first, per `docs/SDD.md`).

## 2026-07-17 (later) — Body shape overhaul: single ellipsoid doesn't read as a car

- User feedback after the first fidelity pass (screenshot attached): still "far from a beetle,"
  proportions wrong, doors/windows too subtle to register. Root cause: a single stretched
  sphere is front-back *symmetric* and has no visible break between "body" and "roof" — no
  amount of recalibrating one ellipsoid's dimensions fixes that, it will always read as an egg.
- Rebuilt the body as **4 overlapping ellipsoids** instead of 1: a wide low `LOWER_BODY`
  spanning nearly the full length, a low tapering `HOOD` (front) and slightly taller
  `REAR_DECK`, and a distinctly **narrower + taller + rear-biased** `CABIN`. The width/height
  gap between `CABIN` and `LOWER_BODY` is what creates a visible shoulder/beltline — this was
  the single biggest lever for "looks like a car" vs "looks like a blob." See
  `.specs/3d-model.spec.md` for the exact constants.
- Added smooth fender arches (a half-torus per wheel, `rotation.y = Math.PI/2` to stand it in
  the Y-Z plane, `arc = Math.PI * 1.1`) so wheels visually tie into the body instead of looking
  like separate cylinders poking out underneath. First attempt used a chain of small spheres
  along the arc — worked but read as a "pearl necklace," replaced with a single torus mesh once
  verified the rotation/arc-direction math was right (checked via screenshot, not assumed).
  **The torus arc-direction convention that worked**: local angle 0 sweeps from local +X; after
  `rotation.y = Math.PI/2`, local +X maps to world -Z, so arc sweeps from -Z through +Y (top)
  toward +Z — i.e. an arc from `0` to `π` traces back-to-front over the top of the wheel.
- Also bumped up window-pillar and door-crease thickness (0.02→0.03, height ×1.7→×1.8) — they
  were geometrically correct but too thin to read as distinct elements at this scale.
- Lesson for next time: when nesting glass/pillars/doors against a curved primitive body,
  always derive their position/size from that body's own ellipsoid equation (see
  `halfWidthAt()` / `Pillar`'s inline math in `FuscaModel.tsx`) — a straight element at a fixed
  offset will float off a curved surface almost everywhere except the one point it was tuned
  for. This bit twice now (first pass had this bug too, in the single-shell version).

## 2026-07-17 — Specs, skill, memory scaffolding + 3D fidelity pass

- Added `.specs/` — granular per-module specs (data model, 3D model, scene/viewer, config
  panel, style presets, reference vehicle), more prescriptive than the narrative `docs/SDD.md`.
- Added `/add-catalog-option` skill (`.claude/skills/add-catalog-option/`) — the intended way
  to add new wheels/interiors/colors/steering-wheels/engines/chassis-years/presets from now on,
  instead of ad-hoc edits to `data/fusca.ts`.
- Added this memory file, seeded with project history to date.
- **3D model fidelity**: the placeholder body's proportions didn't read as a real Fusca (too
  wide/squat, wheels set too far outboard of the body), and had no doors or distinct windows —
  just one dark "window belt" blob. Reworked `FuscaModel.tsx` to real-world dimensions (length
  4.07m, width 1.55m, wheelbase 2.4m, track 1.3m — see `.specs/3d-model.spec.md`), added
  distinct windshield/rear-window/side-window panes, door seams + handles, running boards, a
  hood seam, rear vent louvers, and switched body paint to a clearcoat physical material.
  **Still not a real mesh** — this is a better-calibrated primitive placeholder, not a GLTF
  import. That remains the biggest open gap (see `docs/SDD.md` §6 / `3d-model.spec.md`).

## 2026-07-16 — Reference vehicle grounding + 360° turntable

- User shared 31 photos + 1 video of their real Fusca (`~/Downloads/Fusca/`). Copied into
  `reference/fusca-photos/`, **git-ignored** — the photos show the visible license plate, so
  they stay local-only by explicit user decision (asked, not assumed).
- Grounded several data entries in the photos: copper metallic color (`meu-fusca-cobre`,
  sampled hex, not an official VW code), steel wheel + small hubcap (`aco-hubcap`), vertical-oval
  taillight shape for the `square-71-85` chassis era. Bundled as the `meu-fusca` style preset.
- Added `chassisYears[].taillightShape` as an explicit field (was previously inferred from
  `bodyStyle` via a boolean in `FuscaModel.tsx`) — taillight shape and body era don't always
  move together historically, and the reference car needed a third shape (`vertical-oval`)
  distinct from the existing `round`/`square` branches.
- Added the 360° auto-rotate turntable: `configStore.autoRotate` (default `true`) feeds
  drei's built-in `OrbitControls autoRotate` — deliberately no custom animation loop. User
  chose "auto-rotate with pause toggle" over "manual-drag-only" or a locked 360-product-viewer
  mode, when asked.
- Went through a formal plan-mode pass for this round of changes at the user's request ("I want
  to use a plan and sdd") — plan file was `binary-growing-wigderson.md`, approved as-is.

## 2026-07-16 — Initial scaffold + working prototype

- Built from a one-line prompt request ("configure a Fusca in 3D, choose wheels/steering
  wheel/suspension height/colors/chassis year/interior/engine/style based on real-world
  references"). User later specified: repo at
  `/Users/rbrossi/Development/volkswagen-configuration`, scope = "scaffold + working prototype"
  (not just a scaffold, not a full build).
- Stack: Vite + React 19 + TypeScript + `@react-three/fiber`/`@react-three/drei` (Three.js) +
  `zustand`. Chosen for: no backend needed (static data + client-side render), R3F/drei is the
  standard React 3D stack with built-in OrbitControls/turntable support, zustand for minimal
  boilerplate over the shared config state.
- **npm/Vite gotcha**: the fresh `create-vite` scaffold defaulted to Vite 8's new rolldown
  bundler, which hit a known npm bug (npm/cli#4828) — platform-specific optional-dependency
  binaries (`@rolldown/binding-darwin-x64`) silently not installing even after cache
  clear + reinstall. Fixed by pinning to stable Vite 6 (esbuild/rollup-based) instead of
  chasing the npm bug further. If `npm run dev` ever fails with "Cannot find native binding"
  again, check `package.json`'s vite version before re-debugging npm.
- **drei `<Environment>` gotcha**: an HDRI environment map fetch hung silently (no console
  error, blank canvas) in this sandboxed/network-restricted dev environment. Removed in favor
  of plain local lighting (ambient + hemisphere + two directionals). Don't reintroduce
  `<Environment>` without confirming outbound network access or self-hosting the HDRI.
- Data/color catalog in `data/fusca.ts` is explicitly a **hand-curated starting reference set**,
  not verified against real VW do Brasil production records — flagged in the file's own header
  comment and in `docs/SDD.md` so it isn't mistaken for authoritative data later.
