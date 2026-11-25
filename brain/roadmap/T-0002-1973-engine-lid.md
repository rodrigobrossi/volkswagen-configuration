---
id: T-0002
type: task
title: 1973 — cut the fused engine lid so the engine bay works
status: open
tags: [task, model, vw-type1, engine]
links: [MOD-fusca-1973, ALG-region-clip, ALG-engine-bay, ADR-0005]
code: [src/vehicles/vw-type1/models/fusca-1973.profile.json]
updated: 2026-11-13
---

# T-0002 — 1973 engine lid

**Agent:** [verifier](../agents/verifier-agent.md). The 1973's rear lid is fused into the rear kit, so
`rearLid` has no binding: the toggle does nothing and the engine provision never mounts.

**Approach.** Find the lid in `SM_RearKit` (separate mesh? → `node`; fused → `region-clip` along the
panel line, last resort per [ADR-0005](../decisions/ADR-0005-region-clip-last-resort.md)); hinge at
the cabin-side top edge; check the engine bay footprint derived from the lid.

**Acceptance.** Lid opens up and back with the vent grille; engine + bay visible; closed state
seamless; probe recorded; `brain:learn` re-run (new region prior).
