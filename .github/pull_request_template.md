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
- [ ] `docs/SDD.md` updated if the data model, architecture, or §6 gaps changed
- [ ] For `release/*` / `hotfix/*`: `package.json` version bumped to match the tag

## Screenshots / notes

<!-- Visual changes: before/after. Otherwise delete this section. -->
