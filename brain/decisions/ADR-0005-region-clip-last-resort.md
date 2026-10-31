---
id: ADR-0005
type: decision
title: ADR-0005 — Region clip is a last resort
status: active
tags: [adr]
links: [ALG-region-clip, MOD-fusca-1973]
updated: 2026-09-29
---

# ADR-0005 — Region clip is a last resort

**Context.** The 1973 doors are fused into `SM_Base`; the door card shares material with the seats.
Region clipping works (straight edges, tuned on panel lines) but needs many human iterations and can
never separate geometry that overlaps in space.

**Decision.** Prefer, in order: a node, a merged-node split, a re-export with separated panels; use
`region-clip` (+ trim pass) only when re-export is impossible, and document every limit in the model note.
