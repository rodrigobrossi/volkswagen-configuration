---
id: ONT-overview
type: ontology
title: Canonical vehicle ontology
status: active
tags: [ontology, slots, capabilities]
links: [ONT-vehicle-frame, ONT-vocabulary, ADR-0001, CON-model-profile]
code: [src/core/ontology/ontology.json, src/core/ontology/index.ts]
updated: 2026-09-29
---

# Canonical vehicle ontology

Every vehicle, whatever its asset looks like, is described with the same **slots**:
`<system>.<assembly>[.<position>]` — e.g. `closure.door.left`, `wheel.rear.right`, `body.shell`.
Source of truth: [`src/core/ontology/ontology.json`](../../src/core/ontology/ontology.json)
(read by the app AND by the Node learning tools).

## Systems
`body` · `closure` · `glazing` · `lighting` · `trim` · `wheel` · `chassis` · `powertrain` · `interior`

## Capabilities (what the software may do to a slot)
| Capability | Meaning | System that acts |
|---|---|---|
| `paint` | recoloured by the paint option | [paint](../algorithms/paint-detection.md) |
| `articulate` | swings on a hinge (open group) | [articulate](../algorithms/articulate-hinge.md) |
| `swap` | replaced by a catalog asset | [wheels](../algorithms/measure-wheels.md) |
| `provision` | supplied by the software when absent | engine, donor interior, cabin floor, platform |
| `hide` / `recolor` | per-part editor operations | [part discovery](../algorithms/part-discovery.md) |
| `explode` | moves apart in the platform exploded view | [platform](../algorithms/platform.md) |

## Open groups
`doors` → `closure.door.left|right` · `frontLid` → `closure.lid.front` · `rearLid` → `closure.lid.rear`.
What a lid *means* is family data: on a rear-engined Beetle the front lid is the trunk and the rear
lid gives engine access (`VehicleFamily.engine.accessGroup = 'rearLid'`).

## Positional slots
Side/end/axle are **derived from geometry** in the [vehicle frame](vehicle-frame.md) (x < 0 → left),
never from node names — asset L/R labels are unreliable ([L-0006](../learnings/L-0006-nested-axle-nodes.md)).
Hinges carry their slot in `userData.slot`.

## `follows`
A slot that rides another (handle → door, door card → door). Its geometry is attached to the
followed slot's hinge ([companions](../algorithms/capture-companions.md), [trim pass](../algorithms/trim-pass.md)).

## Growing the ontology
Add a slot to `ontology.json` (and a vocabulary token if names hint it) **before** any profile or
system uses it. `brain:check` rejects vocabulary pointing at unknown slots.
