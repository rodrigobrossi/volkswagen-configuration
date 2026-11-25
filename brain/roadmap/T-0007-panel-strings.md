---
id: T-0007
type: task
title: Config panel strings from family data, PT/EN i18n
status: open
tags: [task, ui]
links: [SPEC-config-panel, CON-vehicle-family]
code: [src/ui/ConfigPanel.tsx, src/ui/PartsPanel.tsx]
updated: 2026-11-13
---

# T-0007 — Panel strings

The real-model hint hard-codes "Doors, front trunk, and engine lid" (Fusca vocabulary in a generic
panel) and the UI mixes Portuguese and English literals.

**Approach.** Build the hint from `family.openGroupLabels` and the profile's capabilities; move UI
strings to a small locale table (PT-BR default, EN).

**Acceptance.** No vehicle-specific word in `src/ui/`; switching locale changes every panel string.
