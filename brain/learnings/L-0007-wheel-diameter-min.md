---
id: L-0007
type: learning
title: Use the smallest wheel AABB as the tyre diameter
status: active
tags: [learning]
links: [ALG-measure-wheels]
updated: 2026-10-06
---

# Use the smallest wheel AABB as the tyre diameter

A wheel node bundling brake/knuckle (often rotated) over-estimates the diameter (1968: 0.71–0.88).
An AABB can only be ≥ the tyre, so the minimum across the four mounts is the best estimate; one size
for all four corners.
