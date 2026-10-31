---
id: CON-extraction-strategy
type: contract
title: Extraction strategies — how a slot's geometry is obtained
status: active
tags: [contract, extraction, pipeline]
links: [ALG-extract-node, ALG-split-merged-x, ALG-region-clip, ALG-trim-pass, ALG-capture-companions]
code: [src/core/contracts/profile.ts, src/core/pipeline/extract.ts]
updated: 2026-09-29
---

# Extraction strategies

Assets model parts in three fundamentally different ways; each binding declares which one applies.

| `kind` | Asset situation | Algorithm |
|---|---|---|
| `node` | the part is a node (or several meshes sharing a name token) | [extract node](../algorithms/extract-node.md) |
| `node-split-x` | ONE node holds both sides (left+right doors merged) | [split merged X](../algorithms/split-merged-x.md) |
| `region-clip` | the part is FUSED into the shell — no node at all | [region clip](../algorithms/region-clip.md) (+ optional [trim pass](../algorithms/trim-pass.md)) |

Orthogonal to the strategy, **companions** bring satellite meshes along (handles, mirrors, fused
glass) — [capture companions](../algorithms/capture-companions.md).

Choosing: prefer `node` → `node-split-x` → `region-clip`. A `region-clip` binding always needs
human tuning on the real panel lines; if the asset can be re-exported with separated panels, do that
instead ([ADR-0005](../decisions/ADR-0005-region-clip-last-resort.md)).
