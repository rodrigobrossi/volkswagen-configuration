---
id: L-0001
type: learning
title: GLTFLoader sanitizes node names
status: active
tags: [learning]
links: [ALG-normalize, ALG-extract-node]
updated: 2026-10-06
---

# GLTFLoader sanitizes node names

three.js replaces whitespace with `_` and removes `[ ] . : /` (`v:SM_Base` → `vSM_Base`,
`Wheel FL_20` → `Wheel_FL_20`). Matching a raw glTF JSON name silently fails (the 1968 file then
rendered BOTH bundled cars). **Always bind sanitized names**; `tools/glb/read-glb.mjs` applies the same
rule so the learning tools see what the app sees.
