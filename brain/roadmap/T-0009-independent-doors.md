---
id: T-0009
type: task
title: Independent left/right doors and eased opening
status: open
tags: [task, articulation, ui]
links: [ALG-articulate-hinge, CON-configuration, ONT-overview, SPEC-config-panel]
code: [src/render/systems/useArticulation.ts, src/store/configStore.ts]
updated: 2026-11-13
---

# T-0009 — Independent doors, eased motion

One `doors` toggle swings both doors; every part snaps open instantly.

**Approach.** Open state per hinge slot (`closure.door.left/right`) with the group toggle as a shortcut;
animate hinge angles with damping in `useArticulation`. Contract change → ADR.

**Acceptance.** Each door opens on its own; motion eased; parity probe in the closed and all-open
states unchanged.
