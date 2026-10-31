---
id: L-0005
type: learning
title: "Textured paint: drop the map, share one clone"
status: active
tags: [learning]
links: [ALG-paint-detection]
updated: 2026-10-06
---

# Textured paint: drop the map, share one clone

Paint baked into a texture map with a white base colour multiplies any new colour → drop `map` when
recolouring. Clone the material ONCE and share it across all paint meshes: a clone per mesh splits the
panels into N materials, and the next colour change reaches only one of them.
