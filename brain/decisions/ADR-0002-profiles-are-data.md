---
id: ADR-0002
type: decision
title: ADR-0002 — Model knowledge is data (profiles), not code
status: active
tags: [adr]
links: [CON-model-profile, PRN-principles]
updated: 2026-09-29
---

# ADR-0002 — Model knowledge is data

**Context.** `carModels.ts` held per-model node names, fractions, material exclusions and pages of
rationale as TypeScript; every model added code.

**Decision.** Per-asset knowledge is a JSON [profile](../contracts/model-profile.md) validated by schema;
rationale moves to the model brain note. Profiles in `models/` are glob-registered; drafts never load.

**Consequences.** Onboarding a model = adding data; tools (Node) can read/write profiles; JSON has no
comments → notes carry the "why".
