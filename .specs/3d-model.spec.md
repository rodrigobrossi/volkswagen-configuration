# 3D Model Spec — `FuscaModel.tsx` / `Wheel.tsx` / Real GLTF Models

**Status: final spec, fully implemented.** The viewer now shows **real GLTF models** (see §
"Real GLTF Models" below) for the presets/eras that have one, and falls back to the fully
config-reactive **primitive-geometry placeholder** described in the rest of this document for
everything else. Every section is marked **[implemented]**; if code ever drifts from this doc,
that's a bug in one of the two — fix whichever is wrong, don't let them diverge silently.

## Real GLTF Models — [implemented]

4 real, licensed 3D models (see [CREDITS.md](../CREDITS.md)) render in place of the primitive
body for specific style presets/eras — an actual detailed mesh beats any amount of primitive
tuning. Selection logic lives in `src/data/carModels.ts` (`pickRealModel`), rendering in
`src/components/RealCarModel.tsx`, and the decision between real/primitive in
`src/components/CarModel.tsx` (used by `Scene.tsx` in place of `FuscaModel` directly).

| Trigger | Model | File |
|---|---|---|
| `cal-look` preset | VW Beetle Florida (Cal Look) | `fusca-callook.glb` |
| `rat-look` preset | Old VW Bug (Rat Look) | `fusca-ratlook.glb` |
| `resto-stock` preset | 1968 Volkswagen Beetle | `fusca-1968.glb` |
| `oval-59-65` chassis year, no preset active | VW Typ 11 (1948) | `fusca-1948.glb` |
| `round-66-70` chassis year, no preset active | 1968 Volkswagen Beetle | `fusca-1968.glb` |
| Everything else (`baja-bug`, `rebaixado-br`, `meu-fusca` presets; `square-71-85`/`itamar-86-96` with no preset) | — | primitive `FuscaModel` |

