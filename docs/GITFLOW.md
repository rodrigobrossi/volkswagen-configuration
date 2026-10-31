# GitFlow — Fusca 3D Configurator

Branching model for this repository. **`master` is the one**: it is the default branch and
the single source of truth for what is released. Nothing is committed to it directly.

---

## 1. Permanent branches

| Branch | Role | Who writes to it | Lifetime |
|---|---|---|---|
| `master` | Production. Every commit is a release, tagged `vX.Y.Z`. | Merges from `release/*` and `hotfix/*` only. | Forever |
| `develop` | Integration. Next release in progress. | Merges from `feature/*`, `release/*`, `hotfix/*`. | Forever |

`master` never receives a direct commit and never receives a `feature/*` merge.
If something is on `master`, it was released.

## 2. Supporting branches

| Prefix | Branches from | Merges back into | Naming |
|---|---|---|---|
| `feature/*` | `develop` | `develop` | `feature/openable-doors`, `feature/mobile-layout` |
| `release/*` | `develop` | `master` **and** `develop` | `release/0.2.0` |
| `hotfix/*` | `master` | `master` **and** `develop` | `hotfix/0.1.1-wheel-crash` |

Supporting branches are deleted after they merge.

### Naming rules

- Lowercase, kebab-case, no spaces: `feature/baja-bug-preset`.
- Release and hotfix branches are named for the version they produce, no `v` prefix.
- Prefix is mandatory — `fix/…`, `chore/…`, `wip-stuff` are not part of the model.
  Use `feature/*` for anything that targets `develop`.

## 3. Versioning

[Semantic Versioning](https://semver.org/). Tags are annotated and carry the `v` prefix
(`v0.2.0`); branches do not (`release/0.2.0`).

- **MAJOR** — breaking change to saved configurations or the public config schema.
- **MINOR** — new catalog options, presets, viewer features.
- **PATCH** — bug fixes only.

`package.json` `version` is bumped on the release/hotfix branch and must match the tag.

## 4. Workflows

Commands below are plain `git` — nothing extra to install. The equivalent
[git-flow (AVH)](https://github.com/petervanderdoes/gitflow-avh) command is listed
underneath each one; this repo is already configured for it (see §6).

### Feature

```bash
git checkout develop && git pull origin develop
git checkout -b feature/my-thing
# …work, commit…
git push -u origin feature/my-thing
# open a PR: feature/my-thing -> develop, squash or merge, delete the branch
```
> `git flow feature start my-thing` / `git flow feature finish my-thing`

Features always merge into `develop` through a pull request, never into `master`.

### Release

```bash
git checkout develop && git pull origin develop
git checkout -b release/0.2.0
npm version 0.2.0 --no-git-tag-version   # bump package.json
git commit -am "chore(release): 0.2.0"
git push -u origin release/0.2.0
```
Only release-hardening commits go here: version bump, changelog, bug fixes found in
testing. No new features — those keep landing on `develop` for the release after.

To ship it:

```bash
# 1. into master, tagged
git checkout master && git pull origin master
git merge --no-ff release/0.2.0 -m "chore(release): merge release/0.2.0 into master"
git tag -a v0.2.0 -m "Release 0.2.0"
git push origin master --follow-tags

# 2. back into develop, so the bump and fixes are not lost
git checkout develop && git pull origin develop
git merge --no-ff release/0.2.0 -m "chore(release): merge release/0.2.0 back into develop"
git push origin develop

# 3. clean up
git branch -d release/0.2.0 && git push origin --delete release/0.2.0
```
> `git flow release start 0.2.0` / `git flow release finish 0.2.0`

### Hotfix

Same shape as a release, but it branches from `master` because `develop` may contain
unreleased work that must not ship with the fix.

```bash
git checkout master && git pull origin master
git checkout -b hotfix/0.1.1-wheel-crash
# …fix + bump package.json to 0.1.1…
git checkout master
git merge --no-ff hotfix/0.1.1-wheel-crash
git tag -a v0.1.1 -m "Hotfix 0.1.1"
git push origin master --follow-tags
git checkout develop && git merge --no-ff hotfix/0.1.1-wheel-crash && git push origin develop
git branch -d hotfix/0.1.1-wheel-crash
```
> `git flow hotfix start 0.1.1` / `git flow hotfix finish 0.1.1`

**A hotfix is not finished until it is also on `develop`.** Skipping that merge means the
next release silently reintroduces the bug.

## 5. Merge rules

- `feature/* -> develop`: squash or merge commit, whichever keeps history readable.
- `release/* -> master` and `hotfix/* -> master`: **always `--no-ff`**, so each release is
  one identifiable merge commit on `master`.
- Never rebase a branch that is shared or already pushed and reviewed.
- Never `git push --force` to `master` or `develop`.

## 6. Local configuration

Git config lives in `.git/config`, which is not committed — run this once per clone to
teach git-flow (AVH) this repo's layout:

```bash
git config gitflow.branch.master master
git config gitflow.branch.develop develop
git config gitflow.prefix.feature feature/
git config gitflow.prefix.bugfix bugfix/
git config gitflow.prefix.release release/
git config gitflow.prefix.hotfix hotfix/
git config gitflow.prefix.support support/
git config gitflow.prefix.versiontag v
```

With that in place, `git flow init -d` adopts the model without prompting.
Install the tooling if you want the shortcuts: `brew install git-flow-avh`.

## 7. Recommended branch protection (GitHub)

Set on `master`, and the first three on `develop`:

- Require a pull request before merging (1 approval).
- Require status checks to pass.
- Require branches to be up to date before merging.
- Block force pushes and deletions.
- Restrict who can merge into `master` to maintainers.

## 8. Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`.

```
feat(viewer): add engine-bay cutaway view
fix(wheels): correct rim offset on 15" Fuchs
chore(release): 0.2.0
```

Scope is optional and should name the area touched (`viewer`, `catalog`, `store`, `ui`).
