---
id: T-0006
type: task
title: 1973 wheels as the family's reference size and a cross-model option
status: open
tags: [task, wheels, vw-type1, model]
links: [MOD-fusca-1973, ALG-measure-wheels, ALG-split-merged-x, T-0004, VEH-vw-type1]
code: [src/vehicles/vw-type1/models/fusca-1973.profile.json, src/vehicles/vw-type1/family.ts, src/core/pipeline/wheels.ts]
updated: 2026-11-13
---

# T-0006 — 1973 wheels as the base (owner's item #3)

The 1973 (the owner's base model) keeps its **baked** wheels: `SM_Disk_*` / `SM_Hub_*` / `llanta` are
fused per axle (each `llanta` tyre is one mesh covering both sides), so it declares no
`wheels.mounts` and gets no wheel swap. The owner wants:
1. the 1973 wheel **size** to be the reference for every model;
2. the 1973 wheels — other than the "mexicanas 8 janelas" — to be **selectable on the other models**;
3. the "mexicana 8 janelas" wheel to **stay** (the owner cancelled its removal).

**Approach.** Declare the 1973 axle nodes as mounts with `splitX` (as on the 1980) to measure hubs +
diameter; add a family-level reference diameter (contract change → ADR) used instead of each
model's own minimum; extract one 1973 corner as a wheel asset (offline, licence = owner's model) and
add it as a wheel option.

**Acceptance.** All models render wheels at the 1973 diameter; the new option works on 1968/1980/1973;
the 1973 still looks identical with its own wheel selected; probes recorded.
