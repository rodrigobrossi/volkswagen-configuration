---
id: AGT-brain-keeper
type: agent
title: Brain keeper — keeps knowledge and code in lockstep
status: active
tags: [agent, governance]
links: [SPEC-governance, IDX-brain]
code: [tools/brain/check.mjs]
updated: 2026-09-29
---

# Brain keeper

Runs after every change:
- `npm run brain:check` must pass (profiles, ontology, vocabulary, notes, code→brain citations,
  duplicated-rule parity, library freshness);
- every surprise of the task becomes an `L-` note; every architectural choice an ADR;
- model notes updated with evidence and parity probe; learning table in
  [learning loop](../algorithms/learning-loop.md) updated when `brain:evaluate` changes;
- `vocabulary.json` extended with tokens confirmed by a verified ingestion.
