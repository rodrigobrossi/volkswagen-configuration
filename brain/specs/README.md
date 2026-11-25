---
id: IDX-specs
type: index
title: Specs
status: active
tags: [spec, sdd]
links: [IDX-map, SPEC-governance]
updated: 2026-11-13
---

# Specs

Prescriptive "what must be true" per module, with numbered requirements and acceptance. Read the
spec before changing the code it governs; change the spec in the same branch when behaviour changes
([governance](governance.md)). Template: [../_templates/spec.md](../_templates/spec.md).

| Spec | Governs |
|---|---|
| [governance](governance.md) | the SDD flow, note rules, the `brain:check` gate, scripts |
| [catalog](catalog.md) | option groups, roles, rules for adding an option |
| [style presets](style-presets.md) | preset completeness, default, curated models |
| [reference vehicle](reference-vehicle.md) | what the owner's photos ground, and how |
| [config panel](config-panel.md) | the generated sidebar |
| [parts editor](parts-editor.md) | per-part overrides, calibration, extra parts |
| [scene viewer](scene-viewer.md) | camera, lighting, turntable, DEV hooks |
| [rendering](rendering.md) | real-model requirements, verifier checklist, parity probe |
| [procedural renderer](procedural-renderer.md) | the primitive vw-type1 fallback car |

Replaces the former `.specs/` folder and `docs/SDD.md` ([ADR-0007](../decisions/ADR-0007-atomic-brain.md)).
