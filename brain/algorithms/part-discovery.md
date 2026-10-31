---
id: ALG-part-discovery
type: algorithm
title: Part discovery for the per-part editor
status: active
tags: [parts-editor]
links: [ONT-vocabulary, SPEC-parts-editor]
code: [src/core/parts/discovery.ts, src/render/systems/usePartOverrides.ts]
updated: 2026-09-29
---

# Part discovery

Groups the asset's meshes into user-facing parts by `parts.groupBy`: the node **base name**
(`phares_Mat3_0 → phares`, dropping exporter suffixes) or the **material** name. Labels from the
[vocabulary](../ontology/vocabulary.md), else prettified. `usePartOverrides` applies hide / colour
(private clone per mesh) / transform (pivot group per part; parts under a hinge are skipped so
articulation never breaks). The base-name rule is duplicated in the learning tools and kept identical
by `brain:check`.
