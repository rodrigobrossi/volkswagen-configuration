---
id: SPEC-style-presets
type: spec
title: Style presets
status: active
tags: [spec, catalog, presets]
links: [SPEC-catalog, SPEC-reference-vehicle, ALG-model-resolution, CON-configuration]
code: [src/vehicles/vw-type1/catalog.ts, src/store/configStore.ts, src/core/registry.ts]
updated: 2026-11-13
---

# Style presets

A preset bundles one option per group so a coherent look is one click away; the user can fine-tune
afterwards (a manual pick leaves the preset — see [config panel](config-panel.md)).

## Requirements
- **R1 — complete.** `selections` names an option for **every** option group of the family, and each
  id exists in that group. A preset pointing at a missing id is a bug.
- **R2 — description.** One sentence for the panel card, leading with the visual effect (stance,
  wheels, colour), not mechanical trivia.
- **R3 — default.** The preset applied on load is `family.defaultPresetId` — change it deliberately,
  never as a side effect of reordering.
- **R4 — curated model.** A preset may pin a real model in `modelRules.byPreset`; presets without
  one fall through to the model of their era ([model resolution](../algorithms/model-resolution.md)).
  Real models do not yet apply suspension height, so a stance-defined preset (Baja) shows its era's
  stock body — acceptable until suspension reaches real models.

## VW Type 1 presets
| id | Theme | Model |
|---|---|---|
| `baja-bug` | raised off-road, knobby tyres, rugged cabin | era → model-1968 |
| `rat-look` | bare patina, steel wheels, weathered | era → model-1948 |
| `resto-stock` | period-correct factory look — **default** | model-1968 (pinned) |
| `meu-fusca` | the owner's reference car ([SPEC-reference-vehicle](reference-vehicle.md)) | model-1973 (pinned) |

`cal-look` and `rebaixado-br` were removed (2026-09): "rebaixado" is a suspension height.

## Acceptance
Applying each preset sets every group, highlights the preset, and renders the expected model.
