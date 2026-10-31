---
id: AGT-catalog-curator
type: agent
title: Catalog curator — options, presets, eras
status: active
tags: [agent, catalog]
links: [SPEC-catalog, CON-option-group, SPEC-style-presets, SPEC-reference-vehicle]
code: [src/vehicles/vw-type1/catalog.ts, .claude/skills/add-catalog-option/SKILL.md]
updated: 2026-09-29
---

# Catalog curator

Adds/changes options, presets and eras in a family catalog following [SPEC-catalog](../specs/catalog.md):
role contract satisfied, unique ids, preset selections complete, sourcing noted (curated ≠ verified),
reference-vehicle grounding respected. If an era should map to a model, update `modelRules`. Uses the
`add-catalog-option` skill.
