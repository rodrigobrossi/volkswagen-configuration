# Vehicle 3D Configurator (Fusca first) — Project Context

**Owner:** Rodrigo Brossi (rbrossi)
**Product:** Web app to configure a vehicle in an interactive 3D viewer — starting with the Brazilian
VW Fusca (Type 1), built as a generic vehicle domain so other lines (Kombi, Brasília, Opala…) are data.

**Source of truth: the atomic brain — start at [brain/README.md](brain/README.md) and
[brain/index.md](brain/index.md).** Specs, ontology, contracts, algorithms, agents, per-model
knowledge, ADRs, learnings and the roadmap all live there. Code implements the brain and cites it
(`Brain: brain/…md`).

---

## Non-negotiables ([brain/00-vision/principles.md](brain/00-vision/principles.md))
- **No model-specific code.** Per-asset facts are profile JSON; per-family facts are family data.
- **Spec first (SDD):** change a `brain/specs/` note or write an ADR, then code, then the gate.
- **Gate before closing any task:** `npm run brain:check` (0 errors) · `node_modules/.bin/tsc -b` ·
  parity probe unchanged for untouched models ([brain/specs/rendering.md](brain/specs/rendering.md)).
- **Capture every lesson** as `brain/learnings/L-NNNN-*.md`.
- `reference/fusca-photos/` (owner's car) is git-ignored — visible licence plate; never commit or publish it.
- The "mexicana 8 janelas" wheel is never removed (owner decision).

## Stack
Vite + React 19 + TypeScript · `@react-three/fiber` + `@react-three/drei` (three r185) · `zustand`.

## Structure
| Path | Holds |
|---|---|
| `src/core/` | vehicle-agnostic domain: ontology + vocabulary, contracts, geometry ops, build pipeline, part discovery, registry |
| `src/vehicles/<family>/` | a vehicle line as data: `family.ts`, `catalog.ts`, `platform.ts`, `models/*.profile.json` (verified, auto-registered), `drafts/` (never loaded) |
| `src/render/` | Scene, VehicleView, RealVehicle, generic systems and provisions, procedural fallback renderer |
| `src/store/`, `src/ui/` | configuration/parts stores and role selectors; generated config panel + parts editor |
| `tools/` | `glb/read-glb.mjs`, `learning/` (learn · ingest · evaluate), `brain/check.mjs` |
| `brain/` | the knowledge base (see above) |

## Workflows
| Task | How |
|---|---|
| New 3D model / vehicle line | `ingest-vehicle` skill → `npm run brain:ingest` → verify → promote → `npm run brain:learn` |
| A model's doors/lids/parts misbehave | `adapt-car-model` skill (edit the profile JSON, never core code) |
| New option / preset / era | `add-catalog-option` skill ([brain/specs/catalog.md](brain/specs/catalog.md)) |
| What to do next | [brain/roadmap/README.md](brain/roadmap/README.md) |

Agents and their routes: [brain/agents/orchestrator.md](brain/agents/orchestrator.md).

## Branching
GitFlow: `master` = production, `develop` = integration. Work on `feature/*` off `develop`, ship via
`release/*`, patch via `hotfix/*`. Never commit to `master` directly. Rules: [docs/GITFLOW.md](docs/GITFLOW.md).

## Running locally
```bash
npm install
npm run dev            # http://localhost:5173 — ?model=<id> loads any registered model (DEV)
npm run brain:check    # governance gate
```
