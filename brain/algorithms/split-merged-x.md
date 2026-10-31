---
id: ALG-split-merged-x
type: algorithm
title: Split a merged left+right node by world X
status: active
tags: [extraction]
links: [CON-extraction-strategy, MOD-beetle-1303-1980]
code: [src/core/geometry/mesh-ops.ts]
updated: 2026-09-29
---

# Split merged X

Some assets merge BOTH doors (1980 `porte_1`) or both wheels of an axle (`roue`) in one node; its
bbox centre sits at x≈0 so no single hinge can work. `splitNodeByWorldX` clones the node twice and
keeps, in each clone, the triangles whose **world centroid** is on its side of X = 0. Each half is then
rigged like a normal door. Wheel mounts use the same idea on vertices (`splitX`).

Signal for ingestion: a door-classified candidate with `lateral < 0.2` and `spanX > 0.6`.
