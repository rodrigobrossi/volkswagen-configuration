---
id: L-0002
type: learning
title: Call attach() while the node is still parented
status: active
tags: [learning]
links: [ALG-articulate-hinge]
updated: 2026-10-06
---

# Call attach() while the node is still parented

`Object3D.attach(node)` composes the node's world matrix from its CURRENT parent. Detaching first
(`parent.remove(node)`) makes attach use the raw local matrix — fine for shallow nodes, but it scrambles
nodes under coordinate-conversion ancestors (1968 `Root_37/Body_35`). Symptom: the whole car is
corrupted even with every part closed — the bug is in static rigging, not in the rotation.
