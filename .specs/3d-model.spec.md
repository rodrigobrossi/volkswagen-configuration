# 3D Model Spec — `FuscaModel.tsx` / `Wheel.tsx`

Status: primitive-geometry placeholder (no GLTF yet — see [docs/SDD.md](../docs/SDD.md) §6).
This spec defines what the placeholder must get right regardless: real-world proportions and
a recognizable set of body features, not just a rounded blob.

## Real-world dimensions (source of truth — 1 Three.js unit = 1 meter)

| Constant | Value | Notes |
|---|---|---|
| `LENGTH` | 4.07 m | overall length |
| `WIDTH` | 1.55 m | overall body width (fenders) |
| `HEIGHT` | 1.50 m | ground to roof apex |
| `WHEELBASE` | 2.40 m | front-to-rear axle distance |
| `TRACK` | 1.30 m | left-to-right wheel-center distance (narrower than `WIDTH` — fenders bulge past the wheel centerline) |
| `WHEEL_RADIUS` | 0.32 m | tire outer radius (15" steel wheel + tire) |

These must be defined as named constants in `FuscaModel.tsx`/`Wheel.tsx` and every mesh
position/scale derived from them (as a literal value or a fraction of one) — no unrelated
magic numbers. If a future GLTF import replaces the placeholder body, these constants still
apply to wheel placement and camera framing.

## Required visual elements

A conforming render must include, all reactive to the config store where noted:

- **Wheels** (4) at `±TRACK/2` × `±WHEELBASE/2`, wheel style/tire profile reactive — see `Wheel.tsx`.
- **Body shell**: front hood, main cabin, rear engine cover, fit inside the `LENGTH`×`WIDTH`×`HEIGHT` envelope. Color/finish reactive to `exteriorColorId`.
- **Windshield** — a distinct raked glass pane at the front of the greenhouse, not merged with the side/rear glass into one shape.
- **Rear window** — a distinct raked glass pane at the back, smaller than the windshield.
- **Two side door windows** (left + right only — the Fusca is a 2-door car, no rear doors) — distinct rectangular panes at door height.
- **Two doors** (left + right), each with:
  - A visible seam/outline (front edge, rear edge, sill) distinguishing the door panel from the rest of the body.
  - A door handle (small chrome/metallic mesh).
- **Running boards** — a chrome strip along each sill, below the doors.
- **Front and rear bumpers** — chrome, reactive to nothing (fixed trim).
- **Headlights** (2, round) and **taillights** (2, shape reactive to `chassisYear.taillightShape`: `round | square | vertical-oval`).
- **Hood seam** — a subtle centerline groove on the front hood (visible on real Fuscas).
- **Rear engine-lid vent louvers** — a small set of parallel strips on the rear cover, matching `reference/fusca-photos/`.
- **Suspension height** shifts the whole body+trim group vertically (wheels stay planted) — unchanged from current behavior.

## Materials

- **Body paint**: physical material with clearcoat (`clearcoat`, `clearcoatRoughness`) for an
  automotive-gloss look, not a flat `meshStandardMaterial`. `finish` (`gloss | matte | metallic
  | patina`) still drives roughness/metalness/clearcoat intensity.
- **Glass** (windshield/rear window/side windows): dark, semi-transparent, distinct material
  from body paint and from each other only in transparency/tint — shape is what differentiates them.
- **Chrome trim** (bumpers, handles, running boards, window surrounds): high metalness, low
  roughness, consistent across the model.

## Explicitly out of scope for the placeholder

- Photoreal image textures / UV-mapped materials (needs a real mesh + texture pipeline — future GLTF work).
- Opening doors/animated parts.
- Interior geometry visible through the windows (interior choice stays spec-sheet-only per [config-panel.spec.md](config-panel.spec.md)).
