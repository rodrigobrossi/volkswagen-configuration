## What

<!-- One or two sentences. What does this PR change? -->

## Why

<!-- Link the issue, or explain the motivation. -->

## Branch target

<!-- Tick one. See docs/GITFLOW.md -->

- [ ] `feature/*` → `develop`
- [ ] `release/*` → `master` (and back-merged into `develop`)
- [ ] `hotfix/*` → `master` (and back-merged into `develop`)

## Checklist

- [ ] Branch name follows `feature/… | release/… | hotfix/…`
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] Verified in the 3D viewer (`npm run dev`) — screenshot/clip below if visual
- [ ] Brain updated: spec/ADR for behaviour changes, model note for profile changes, `L-` note for surprises
- [ ] `npm run brain:check` passes (0 errors)
- [ ] Pipeline/render change: parity probe unchanged for untouched models (`brain/specs/rendering.md`)
- [ ] For `release/*` / `hotfix/*`: `package.json` version bumped to match the tag

## Screenshots / notes

<!-- Visual changes: before/after. Otherwise delete this section. -->
