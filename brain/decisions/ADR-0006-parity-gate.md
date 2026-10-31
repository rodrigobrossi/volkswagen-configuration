---
id: ADR-0006
type: decision
title: ADR-0006 — Parity gate for refactors
status: active
tags: [adr]
links: [AGT-verifier, PRN-principles]
updated: 2026-09-29
---

# ADR-0006 — Parity gate

**Decision.** Before and after any change touching the pipeline, run the parity probe (meshes, vertex
count, hinge boxes closed/open, paint) on every model; a refactor lands only with identical numbers.

**Evidence.** The 2026-09 refactor (1000-line renderer → pipeline + systems) matched the baseline
exactly on 1968, 1948, 1973 and the procedural renderer.
