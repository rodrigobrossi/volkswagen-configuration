---
id: ALG-region-clip
type: algorithm
title: Region clip — extract a panel fused into the shell
status: active
tags: [extraction, doors]
links: [CON-extraction-strategy, ALG-trim-pass, L-0008, L-0010, ADR-0005, MOD-fusca-1973]
code: [src/core/pipeline/extract.ts, src/core/geometry/mesh-ops.ts]
updated: 2026-09-29
---

# Region clip

When a door/lid has **no node at all** (1973 doors inside `SM_Base`):
1. Reference bbox = the meshes of the FIRST `source` token (the shell).
2. `region` = fractions of that bbox (build frame — [L-0008](../learnings/L-0008-build-frame-fractions.md)),
   written for the +X side; `mirrorX` also cuts `x → 1 − x`.
3. Every `source` mesh is **clipped** (not centroid-assigned) at the box's 6 planes; straddling
   triangles are split with interpolated vertices, so the door AND the hole get straight edges
   ([L-0010](../learnings/L-0010-clip-not-centroid.md)).
4. Slices of each side go into one group → hinged like any node.

## Tuning the region on real panel lines (the 1973 recipe)
- **bottom** = the paint mesh's own lower edge (`yMin: 0`) → clean edge at the running board;
- **top** = roof line, including the metal above the glass up to the vent-window line;
- **rear** = the vertical gap just behind the handle; **front** = the A-pillar / SM_Base front edge
  (`zMax: 1`, natural boundary → clean);
- boxes may reach slightly past 0..1 to take a natural border.
Then check open AND closed: closed must be seamless.

Last resort — prefer a re-export with separated panels ([ADR-0005](../decisions/ADR-0005-region-clip-last-resort.md)).
