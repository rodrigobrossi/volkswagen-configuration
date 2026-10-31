---
id: ALG-normalize
type: algorithm
title: Normalize — isolate, zero, clean
status: active
tags: [pipeline]
links: [ALG-pipeline, L-0003, L-0004, L-0001]
code: [src/core/pipeline/normalize.ts]
updated: 2026-09-29
---

# Normalize

1. **Isolate** `asset.rootNode` when the file bundles several objects (1968 file: two cars).
   Match the *sanitized* name ([L-0001](../learnings/L-0001-gltf-name-sanitization.md)).
2. **Clone** (`clone(true)`) — geometry/materials stay shared with the cache; never mutate them.
3. **Zero the root transform** (position/quaternion/scale) — an isolated root keeps its offset inside
   the original file and throws hinges off by that offset ([L-0003](../learnings/L-0003-zero-root-transform.md)).
4. **Drop store watermarks** (material named like `2020-2025`) ([L-0004](../learnings/L-0004-sketchfab-watermark.md)).

Output: the **build frame**.
