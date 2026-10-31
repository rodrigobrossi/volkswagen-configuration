---
id: ONT-vehicle-frame
type: ontology
title: Vehicle frame and build frame
status: active
tags: [ontology, frames, units]
links: [ONT-overview, L-0003, L-0008, ALG-normalize]
code: [src/core/pipeline/build.ts, src/core/pipeline/normalize.ts]
updated: 2026-09-29
---

# Frames

## Vehicle frame (what the scene and all metric data use)
- **1 unit = 1 metre**, origin on the ground under the vehicle centre.
- **+Y up**, **+Z forward** (nose), **+X right**, −X left.
- Reached by `centering = [-center.x, -box.min.y, -center.z]` inside the outer group that applies the
  profile's `frame.scale` (asset units → metres) and `frame.rotationY` (heading).
- Metric data (engine constants, `cabinFloor`, platform parts) is authored here and **divided by the
  model's base scale** when rendered inside the scaled group.

## Build frame (what the pipeline sees)
- The asset's **native units**, after isolating the root and zeroing its own transform
  ([L-0003](../learnings/L-0003-zero-root-transform.md)) — **not** centred, **not** scaled.
- Everything the pipeline computes (hinge pivots, wheel hubs, lid openings) is in this frame and gets
  `centering` added at render time.
- Region boxes are therefore **fractions (0..1) of a reference bbox**, never metres
  ([L-0008](../learnings/L-0008-build-frame-fractions.md)).

## Learning frame
The learning tools describe parts as fractions of the whole vehicle bbox (lateral/height/longitudinal),
which makes signatures comparable across assets of any unit scale
([signature features](../algorithms/signature-features.md)).
