---
name: ingest-vehicle
description: Onboard a new 3D vehicle asset (.glb) into the configurator as DATA — run the learned ingestion to get a draft ModelProfile + evidence report, verify it on screen, promote it to models/, and feed the learning loop. Use when asked to add/import a new car model or a new vehicle line (Kombi, Brasília, Opala…), or to "make the software understand" a new asset.
---

# Ingest a vehicle

A model is onboarded as a **profile** (JSON), never as code. Read first:
[brain/agents/ingestion-agent.md](../../../brain/agents/ingestion-agent.md),
[brain/agents/verifier-agent.md](../../../brain/agents/verifier-agent.md),
[brain/contracts/model-profile.md](../../../brain/contracts/model-profile.md).

## 1. Intake
1. Copy the asset to `public/models/<file>.glb`; add source + licence to `CREDITS.md`.
2. New vehicle line? Create `src/vehicles/<family>/` (`family.ts`, `catalog.ts`, `models/`), register
   it in `src/vehicles/index.ts` — contract: [brain/contracts/vehicle-family.md](../../../brain/contracts/vehicle-family.md).
3. Quick look at node/material names and native size if needed:
   `node .claude/skills/adapt-car-model/inspect-glb.mjs public/models/<file>.glb`.

## 2. Ingest (learned proposal)
```bash
npm run brain:ingest -- public/models/<file>.glb --family <family> --id model-<id> --label "<label>"
```
Options: `--root <node>` (file bundles several objects), `--length <m>` (real length if not ~4.07),
`--dry` (print only). Outputs:
- `src/vehicles/<family>/drafts/model-<id>.profile.json` — **never loaded by the app**;
- `brain/vehicles/<family>/models/model-<id>.ingest.md` — frame, every candidate with confidence and
  runner-up, notes. Low confidence or a close runner-up = look there first.

## 3. Verify (render, fix the DATA)
1. Copy the draft to `models/` keeping `provenance.status: "draft"` only while testing locally, or
   test with `?model=model-<id>` after copying; `npm run dev`, open a **fresh tab** with the pane visible.
2. Walk the checklist in [brain/specs/rendering.md](../../../brain/specs/rendering.md): size/heading,
   each open group (edge, direction, companions, nothing torn), wheels, paint, interior.
3. Fix bindings in the JSON only — strategy guide: [brain/contracts/extraction-strategy.md](../../../brain/contracts/extraction-strategy.md)
   (`node` → `node-split-x` → `region-clip` as last resort). Use the `adapt-car-model` skill for the
   detailed tuning recipes. Never add model-specific code; a missing capability = spec + ADR.
4. Record the parity probe and every binding's rationale in a model note
   (template [brain/_templates/model.md](../../../brain/_templates/model.md)); set `provenance.notes` to it.

## 4. Promote and learn
1. `provenance.status = "verified"`, file in `src/vehicles/<family>/models/` (auto-registered); map it in
   `modelRules` if a preset/era should show it; delete the draft.
2. Add confirmed name tokens to `src/core/ontology/vocabulary.json`.
3. `npm run brain:learn` then `npm run brain:evaluate`; add a row to the table in
   [brain/algorithms/learning-loop.md](../../../brain/algorithms/learning-loop.md) if the score moved.
4. Gate: `npm run brain:check` clean, `node_modules/.bin/tsc -b` clean, other models' probes unchanged.
5. Surprises → `brain/learnings/L-NNNN-*.md` (template [brain/_templates/learning.md](../../../brain/_templates/learning.md)).
