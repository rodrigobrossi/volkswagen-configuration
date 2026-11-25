---
id: SPEC-procedural-renderer
type: spec
title: Procedural renderer (vw-type1) — the primitive fallback car
status: active
tags: [spec, render, procedural]
links: [VEH-vw-type1, SPEC-catalog, SPEC-rendering, SPEC-reference-vehicle, CON-vehicle-family]
code: [src/render/procedural/FuscaModel.tsx, src/render/procedural/Wheel.tsx, src/render/procedural/CarInterior.tsx, src/render/VehicleView.tsx]
updated: 2026-11-13
---

# Procedural renderer — `vw-type1-procedural`

Shown when no real model resolves (today: era `itamar-86-96` with no preset). Built from primitives,
**fully reactive** to every option role. It is a placeholder with correct proportions, not a likeness.

## Dimensions (1 unit = 1 m) — named constants, every mesh derives from them
| Constant | Value | Note |
|---|---|---|
| `LENGTH` | 4.07 | overall length |
| `WIDTH` | 1.55 | body width at the fenders |
| `WHEELBASE` | 2.40 | axle to axle |
| `TRACK` | 1.30 | wheel centre to centre (narrower than `WIDTH`) |
| `WHEEL_RADIUS` | 0.32 | 15" steel wheel + tyre |
| `DOOR_WIDTH` | 1.01 | measured from a real Beetle door (~25 % of length) |

## Body
- **R1 — four ellipsoids, never one.** `LOWER_BODY` (wide, low, full length), `HOOD` (front, doubles
  as front lid), `REAR_DECK` (rear, doubles as engine lid), `CABIN` (distinctly narrower and taller,
  rear-biased). The CABIN/LOWER_BODY width gap is the shoulder line that makes it read as a Beetle.
- **R2 — details.** Fender half-tori over each wheel; greenhouse glass ellipsoid split by pillars
  (sized from the glass equation so they stay inside); chassis pan; chrome running boards, bumpers
  and beltline strips; hood centre seam; mirrors at the A-pillar (body-coloured housing).
- **R3 — lights.** Two round headlights; amber front indicators on the fenders; two-tone taillights
  (amber over red) whose shape follows `era.taillightShape` (`round | square | vertical-oval`).

## Reactivity
| Role | Effect |
|---|---|
| `paint` | colour + finish; roughness/metalness match `FINISH_PROPS`, plus clearcoat (procedural only) |
| `wheels` | `rimStyle`: hubcap disc+dome · 5 spokes · 10 thin spokes (both faces); `tireProfile`: offroad wider/taller, whitewall ring; `rimColor` |
| `suspension` | body group lifts by `rideHeightMm/1000 × 2.5` (exaggerated to be visible); wheels stay grounded |
| `era` | taillight shape |
| `steering` | rim colour/thickness by `rimMaterial` (plastic · wood · thin sport) |
| `interior` | seat colour (`hex`) |

## Open groups
| Group | Part | Hinge | Motion |
|---|---|---|---|
| `frontLid` | HOOD + seam | cowl edge (rear/top) | up/forward around X |
| `rearLid` | REAR_DECK + vent louvers | cabin edge (front/top) | up/back around X |
| `doors` | real door panels + handles | front vertical edge | outward around Y, both together |

Each part is a group positioned at its hinge with the mesh offset from it. Instant toggle, no physics.
The family engine block mounts in the bay only while `rearLid` is open.

## Interior — documented approximation
Dashboard, steering wheel and two seats (`CarInterior`). The ellipsoids are **solid** (no cavity), so
the interior renders with `depthTest={false}` and a high `renderOrder`: always visible, not occluded.
Intentional; revisit only with hollow geometry.

## Out of scope
Photoreal textures, independent left/right doors, animated opening, occlusion-correct cutaway, engine
detail beyond the shared engine block.
