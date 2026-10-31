---
id: IDX-brain
type: index
title: Atomic brain — how this knowledge base works
status: active
tags: [brain, sdd, governance]
links: [IDX-map, PRN-principles, SPEC-governance, AGT-brain-keeper]
updated: 2026-09-24
---

# Atomic brain

The **single source of truth** for the vehicle configurator: what the software must do (specs), what
it knows about vehicles (ontology, profiles), how it does it (contracts, algorithms), who changes it
(agents) and why it is the way it is (decisions, learnings). Code implements the brain; the brain is
never reverse-engineered from code.

## Rules
1. **Atomic** — one concept per note. If a note needs two headings of different kinds, split it.
2. **Typed** — every note starts with frontmatter: `id`, `type`, `title`, `status`
   (`draft|active|deprecated`), `tags`, `links` (ids of related notes), `code` (paths it governs),
   `updated`. Templates: [_templates/](_templates/).
3. **Linked** — relate notes by `links` (ids) and relative markdown links; both are validated.
4. **Bidirectional with code** — code cites the note that governs it (`Brain: brain/...md`); notes
   list the code they govern in `code:`. `npm run brain:check` fails when either side points at
   something missing ([SPEC-governance](specs/governance.md)).
5. **Spec first (SDD)** — a behaviour change starts as a spec/decision edit here, then code, then the
   check. A model is onboarded as DATA (a profile) through the ingestion flow, never as code.
6. **Learnings are captured, not remembered** — every non-obvious fact found while working (a file
   quirk, a pipeline gotcha) becomes an `L-` note the same day.

## Folders (load order for agents)
| Folder | Type | Holds |
|---|---|---|
| [00-vision](00-vision/) | vision, principle | why the product exists, non-negotiable principles, glossary |
| [ontology](ontology/) | ontology | the canonical vehicle part taxonomy, frames, vocabulary |
| [contracts](contracts/) | contract | the interfaces every layer speaks (profile, family, catalog…) |
| [algorithms](algorithms/) | algorithm | each pipeline stage / learning step, with failure modes |
| [agents](agents/) | agent | roles that act on the system, their tools, gates and handoffs |
| [vehicles](vehicles/) | vehicle, model | per-family and per-asset knowledge (the "essence") |
| [decisions](decisions/) | decision | ADRs — why the architecture is shaped this way |
| [learnings](learnings/) | learning | atomic lessons (gotchas) found in practice |
| [specs](specs/) | spec | SDD requirements with acceptance criteria |
| [roadmap](roadmap/) | task | open work, ordered |
| [learning](learning/) | (generated) | `signature-library.json` — built by `npm run brain:learn` |

Start at [index.md](index.md).
