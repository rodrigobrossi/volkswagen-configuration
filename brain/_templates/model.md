---
id: MOD-<model-id-without-prefix>
type: template
title: <label> — <the one quirk that defines this asset>
status: active
tags: [model, <family>]
links: [VEH-<family>, <algorithms used>]
code: [src/vehicles/<family>/models/<name>.profile.json]
updated: YYYY-MM-DD
---

# <label> · `<model-id>` · `<file>.glb`

Source, licence (`CREDITS.md`), what the asset contains (sections, roots, units).
- **Frame:** native length → `scale`; heading → `rotationY`. **Grouping:** node | material.
- **Paint:** materials (explicit/auto), texture quirks.
- **<open group>:** binding + why (strategy, edges, companions).
- **Wheels:** mounts / fused. **Interior:** own | donor (+ `donorScale`).
- Known residue → roadmap task.

**Ingestion evidence:** link the `<id>.ingest.md` report; what the learner got right/wrong.

**Parity probe (YYYY-MM-DD):** meshes · verts (closed / open); hinges per slot.

<!-- When copying: set `type: model`; the profile's provenance.notes must point at this file. -->
