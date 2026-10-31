---
id: ALG-extract-node
type: algorithm
title: Extract by node (exact node or token group)
status: active
tags: [extraction]
links: [CON-extraction-strategy, L-0001]
code: [src/core/geometry/scene.ts, src/core/pipeline/extract.ts]
updated: 2026-09-29
---

# Extract by node

For each `match` token (`resolveNodeGroup`):
1. an object whose name **equals** the token → that node (with its subtree);
2. else every **mesh** whose name **contains** the token, wrapped into one `Group` via `attach()`
   (world poses preserved) — a part authored as paint + trim meshes (1973 `SM_Hood`) then hinges
   off ONE combined bbox instead of two drifting hinges.

Failure modes: token also matches an unrelated mesh (choose a longer token); raw-JSON names don't
match (use sanitized names).
