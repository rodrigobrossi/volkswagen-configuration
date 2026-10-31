---
id: ADR-0008
type: decision
title: ADR-0008 — Drafts are never loaded
status: active
tags: [adr]
links: [AGT-ingestion, AGT-verifier]
updated: 2026-09-29
---

# ADR-0008 — Drafts are never loaded

**Decision.** Ingestion writes to `src/vehicles/<family>/drafts/`, which the app does not import; only
`models/*.profile.json` with `provenance.status = verified` is registered. `brain:check` rejects an
unverified profile in `models/`.
