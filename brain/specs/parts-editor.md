---
id: SPEC-parts-editor
type: spec
title: Parts editor — per-part overrides, calibration, extra parts
status: active
tags: [spec, ui, parts-editor]
links: [ALG-part-discovery, ALG-articulate-hinge, CON-model-profile, SPEC-config-panel]
code: [src/ui/PartsPanel.tsx, src/store/partsStore.ts, src/store/partsAssets.ts, src/render/systems/usePartOverrides.ts, src/render/provisions/ExtraPart.tsx, src/core/parts/discovery.ts]
updated: 2026-11-13
---

# Parts editor

An advanced editor (hidden behind a toggle) acting on the **real model** currently shown.

## Requirements
- **R1 — discovery.** Lists the model's parts as grouped by `profile.parts.groupBy` (node base name or
  material), labelled from the vocabulary, else prettified ([part discovery](../algorithms/part-discovery.md)).
- **R2 — per part.** Show/hide; colour from the family's **paint** palette (role-based) with its
  finish, or "Original"; "Restaurar" removes every override of the part.
- **R3 — adjust mode.** Position (m, ±0.6), uniform scale (0.2–3×), rotation (°, ±180) applied to a
  pivot group at the part's centre. **Parts under a hinge are never transformed** — articulation
  must keep working.
- **R4 — model calibration.** In adjust mode: scale multiplier (60–160 %) and extra Y rotation
  (±180°). They multiply the outer group only; inner sizing (wheels, engine, floor) keeps the
  profile's base scale.
- **R5 — extra parts.** "+ Adicionar peça (GLTF)" uploads a `.glb/.gltf`; the blob goes to IndexedDB
  (`fusca-part-assets`), metadata to the store; positioned/scaled/rotated by sliders; "Remover"
  deletes both.
- **R6 — persistence.** Overrides, calibration and extra-part metadata persist in localStorage
  (`fusca-parts-editor`); selection, adjust mode and the open/closed editor are ephemeral.
- **R7 — keys.** Override key `${profile.id}:${partKey}`, calibration key `${profile.id}`. Profile ids
  are therefore **stable by contract** ([CON-model-profile](../contracts/model-profile.md)).
- **R8 — no cache mutation.** Colour overrides use a private material clone per mesh; originals are
  kept to revert.
