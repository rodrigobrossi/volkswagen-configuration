---
id: ALG-trim-pass
type: algorithm
title: Trim pass — take the door card, not the seat
status: active
tags: [extraction, interior, doors]
links: [ALG-region-clip, L-0012, MOD-fusca-1973]
code: [src/core/pipeline/extract.ts]
updated: 2026-09-29
---

# Trim pass

The inner door trim usually lives in the **cabin mesh** together with the internal sill, the B-pillar
trim and the seats — cutting it with the shell's region drags all of those along. A second pass cuts
`trim.match` meshes with its **own, tighter** `trim.region` (fractions of the SAME shell bbox) and
skips `excludeMaterials`.

Finding the limits (1973):
- **x (inboard)**: scan the density of the cabin material across X in the door slab and cut in the
  **valley** between seat and door card (seat x 0.30–0.45, gap 0.45–0.48, card peak ≈0.575)
  ([L-0012](../learnings/L-0012-seat-shares-door-card-material.md));
- **y**: above the internal sill; **z**: ahead of the B-pillar trim;
- exclude the seat-cushion material by name.
