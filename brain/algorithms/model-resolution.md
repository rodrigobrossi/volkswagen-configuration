---
id: ALG-model-resolution
type: algorithm
title: Model resolution — which asset renders
status: active
tags: [registry]
links: [CON-vehicle-family, CON-configuration]
code: [src/core/registry.ts, src/render/VehicleView.tsx]
updated: 2026-09-29
---

# Model resolution

`resolveModel(family, state)`:
1. `modelOverride` (if it belongs to the family) — `?model=<id>` or `window.__setModel(id)`;
2. `modelRules.byPreset[activePresetId]` — a curated preset model wins (resto-stock → 1968);
3. `modelRules.byOption.map[selections[group]]` — presets without a model fall through to their era;
4. none → the family's procedural renderer.

A rule may only reference registered profiles (`brain:check`).
