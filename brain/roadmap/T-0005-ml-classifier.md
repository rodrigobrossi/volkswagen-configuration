---
id: T-0005
type: task
title: Replace kNN with a trained classifier once the library is large
status: open
tags: [task, learning]
links: [ALG-classify-knn, ALG-learning-loop, ADR-0003, CON-part-signature]
code: [tools/learning/ingest-core.mjs, tools/learning/evaluate.mjs]
updated: 2026-11-13
---

# T-0005 — ML classifier

Deliberately deferred ([ADR-0003](../decisions/ADR-0003-heuristics-plus-library.md)): with 4 verified
models a trained model would overfit; kNN + vocabulary is explainable and reaches 95 % leave-one-out.

**Trigger.** ≥ 20 verified models across ≥ 2 families, or leave-one-out stalling below 90 %.

**Approach.** Train on the same signature vectors (+ token embeddings) with the same evaluation
harness; keep kNN as the baseline and the evidence report format unchanged.

**Acceptance.** Beats kNN on `brain:evaluate` by a margin and keeps per-candidate evidence/confidence.
