---
id: ONT-vocabulary
type: ontology
title: Asset vocabulary (multilingual name tokens)
status: active
tags: [ontology, vocabulary, learning]
links: [ONT-overview, ALG-classify-knn, ALG-part-discovery]
code: [src/core/ontology/vocabulary.json]
updated: 2026-09-29
---

# Asset vocabulary

Asset authors name nodes/materials in any language (`porte`, `DoorL`, `Tür`, `capot_moteur`,
`metal_schwarz`, `llanta`). [`vocabulary.json`](../../src/core/ontology/vocabulary.json) maps each
**lower-case token** to:
- `label` — the PT label the parts editor shows;
- `slot` — the ontology slot it usually denotes (optional; may be a prefix like `closure.lid`);
- `lang` — provenance of the word.

## Used by
- the parts editor — friendly labels ([part discovery](../algorithms/part-discovery.md));
- the classifier — **name evidence** (55% of a candidate's vote, [classify](../algorithms/classify-knn.md)).

## Ambiguous tokens
`hood`, `trunk`, `capo` say *lid* but not *which end*. They map to the prefix `closure.lid`; the
classifier splits their vote between `closure.lid.front` and `closure.lid.rear` and lets geometry
decide (a 1968 "Hood" is actually the rear engine lid — [MOD-beetle-1968](../vehicles/vw-type1/models/beetle-1968.md)).

## Maintenance
Every verified ingestion adds the tokens it confirmed. `brain:check` enforces lower-case keys and
known slots.
