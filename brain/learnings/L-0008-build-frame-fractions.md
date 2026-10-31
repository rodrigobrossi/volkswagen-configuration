---
id: L-0008
type: learning
title: Regions are fractions — the pipeline runs in native units
status: active
tags: [learning]
links: [ALG-region-clip, ONT-vehicle-frame]
updated: 2026-10-06
---

# Regions are fractions — the pipeline runs in native units

The pipeline runs before centering/scaling (native units, ~0.01 for the 1973). A region written in
metres missed the geometry entirely. Fractions of the reference mesh bbox are invariant to scale and
offset. To transfer a region between assets, go through vehicle-frame fractions (the learning tools do).
