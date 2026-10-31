---
id: ADR-0001
type: decision
title: ADR-0001 — One canonical vehicle ontology
status: active
tags: [adr]
links: [ONT-overview, PRN-principles]
updated: 2026-09-29
---

# ADR-0001 — One canonical vehicle ontology

**Context.** Four assets, four naming languages (FR nodes, DE materials, EN generic `Object_NN`,
Unreal-style `SM_*`). Code grew per-file branches and a 1000-line renderer.

**Decision.** Every layer speaks one ontology of slots/capabilities/open groups
([ontology](../ontology/README.md)); file names are confined to profile bindings.

**Consequences.** Systems are vehicle-agnostic; new assets are a mapping problem the learning tools can
attack; slots must be added to `ontology.json` before use.
