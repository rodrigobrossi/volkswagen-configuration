---
id: L-0010
type: learning
title: Clip at the planes, don't assign whole triangles
status: active
tags: [learning]
links: [ALG-region-clip, MOD-fusca-1973]
updated: 2026-10-06
---

# Clip at the planes, don't assign whole triangles

Assigning whole triangles by centroid leaves a serrated edge on the door and on the hole. Clipping each
triangle at the box planes (interpolating position/normal/uv) gives straight edges; cutting at the
mesh's natural border (the running-board edge, the `SM_Base` front edge) is cleaner still.
