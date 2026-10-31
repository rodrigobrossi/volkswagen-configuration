---
id: L-0013
type: learning
title: New dependency import ⇒ Vite re-optimizes
status: active
tags: [learning, verification]
links: [AGT-verifier]
updated: 2026-10-06
---

# New dependency import ⇒ Vite re-optimizes

Importing a new dependency path (e.g. `zustand/react/shallow`) mid-session makes Vite re-bundle its
optimized deps; the open tab then mixes React copies → "Invalid hook call". Restart the dev server and
reload.
