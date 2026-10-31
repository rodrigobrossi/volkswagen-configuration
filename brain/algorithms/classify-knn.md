---
id: ALG-classify-knn
type: algorithm
title: Classification — name evidence + geometric kNN
status: active
tags: [learning, ingestion]
links: [ALG-signature-features, ONT-vocabulary, CON-part-signature, AGT-ingestion]
code: [tools/learning/ingest-core.mjs]
updated: 2026-09-29
---

# Classification

For each candidate (instance, section, material group):
- **geometry (45%)**: k = 5 nearest library examples, weight `1/(d+0.05)`;
- **names (55%)**: vocabulary slots of every alias; ambiguous slots split across their specifics.
Top slot + confidence; runner-up recorded for the report.

## From candidates to a draft profile
- doors: merged pair (`lateral<0.2, spanX>0.6`) → `node-split-x`; two side candidates → `node`;
  none → `region-clip` from a learned region prior (vehicle-frame fractions re-expressed on the chosen
  cabin shell) or the generic prior — always flagged for tuning;
- a candidate covered by a bigger one of the same slot with comparable confidence → take the bigger;
- lids: best per end; wheels: one mount per wheel/axle node, a group spanning both axles is fused;
- articulation from the most frequent learned prior; scale from the family's median length;
- interior `own` only with cabin evidence (seat/dashboard), never a floor alone.
`MIN_CONF = 0.35`.
