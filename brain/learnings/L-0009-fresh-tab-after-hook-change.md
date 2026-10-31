---
id: L-0009
type: learning
title: "R3F + Fast Refresh: reload after hook changes"
status: active
tags: [learning, verification]
links: [AGT-verifier]
updated: 2026-10-06
---

# R3F + Fast Refresh: reload after hook changes

Adding/removing a hook in a component inside `<Canvas>` breaks Fast Refresh ("change in the order of
Hooks") and R3F instances may keep old closures. Verify in a fresh tab / hard reload — never trust HMR
inside the Canvas tree.
