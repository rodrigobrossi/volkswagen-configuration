---
id: ADR-0004
type: decision
title: ADR-0004 — Generic vehicle domain, Fusca as first family
status: active
tags: [adr]
links: [CON-vehicle-family, VEH-vw-type1]
updated: 2026-09-29
---

# ADR-0004 — Generic vehicle domain

**Decision.** Catalog, presets, model rules, open-group labels and provisions belong to a
[VehicleFamily](../contracts/vehicle-family.md); the Fusca is `vw-type1`. Configuration is
`selections[groupId]` read by role. A new vehicle line needs no core/render change.

**Consequences.** UI labels come from family data; procedural renderers are registered per family.
