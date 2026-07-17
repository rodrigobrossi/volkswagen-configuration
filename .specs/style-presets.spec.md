# Style Presets Spec

Presets bundle one value per category so a user gets a coherent look in one click, then can
fine-tune individual fields afterward.

## Current presets

| id | Theme |
|---|---|
| `cal-look` | Lowered, EMPI wheels, minimalist chrome, sport wheel |
| `baja-bug` | Raised off-road, knobby tires, rugged cabin |
| `rat-look` | Bare patina, mismatched steel wheels, weathered |
| `resto-stock` | Period-correct factory-original (also the app's default preset) |
| `rebaixado-br` | Lowered Brazilian street style, custom wheels, modern interior touch |
| `meu-fusca` | Approximation of the reference car in `reference/fusca-photos/` — see [reference-vehicle.spec.md](reference-vehicle.spec.md) |

## Rules

- Every `config.*Id` must resolve to a real entry in the corresponding `data/fusca.ts` catalog
  (see [data-model.spec.md](data-model.spec.md)) — verify after adding or renaming any catalog entry.
- `description` is one sentence, written for the config panel card — lead with the visual
  effect (stance, wheels, color), not mechanical trivia.
- The default preset on load is `resto-stock` (`configStore.ts`) — change deliberately, not as
  a side effect of reordering the array.
- A new preset should be added via `/add-catalog-option` (it appends and validates id references).
