---
id: AGT-ingestion
type: agent
title: Ingestion agent — onboard an unseen asset
status: active
tags: [agent, ingestion, learning]
links: [ALG-classify-knn, ALG-learning-loop, CON-model-profile, AGT-verifier]
code: [tools/learning/ingest.mjs, tools/glb/read-glb.mjs, .claude/skills/ingest-vehicle/SKILL.md]
updated: 2026-09-29
---

# Ingestion agent

**Input:** a `.glb` (+ family, id, credit/licence). **Output:** a DRAFT profile + evidence report.

1. Copy the asset to `public/models/`, record licence in `CREDITS.md`.
2. `npm run brain:ingest -- public/models/<file>.glb --family <f> --id <model-id> --label "…"`
   (`--root <node>` for multi-object files).
3. Read `brain/vehicles/<f>/models/<id>.ingest.md`: frame, candidates with confidence/runner-up,
   notes. Fill `asset.credit`; add a model note (template) with the evidence.
4. Hand off to the [verifier](verifier-agent.md) — the draft in `src/vehicles/<f>/drafts/` is **not
   loaded** by the app until verified.

**Guardrails:** never edit core/render code to make an asset work; if a new situation needs a new
strategy, raise a spec + ADR. Never mark `verified` yourself.
