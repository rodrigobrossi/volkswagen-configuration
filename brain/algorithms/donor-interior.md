---
id: ALG-donor-interior
type: algorithm
title: Donor interior — fit the reference cabin into a hollow asset
status: active
tags: [provision, interior]
links: [L-0011, MOD-fusca-1973, MOD-typ11-1948]
code: [src/render/provisions/DonorInterior.tsx]
updated: 2026-09-29
---

# Donor interior

For `interior.source = 'donor'`: take the family donor's cabin meshes (`match`, 1973 `SM_Interior`),
measure the cabin centre as a **fraction of the donor's whole body bbox**, map that fraction onto the
host bbox, and scale uniformly by the **width ratio** × `donorScale`. No per-model anchors.
- `donorScale < 1` when the host cabin is narrower than the donor's (1948: glass ±0.62 vs cabin ±0.674
  → 0.85) — otherwise the cabin pokes through the windows.
- `flipZ` for hosts facing −Z.
- The donor's painted interior panels share the donor's body-paint material: clone and retint them to
  the host's paint ([L-0011](../learnings/L-0011-interior-paint-bleed.md)).
