---
id: CON-option-group
type: contract
title: OptionGroup and roles — the catalog contract
status: active
tags: [contract, catalog]
links: [CON-configuration, CON-vehicle-family, SPEC-catalog, SPEC-config-panel]
code: [src/core/contracts/catalog.ts]
updated: 2026-09-29
---

# OptionGroup

A family's catalog is a list of groups: `{ id, role, title, ui, options, fallbackIndex }`.
The panel renders each group by its `ui` (`select` · `swatch` · `color`) — it knows no vehicle field.

## Roles give options meaning
Systems bind to **roles**, never to group ids:

| Role | Option contract | Consumer |
|---|---|---|
| `paint` | `PaintOption { hex, finish }` | paint system, cabin floor, donor interior tint, parts palette |
| `wheels` | `WheelOption { rimColor, rimStyle, tireProfile }` | wheel swap + procedural wheels |
| `era` | family-specific (e.g. body style, taillight shape) | model resolution, procedural renderer |
| `suspension`, `steering`, `interior`, `engine` | family-specific | procedural renderer, spec sheet |

`FINISH_PROPS` is the single roughness/metalness table for every paint path.