Priority: an **active style preset wins over chassis year** — e.g. `baja-bug` (whose
`chassisYearId` is `round-66-70`) does *not* fall back to the stock 1968 model, which would
misrepresent a raised/off-road build as a clean stock car. Chassis-year-only matching applies
only when no preset is active (freeform tweaking). This is deliberate, not a gap: there's no
real model for `square-71-85` (the user's own reference-car era) or `itamar-86-96` among what
was sourced — the primitive placeholder remains the only option there, and that's fine.

**Two-cars-in-one-file gotcha**: `fusca-1968.glb` bundles two separate car objects in its scene
(an artifact of the source Sketchfab upload) — one clean, one with a broken/floating geometry
chunk (confirmed visually). `RealCarModel` renders only the node named
`1968_Volkswagen_Beetle_(new)_38` (**note the underscores** — three.js's `GLTFLoader` sanitizes
node names, spaces become underscores, at load time; matching against the raw glTF JSON's name
silently fails and falls back to rendering the whole scene, i.e. both cars overlapping — this
bit once already, see `.claude/memory/context.md`).

**Per-model calibration** (`carModels.ts`, `CarModelDef.calibration`): each of the 4 files was
authored by a different artist at a different native unit scale (`fusca-callook.glb` ~100x
meters, `fusca-1948.glb` ~1/5.6 of meters, the other two already ~meters) and not necessarily
facing the same direction. X/Z centering and ground contact (Y) are **computed automatically**
from each object's bounding box in `RealCarModel.tsx` — only `rotationY` and `scale` are
manually tuned per model, and both were derived from logged bounding-box numbers divided into
the target `LENGTH` (below), not guessed, then confirmed by screenshot.

**When a real model is active**: wheel style, exterior color, interior, steering wheel, and
openable-parts (doors/trunk/engine-lid) selections still update `configStore` normally, but
**do not visually apply** to a real model — none of the 4 files are segmented with
identifiable per-part nodes (materials range from clearly-named in `fusca-1968.glb` to fully
generic `material0000..0007` in `fusca-ratlook.glb`), so per-model material overrides or a
door-opening rig were out of scope for this pass. `ConfigPanel.tsx` shows an inline hint
(`.real-model-hint`) when this is the case, rather than hiding/disabling the controls.

## Real-world dimensions (source of truth — 1 Three.js unit = 1 meter) — [implemented]

| Constant | Value | Notes |
|---|---|---|
| `LENGTH` | 4.07 m | overall length |
| `WIDTH` | 1.55 m | overall body width (fenders) |
| `HEIGHT` | 1.50 m | ground to roof apex |
| `WHEELBASE` | 2.40 m | front-to-rear axle distance |
| `TRACK` | 1.30 m | left-to-right wheel-center distance (narrower than `WIDTH` — fenders bulge past the wheel centerline) |
| `WHEEL_RADIUS` | 0.32 m | tire outer radius (15" steel wheel + tire) |

These are named constants in `FuscaModel.tsx`/`Wheel.tsx`; every mesh position/scale is derived
from them (a literal value or a fraction of one) — no unrelated magic numbers. If a future GLTF
import replaces the placeholder body, these constants still apply to wheel placement, door/trunk
hinge points, and camera framing.

## Exterior body — [implemented]

The body is **4 overlapping ellipsoids, not 1** — a single symmetric shell reads as a blob/egg,
not a car (see `.claude/memory/context.md`, 2026-07-17 entry, for why):

- `LOWER_BODY` — wide, low, spans nearly the full length.
- `HOOD` — low, tapering, front. Doubles as the **front trunk lid** (see Openable Parts).
- `REAR_DECK` — low, tapering, rear, slightly taller than `HOOD`. Doubles as the **engine lid**
  (see Openable Parts).
- `CABIN` — **distinctly narrower and taller** than `LOWER_BODY`, rear-biased. The width/height
  gap between `CABIN` and `LOWER_BODY` is what creates a visible shoulder/beltline — the one
  detail that most determines whether it reads as a car. Do not collapse these back into one shell.
- **Fender arches**: a half-torus (`arc ≈ 1.1π`, standing in the Y-Z plane via
  `rotation.y = π/2`) over each wheel, body-colored, so wheels visually tie into the body instead
  of floating underneath with a gap.

All fit inside the `LENGTH`×`WIDTH`×`HEIGHT` envelope. Color/finish reactive to `exteriorColorId`.

**Glass**: windshield/side/rear glass is one nested ellipsoid (`CABIN`-fitted) split visually by
pillars — see `Pillar` in `FuscaModel.tsx`. Two side door windows (left + right only — the Fusca
is a 2-door car).

**Fixed trim**: running boards, front/rear bumpers (chrome), chrome beltline trim strip (each
side, at the `CABIN`/`LOWER_BODY` shoulder line), hood centerline seam, rear engine-lid vent
louvers (must move with the engine lid when it opens — see below).

**Lights**:
- **Headlights** (2, round, front).
- **Front turn signal indicators** (2, amber, mounted on top of the front fenders between the
  headlights and windshield — matches `reference/fusca-photos/`, not just invented).
- **Taillights** (2, shape reactive to `chassisYear.taillightShape`: `round | square |
  vertical-oval`) are **two-toned**: an amber turn-signal section over a red brake/tail section,
  stacked vertically — not a single uniform red blob. Matches the reference photos, which show
  amber-over-red taillights.

**Mirrors**: 2, mounted near the A-pillar (front edge of the door) — mount arm + housing +
dark glass face, body-colored housing reactive to `exteriorColorId`.

**Wheels**: rim geometry (not just color) varies by `wheelOptions[selected].rimStyle` — see
`Wheel.tsx`:
- `hubcap` — solid disc + raised dome center, for steel/hubcap-style wheels.
- `five-spoke` — 5 distinct radiating spokes + outer rim lip + small center hub (EMPI-style).
- `multi-spoke` — 10 thin spokes + outer rim lip + small center hub (BRM-style).
Both faces of each wheel render the spoke pattern (see `WheelFace` in `Wheel.tsx`).

## Openable parts — [implemented]

Real behavior being modeled, in Portuguese where that's the natural term:

| Part | PT term | Hinge | Opens |
|---|---|---|---|
| Front trunk lid | porta-malas | top/rear edge of `HOOD` (near the cowl) | up and forward (rotate around local X) |
| Engine lid | tampa do motor | top/front edge of `REAR_DECK` (near the cabin) | up and backward (rotate around local X) |
| Both doors | portas | front edge of the door panel (vertical axis) | outward, swinging forward (rotate around local Y) |

Rules:
- State lives in `configStore`: `doorsOpen`, `frontTrunkOpen`, `engineLidOpen` (booleans,
  default `false` — car starts closed). One `doorsOpen` boolean controls **both** doors
  symmetrically; independent left/right control is future work, not required now.
- Each openable part is its own mesh (or group of meshes, e.g. the engine lid + its vent
  louvers) wrapped in a `<group>` positioned at the hinge point, with the mesh offset from that
  group's local origin — rotating the group swings the part around the hinge, not around its
  own center. This is the same "wrap in a group positioned at the pivot" pattern already used
  for the body-lift suspension group.
- Doors need a **real door panel mesh** distinct from the body (the old crease-only
  representation — a seam line painted onto the body — cannot open, since there's nothing to
  rotate). The panel approximates the door's curved area with a flat-ish box; it won't perfectly
  seam-match the underlying curved `LOWER_BODY`/`CABIN` shells at all rotation angles — that's
  an accepted approximation for a primitive placeholder, not a bug to chase further.
- No physics/collision — parts can open regardless of camera angle or each other; this is a
  visual toggle, not a simulation.
- Toggle controls live in `ConfigPanel.tsx` under an "Openable Parts" section (see
  [config-panel.spec.md](config-panel.spec.md)).

## Interior — [implemented, with a documented approximation]

- **Dashboard**: a low dark panel spanning the cabin width at the front of the interior,
  roughly where the real dash sits (below the windshield, above the pedal area).
- **Steering wheel**: a torus (rim) + 2 spokes + column, driver's side, reactive to
  `steeringWheelOptions[selected].rimMaterial`:
  - `plastic` → black, standard tube thickness
  - `wood` → warm brown/wood-tone rim color
  - `sport` → dark grey/black, thinner tube (slimmer "banana" look)
  This is the concrete "steering wheel must be visible" requirement.
- **Seats** (driver + passenger, simplified as a cushion + backrest box pair): color reactive to
  `interiorOptions[selected].hex`.
- **Visibility is a deliberate approximation, not true occlusion**: the exterior body (§ Exterior
  body above) is 4 *solid* overlapping ellipsoids with no actual cavity anywhere — `LOWER_BODY`
  and `CABIN` together solidly fill the car's entire cross-section, so anything positioned
  "inside" is geometrically buried in opaque paint regardless of glass transparency or door
  state. Confirmed by point-in-ellipsoid math, not just by looking at a render — see
  `.claude/memory/context.md` 2026-07-17 entry. Fix shipped: all interior meshes render with
  `depthTest={false}` and a higher `renderOrder` (`INTERIOR_RENDER_ORDER` in `FuscaModel.tsx`),
  i.e. they draw on top unconditionally. This means the interior is **always visible from any
  angle**, not actually hidden by closed doors/body — an intentional "always visible" cheat, not
  a bug. Revisit only if/when the body gets real hollow geometry (GLTF rework, `docs/SDD.md` §6).
- The `ConfigPanel.tsx` spec sheet's old "not visually modeled" caveat for steering wheel and
  interior is removed — see [config-panel.spec.md](config-panel.spec.md).

## Materials — [implemented]

- **Body paint**: physical material with clearcoat (`clearcoat`, `clearcoatRoughness`) for an
  automotive-gloss look. `finish` (`gloss | matte | metallic | patina`) drives
  roughness/metalness/clearcoat intensity.
- **Glass**: dark, semi-transparent, distinct from body paint.
- **Chrome trim** (bumpers, handles, running boards): high metalness, low roughness.
- **Interior**: seats use `meshStandardMaterial` at moderate roughness (fabric/vinyl, not
  glossy); steering wheel rim material varies by `rimMaterial` per the table above.

## Accuracy criteria (vs. the reference vehicle)

- Every dimension in the table above must stay within the tolerances implied by
  `reference-vehicle.spec.md` — if reference photos/video are re-measured and a constant
  changes, update this table and the code constants together, in the same change.
- "Accurate" for this placeholder means: correct proportions (§ dimensions), a body composition
  that reads unambiguously as a Beetle silhouette (§ exterior body), and config-reactive details
  matching what's visible in `reference/fusca-photos/` (taillight shape, wheel style, steering
  wheel style). It does **not** mean pixel-accurate panel lines or a photoreal surface — that
  requires the GLTF rework tracked in `docs/SDD.md` §6, not more primitive tuning.
- When in doubt about a shape/proportion question, check the photos in
  `reference/fusca-photos/` before guessing — it's local, git-ignored, and free to consult.

## Explicitly out of scope for the placeholder

- Photoreal image textures / UV-mapped materials (needs a real mesh + texture pipeline — future GLTF work).
- Independent left/right door control, or any part opening via physics/animation easing — instant open/closed toggle only.
- Occlusion-correct interior cutaway geometry (see Interior section above).
- Engine bay detail beyond the existing vent louvers — no visible engine block, even with the lid open.
