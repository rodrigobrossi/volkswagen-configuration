---
id: CON-configuration
type: contract
title: Configuration — the user's current choices
status: active
tags: [contract, state]
links: [CON-option-group, ALG-model-resolution]
code: [src/store/configStore.ts, src/store/selectors.ts, src/store/partsStore.ts]
updated: 2026-09-29
---

# Configuration

Vehicle-agnostic state ([`configStore.ts`](../../src/store/configStore.ts)):

| Field | Meaning |
|---|---|
| `familyId` | active family |
| `selections` | `groupId → optionId` |
| `activePresetId` | preset in force (cleared by any manual pick) |
| `modelOverride` | explicit model (`?model=<id>` / `window.__setModel`) — beats every rule |
| `open` | `OpenGroupId → boolean` |
| `autoRotate`, `chassisView` | viewer state |

Read it through **role selectors** ([`selectors.ts`](../../src/store/selectors.ts)): `useSelected('paint')`,
`useResolvedModel()`, `useFamily()`.

Per-part edits live separately in `partsStore` (persisted), keyed by the profile `id`
(`<modelId>:<partKey>`).
