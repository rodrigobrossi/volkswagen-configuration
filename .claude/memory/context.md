# Project Memory / Context Registry

Running log of project context and decisions for the Fusca 3D Configurator, for any Claude
Code session (or the `/add-catalog-option` skill) to read before making changes. Newest entries
at the top. This is a project-committed file (not personal/cross-session memory) — it travels
with the repo.

For the current architecture/data-model reference, see [docs/SDD.md](../../docs/SDD.md) and
[.specs/](../../.specs/) — this file is the *history/rationale* log, not the current-state doc;
update those when structure changes, and add an entry here for *why*.

---

## 2026-07-17 — Specs, skill, memory scaffolding + 3D fidelity pass

- Added `.specs/` — granular per-module specs (data model, 3D model, scene/viewer, config
  panel, style presets, reference vehicle), more prescriptive than the narrative `docs/SDD.md`.
- Added `/add-catalog-option` skill (`.claude/skills/add-catalog-option/`) — the intended way
  to add new wheels/interiors/colors/steering-wheels/engines/chassis-years/presets from now on,
  instead of ad-hoc edits to `data/fusca.ts`.
- Added this memory file, seeded with project history to date.
- **3D model fidelity**: the placeholder body's proportions didn't read as a real Fusca (too
  wide/squat, wheels set too far outboard of the body), and had no doors or distinct windows —
  just one dark "window belt" blob. Reworked `FuscaModel.tsx` to real-world dimensions (length
  4.07m, width 1.55m, wheelbase 2.4m, track 1.3m — see `.specs/3d-model.spec.md`), added
  distinct windshield/rear-window/side-window panes, door seams + handles, running boards, a
  hood seam, rear vent louvers, and switched body paint to a clearcoat physical material.
  **Still not a real mesh** — this is a better-calibrated primitive placeholder, not a GLTF
  import. That remains the biggest open gap (see `docs/SDD.md` §6 / `3d-model.spec.md`).

## 2026-07-16 — Reference vehicle grounding + 360° turntable

- User shared 31 photos + 1 video of their real Fusca (`~/Downloads/Fusca/`). Copied into
  `reference/fusca-photos/`, **git-ignored** — the photos show the visible license plate, so
  they stay local-only by explicit user decision (asked, not assumed).
- Grounded several data entries in the photos: copper metallic color (`meu-fusca-cobre`,
  sampled hex, not an official VW code), steel wheel + small hubcap (`aco-hubcap`), vertical-oval
  taillight shape for the `square-71-85` chassis era. Bundled as the `meu-fusca` style preset.
- Added `chassisYears[].taillightShape` as an explicit field (was previously inferred from
  `bodyStyle` via a boolean in `FuscaModel.tsx`) — taillight shape and body era don't always
  move together historically, and the reference car needed a third shape (`vertical-oval`)
  distinct from the existing `round`/`square` branches.
- Added the 360° auto-rotate turntable: `configStore.autoRotate` (default `true`) feeds
  drei's built-in `OrbitControls autoRotate` — deliberately no custom animation loop. User
  chose "auto-rotate with pause toggle" over "manual-drag-only" or a locked 360-product-viewer
  mode, when asked.
- Went through a formal plan-mode pass for this round of changes at the user's request ("I want
  to use a plan and sdd") — plan file was `binary-growing-wigderson.md`, approved as-is.

## 2026-07-16 — Initial scaffold + working prototype

- Built from a one-line prompt request ("configure a Fusca in 3D, choose wheels/steering
  wheel/suspension height/colors/chassis year/interior/engine/style based on real-world
  references"). User later specified: repo at
  `/Users/rbrossi/Development/volkswagen-configuration`, scope = "scaffold + working prototype"
  (not just a scaffold, not a full build).
- Stack: Vite + React 19 + TypeScript + `@react-three/fiber`/`@react-three/drei` (Three.js) +
  `zustand`. Chosen for: no backend needed (static data + client-side render), R3F/drei is the
  standard React 3D stack with built-in OrbitControls/turntable support, zustand for minimal
  boilerplate over the shared config state.
- **npm/Vite gotcha**: the fresh `create-vite` scaffold defaulted to Vite 8's new rolldown
  bundler, which hit a known npm bug (npm/cli#4828) — platform-specific optional-dependency
  binaries (`@rolldown/binding-darwin-x64`) silently not installing even after cache
  clear + reinstall. Fixed by pinning to stable Vite 6 (esbuild/rollup-based) instead of
  chasing the npm bug further. If `npm run dev` ever fails with "Cannot find native binding"
  again, check `package.json`'s vite version before re-debugging npm.
- **drei `<Environment>` gotcha**: an HDRI environment map fetch hung silently (no console
  error, blank canvas) in this sandboxed/network-restricted dev environment. Removed in favor
  of plain local lighting (ambient + hemisphere + two directionals). Don't reintroduce
  `<Environment>` without confirming outbound network access or self-hosting the HDRI.
- Data/color catalog in `data/fusca.ts` is explicitly a **hand-curated starting reference set**,
  not verified against real VW do Brasil production records — flagged in the file's own header
  comment and in `docs/SDD.md` so it isn't mistaken for authoritative data later.
