# Project Memory / Context Registry

Running log of project context and decisions for the Fusca 3D Configurator, for any Claude
Code session (or the `/add-catalog-option` skill) to read before making changes. Newest entries
at the top. This is a project-committed file (not personal/cross-session memory) — it travels
with the repo.

For the current architecture/data-model reference, see [docs/SDD.md](../../docs/SDD.md) and
[.specs/](../../.specs/) — this file is the *history/rationale* log, not the current-state doc;
update those when structure changes, and add an entry here for *why*.

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
