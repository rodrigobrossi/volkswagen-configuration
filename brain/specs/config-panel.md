---
id: SPEC-config-panel
type: spec
title: Config panel
status: active
tags: [spec, ui]
links: [CON-option-group, CON-configuration, SPEC-catalog, SPEC-style-presets, SPEC-parts-editor, ONT-overview]
code: [src/ui/ConfigPanel.tsx, src/store/configStore.ts, src/store/selectors.ts]
updated: 2026-11-13
---

# Config panel

The sidebar is **generated** from the active family (option groups, presets, open-group labels) and
from what the resolved model's profile supports. It names no vehicle-specific field.

## Sections (in order)
1. **Header** — `family.label` + `family.subtitle`.
2. **Real-model hint** — only when a profile resolved: which model/credit is shown and which controls
   apply to it (wheel swap only with `wheels.mounts`; open groups only with `openables`).
3. **Style Preset** — one card per preset (`label` + `description`); click → `applyPreset(id)`;
   the active preset is highlighted.
4. **Option groups** — one section per group, in catalog order, rendered by `ui`:
   `select` → native `<select>` + the selected option's `note` as a hint; `swatch` → label buttons;
   `color` → colour dots. The selection falls back to `options[fallbackIndex ?? 0]`.
5. **Openable Parts** — one toggle per ontology open group (`doors`, `frontLid`, `rearLid`), labelled
   from `family.openGroupLabels`, showing "Open"/"Closed".
6. **Chassi (plataforma)** — only when `profile.platform.enabled` and the family declares a platform:
   `Carro · Chassi montado · Chassi explodido` (`setChassisView`).
7. **Editor de peças** — toggle (closed by default), only with a real model; opens the
   [parts editor](parts-editor.md).
8. **Spec Sheet** — facts not rendered in 3D (today: the engine and its parts).

## Behaviour rules
- **R1.** A manual pick calls `select(group, option)`, which clears `activePresetId` and any model
  override — a tweak breaks preset highlighting by design.
- **R2.** Changing the chassis view never changes the preset or the model.
- **R3.** New options/groups need no panel code — sections render from the catalog.
- **R4.** Native `<button>`/`<select>` only; no custom combobox widgets.

## Known gaps
- The hint text still names "front trunk / engine lid" instead of `openGroupLabels`, and UI strings
  mix PT/EN without i18n — [T-0007](../roadmap/T-0007-panel-strings.md).
