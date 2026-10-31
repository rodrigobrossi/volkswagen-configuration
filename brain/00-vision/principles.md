---
id: PRN-principles
type: principle
title: Non-negotiable principles
status: active
tags: [principles, architecture]
links: [ADR-0001, ADR-0002, ADR-0003, SPEC-governance]
updated: 2026-09-24
---

# Principles

1. **No model-specific code.** No `if (model === …)` anywhere. Every per-asset fact is profile data;
   every per-family fact is family data ([ADR-0002](../decisions/ADR-0002-profiles-are-data.md)).
2. **One vocabulary.** Layers talk in ontology slots and option roles
   ([ADR-0001](../decisions/ADR-0001-canonical-ontology.md)).
3. **Measure, don't hardcode.** Sizes/positions are derived from the asset's own geometry (hinge
   edges, wheel hubs, lid openings); only real-world constants live in data, in metres.
4. **Never mutate cached assets.** Clone materials/geometry before changing them (a loaded GLTF is
   shared by every mount).
5. **Parity before progress.** A refactor proves identical output (vertices, hinge boxes, paint) against
   a recorded baseline before it lands ([ADR-0006](../decisions/ADR-0006-parity-gate.md)).
6. **Capture every lesson.** A surprise becomes an `L-` note before the task closes.
7. **Humans verify, machines propose.** Ingestion drafts are never loaded until verified.
