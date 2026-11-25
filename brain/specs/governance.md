---
id: SPEC-governance
type: spec
title: Governance — how knowledge and code stay in lockstep
status: active
tags: [spec, governance, sdd]
links: [IDX-brain, AGT-brain-keeper, AGT-orchestrator, ADR-0007, PRN-principles]
code: [tools/brain/check.mjs, package.json]
updated: 2026-11-13
---

# Governance

## The SDD flow
1. **Spec / decision first.** A behaviour change starts as an edit to a `SPEC-` note (requirements +
   acceptance) or an ADR. A new vehicle starts as an ingestion, never as code.
2. **Code** implements the spec and cites it (`Brain: brain/<path>.md` in the file header).
3. **Gate.** `npm run brain:check` and `tsc -b` are clean; for pipeline/render changes the parity
   probe ([SPEC-rendering](rendering.md#parity-probe)) is unchanged for untouched models.
4. **Capture.** Every surprise becomes an `L-` note; every architectural choice an ADR; model notes
   get the new evidence.
5. **Branch.** Work happens on `feature/*` off `develop` ([GitFlow](../../docs/GITFLOW.md)).

## Notes
- One concept per note; frontmatter `id, type, title, status, tags, links, code, updated`.
- `type` ∈ index · vision · principle · ontology · contract · algorithm · agent · vehicle · model ·
  decision · learning · spec · task · template · ingestion-report.
- `status` ∈ draft · active · deprecated (tasks: open · doing · done). A deprecated note links its
  replacement.
- Ids: `SPEC-`, `ADR-NNNN`, `L-NNNN`, `T-NNNN`, `ALG-`, `CON-`, `AGT-`, `ONT-`, `VEH-`, `MOD-`, `IDX-`.
  Ids never change once linked; renaming a file is fine, renaming an id is not.
- Templates live in [_templates/](../_templates/) (`type: template`, skipped by the id registry).

## What `brain:check` enforces (exit 1 on any error)
| Area | Rule |
|---|---|
| Profiles | schema `vehicle-profile/v1`; id/family/label; family = folder; unique ids; only `verified` profiles in `models/`; `provenance.notes` exists; asset exists in `public/`; `frame.scale > 0`; open groups, extract kinds and axes are valid |
| Family | every `modelRules` target is a registered profile |
| Ontology | `openGroup` and `follows` resolve; vocabulary tokens lower-case and hint real slots |
| Notes | frontmatter present and typed; unique ids; `links` resolve; `code` paths exist; relative markdown links resolve |
| Code → brain | every `brain/…md|json` cited in `src/`, `tools/`, `.claude/` exists |
| Duplicated rules | `DROP_TOKEN` identical in `src/core/parts/discovery.ts` and `tools/learning/features.mjs` |
| Library | warning when `signature-library.json` is older than a profile → `npm run brain:learn` |

## Commands
| Script | Does |
|---|---|
| `npm run brain:check` | the gate above |
| `npm run brain:learn` | rebuild `brain/learning/signature-library.json` from verified profiles |
| `npm run brain:ingest -- <glb> --family <f> --id <id> --label "…"` | draft profile + evidence report |
| `npm run brain:evaluate` | leave-one-out accuracy of the learner |

## Acceptance
- A PR that changes behaviour touches at least one `SPEC-`/ADR note, or states why none applies.
- `brain:check` passes with 0 errors on every branch merged into `develop`.
