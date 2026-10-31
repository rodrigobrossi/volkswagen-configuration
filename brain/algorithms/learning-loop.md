---
id: ALG-learning-loop
type: algorithm
title: The learning loop
status: active
tags: [learning, governance]
links: [AGT-ingestion, AGT-verifier, ALG-classify-knn, CON-part-signature, ADR-0003]
code: [tools/learning/learn.mjs, tools/learning/ingest.mjs, tools/learning/evaluate.mjs]
updated: 2026-09-29
---

# Learning loop

```
new asset ─► brain:ingest ─► draft profile + evidence report ─► verifier renders, fixes, verifies
    ▲                                                                   │
    └──────── brain:learn (library from ALL verified profiles) ◄───────┘
```
Every verified model adds labelled signatures, articulation/region priors and a frame scale; the next
ingestion starts from more knowledge. `brain:evaluate` measures it (leave-one-out: hide one model,
ingest it as unseen, compare with its verified profile).

| Date | Verified models | Leave-one-out | Change |
|---|---|---|---|
| 2026-09-24 | 4 | 36% | first version (names on meshes only) |
| 2026-09-24 | 4 | 68% | anchor meshes to meaningful ancestors |
| 2026-09-24 | 4 | 91% | assembly climbing, section candidates, cabin evidence |
| 2026-09-24 | 4 | **95%** | prefix-related names; only miss: 1973 fused doors (single example) |

Heuristics + library by design ([ADR-0003](../decisions/ADR-0003-heuristics-plus-library.md)); an
ML model becomes worthwhile when dozens of verified assets exist ([T-0005](../roadmap/T-0005-ml-classifier.md)).
