---
id: AGT-verifier
type: agent
title: Verifier agent — prove a profile on screen
status: active
tags: [agent, verification, parity]
links: [AGT-ingestion, ADR-0006, SPEC-rendering, L-0013, L-0014]
code: [src/render/Scene.tsx, src/store/configStore.ts]
updated: 2026-09-29
---

# Verifier agent

Renders the draft/profile and fixes bindings until the checklist passes.

1. Put the draft in `models/` temporarily (or keep `status: draft` locally) and open
   `http://localhost:5183/?model=<id>`; DEV exposes `window.__scene`, `window.__r3f`, `window.__setModel`.
2. Checklist ([SPEC-rendering](../specs/rendering.md)): size/grounding/heading; every open group opens
   outward, hinged at the right edge, nothing torn, closed state seamless; wheels on hubs; paint
   recolours only the body; interior inside the glass; no seat/sill/pillar riding a door.
3. Measure, don't eyeball: raycasts, per-hinge bboxes, density scans ([trim pass](../algorithms/trim-pass.md)).
4. Record a **parity probe** (meshes, vertices, hinge boxes closed/open, paint) in the model note.
5. `provenance.status = "verified"`, move to `models/`, `npm run brain:learn`, `npm run brain:evaluate`.

Gotchas: hidden browser pane ⇒ canvas 300×150 and no `onCreated` ([L-0014](../learnings/L-0014-hidden-pane-canvas.md));
new dependency ⇒ Vite re-optimizes and the open tab mixes React copies — restart + reload
([L-0013](../learnings/L-0013-vite-dep-reoptimize.md)).
