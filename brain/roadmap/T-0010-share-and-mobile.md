---
id: T-0010
type: task
title: Share a build link; mobile layout
status: open
tags: [task, ui]
links: [CON-configuration, SPEC-config-panel, VIS-product]
code: [src/store/configStore.ts, src/App.tsx]
updated: 2026-11-13
---

# T-0010 — Share & mobile

No way to share a configuration, and the two-pane layout is desktop-only.

**Approach.** Serialize `{familyId, selections, preset, model}` into the URL (ids only — no personal
data) and restore on load; stack the panel under the viewer below ~768 px.

**Acceptance.** A copied URL reproduces the build in a fresh tab; usable at 375 px wide.
