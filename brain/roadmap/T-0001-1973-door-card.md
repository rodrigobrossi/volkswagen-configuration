---
id: T-0001
type: task
title: 1973 — remove the last seat pieces riding on the left door card
status: open
tags: [task, model, vw-type1, doors]
links: [MOD-fusca-1973, ALG-trim-pass, L-0012, AGT-verifier]
code: [src/vehicles/vw-type1/models/fusca-1973.profile.json]
updated: 2026-11-13
---

# T-0001 — 1973 door card residue

**Agent:** [verifier](../agents/verifier-agent.md). **Spec:** [SPEC-rendering](../specs/rendering.md) R4.

At the last review the owner still saw small seat pieces (armrest area) leaving with the **left** door;
the right side is clean. The left armrest overlaps the seat bolster, and both share `Details_MAT_127`
([L-0012](../learnings/L-0012-seat-shares-door-card-material.md)).

**Approach.** Density-scan `Details_MAT_127` on the left side only (the right gap may not mirror
exactly); if the gap differs, allow a per-side trim region (contract change → ADR) instead of
widening the mirrored region.

**Acceptance.** Owner confirms both doors carry the full door card and nothing of the seat; parity
probe of the other models unchanged; new probe recorded in [MOD-fusca-1973](../vehicles/vw-type1/models/fusca-1973.md).
