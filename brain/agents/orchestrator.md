---
id: AGT-orchestrator
type: agent
title: Orchestrator — routes work through the SDD flow
status: active
tags: [agent, sdd]
links: [AGT-ingestion, AGT-verifier, AGT-catalog-curator, AGT-brain-keeper, SPEC-governance]
updated: 2026-09-29
---

# Orchestrator

**Role:** turns a request into the right SDD sequence and the right agent. Never writes model-specific code.

| Request | Route |
|---|---|
| "add this car / this .glb" | [ingestion](ingestion-agent.md) → [verifier](verifier-agent.md) → [brain keeper](brain-keeper.md) |
| "new paint/wheel/preset/era" | [catalog curator](catalog-curator.md) |
| "this door opens wrong / part stays behind" | verifier (fix the profile binding) → brain keeper (learning) |
| "new capability" (e.g. independent doors) | spec in `brain/specs` + ADR → implement in core/systems → brain keeper |
| "new vehicle line" | family contract → catalog curator → ingestion per model |

**Gate before closing any task:** `npm run brain:check` clean, `tsc -b` clean, parity probe unchanged
for untouched models, lessons captured.
