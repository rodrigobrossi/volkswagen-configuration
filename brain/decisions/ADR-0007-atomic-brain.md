---
id: ADR-0007
type: decision
title: ADR-0007 — The atomic brain replaces .specs/ and docs/SDD.md
status: active
tags: [adr]
links: [IDX-brain, SPEC-governance]
updated: 2026-09-29
---

# ADR-0007 — Atomic brain as the SDD source of truth

**Context.** `.specs/` and `docs/SDD.md` were monolithic and had drifted (still described removed models).

**Decision.** Knowledge is atomic notes with typed frontmatter under `brain/`; code cites notes; the
`brain:check` gate fails on any dangling reference either way. The old docs were migrated and removed.
