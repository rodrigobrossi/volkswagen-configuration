#!/usr/bin/env node
// BRAIN CHECK — the governance gate. Fails (exit 1) when the knowledge and the code drift apart:
//   • every model profile is valid, registered data (schema, ids, assets, provenance notes)
//   • family model rules only point at existing profiles
//   • the vocabulary only hints slots the ontology defines
//   • every brain note has valid frontmatter; ids are unique; links resolve
//   • every `brain/...` path cited in code/tools exists (code never cites missing knowledge)
//   • duplicated rules that must stay identical in app and tools are identical
//   • the signature library is not older than the profiles it was learned from (warning)
// Brain: brain/specs/governance.md
//
//   npm run brain:check
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const errors = []
const warnings = []
const rel = (p) => path.relative(ROOT, p)
const read = (p) => fs.readFileSync(p, 'utf8')
const walk = (dir, filter) => {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name)
    if (d.isDirectory()) return d.name === 'node_modules' ? [] : walk(p, filter)
    return filter(p) ? [p] : []
  })
}

// ── ontology & vocabulary ──────────────────────────────────────────────────────────────────────
const ontology = JSON.parse(read(path.join(ROOT, 'src/core/ontology/ontology.json')))
const slotIds = new Set(ontology.slots.map((s) => s.id))
const openGroups = new Set(ontology.openGroups.map((g) => g.id))
const isSlotOrPrefix = (s) => slotIds.has(s) || [...slotIds].some((id) => id.startsWith(s + '.'))
ontology.slots.forEach((s) => {
  if (s.openGroup && !openGroups.has(s.openGroup)) errors.push(`ontology: slot ${s.id} → unknown openGroup ${s.openGroup}`)
  if (s.follows && !isSlotOrPrefix(s.follows)) errors.push(`ontology: slot ${s.id} follows unknown slot ${s.follows}`)
})
const vocab = JSON.parse(read(path.join(ROOT, 'src/core/ontology/vocabulary.json'))).tokens
for (const [token, v] of Object.entries(vocab)) {
  if (token !== token.toLowerCase()) errors.push(`vocabulary: token "${token}" must be lower-case`)
  if (v.slot && !isSlotOrPrefix(v.slot)) errors.push(`vocabulary: "${token}" → unknown slot ${v.slot}`)
}

// ── profiles ───────────────────────────────────────────────────────────────────────────────────
const profileIds = new Map()
const profileFiles = walk(path.join(ROOT, 'src/vehicles'), (p) => p.endsWith('.profile.json'))
let newestProfile = 0
for (const file of profileFiles) {
  const isDraft = file.includes(`${path.sep}drafts${path.sep}`)
  let p
  try {
    p = JSON.parse(read(file))
  } catch (e) {
    errors.push(`${rel(file)}: invalid JSON (${e.message})`)
    continue
  }
  newestProfile = Math.max(newestProfile, fs.statSync(file).mtimeMs)
  const at = rel(file)
  if (p.schema !== 'vehicle-profile/v1') errors.push(`${at}: schema must be "vehicle-profile/v1"`)
  if (!p.id || !p.family || !p.label) errors.push(`${at}: id, family and label are required`)
  const famFolder = file.split(`${path.sep}vehicles${path.sep}`)[1]?.split(path.sep)[0]
  if (p.family !== famFolder) errors.push(`${at}: family "${p.family}" ≠ folder "${famFolder}"`)
  if (!isDraft) {
    if (profileIds.has(p.id)) errors.push(`${at}: duplicate profile id ${p.id} (also ${profileIds.get(p.id)})`)
    profileIds.set(p.id, at)
    if (p.provenance?.status !== 'verified') errors.push(`${at}: only VERIFIED profiles may live in models/ (status ${p.provenance?.status})`)
    if (!p.provenance?.notes) errors.push(`${at}: provenance.notes must point at the model's brain note`)
    else if (!fs.existsSync(path.join(ROOT, p.provenance.notes))) errors.push(`${at}: provenance.notes ${p.provenance.notes} does not exist`)
  }
  if (!p.asset?.path) errors.push(`${at}: asset.path required`)
  else if (!isDraft && !fs.existsSync(path.join(ROOT, 'public', p.asset.path))) errors.push(`${at}: asset ${p.asset.path} missing from public/`)
  if (!(p.frame?.scale > 0)) errors.push(`${at}: frame.scale must be > 0`)
  for (const [i, o] of (p.openables ?? []).entries()) {
    if (!openGroups.has(o.group)) errors.push(`${at}: openables[${i}].group "${o.group}" not an ontology openGroup`)
    if (!['node', 'node-split-x', 'region-clip'].includes(o.extract?.kind)) errors.push(`${at}: openables[${i}].extract.kind unknown`)
    if (!['x', 'y'].includes(o.articulation?.axis)) errors.push(`${at}: openables[${i}].articulation.axis must be x|y`)
  }
}

// ── family rules point at real profiles ────────────────────────────────────────────────────────
for (const famFile of walk(path.join(ROOT, 'src/vehicles'), (p) => p.endsWith('family.ts'))) {
  const src = read(famFile)
  const rules = src.slice(src.indexOf('modelRules'), src.indexOf('models,', src.indexOf('modelRules')))
  for (const m of rules.matchAll(/'(model-[\w.-]+)'/g))
    if (!profileIds.has(m[1])) errors.push(`${rel(famFile)}: modelRules references unknown profile ${m[1]}`)
}

// ── brain notes ────────────────────────────────────────────────────────────────────────────────
const BRAIN = path.join(ROOT, 'brain')
const notes = walk(BRAIN, (p) => p.endsWith('.md'))
const ids = new Map()
const parsed = []
const TYPES = new Set(['index', 'vision', 'principle', 'ontology', 'contract', 'algorithm', 'agent', 'vehicle', 'model', 'decision', 'learning', 'spec', 'task', 'template', 'ingestion-report'])
for (const file of notes) {
  const text = read(file)
  const at = rel(file)
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) {
    errors.push(`${at}: missing frontmatter`)
    continue
  }
  const fm = {}
  m[1].split('\n').forEach((line) => {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].trim()
  })
  for (const k of ['id', 'type', 'title', 'status']) if (!fm[k]) errors.push(`${at}: frontmatter "${k}" missing`)
  if (fm.type && !TYPES.has(fm.type)) errors.push(`${at}: unknown type "${fm.type}"`)
  if (fm.type === 'template') continue
  if (fm.id) {
    if (ids.has(fm.id)) errors.push(`${at}: duplicate id ${fm.id} (also ${ids.get(fm.id)})`)
    ids.set(fm.id, at)
  }
  parsed.push({ file, at, fm, text })
}
const list = (v) => (v ? v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean) : [])
for (const { file, at, fm, text } of parsed) {
  for (const l of list(fm.links)) if (!ids.has(l)) errors.push(`${at}: links → unknown id ${l}`)
  for (const c of list(fm.code)) {
    const p = c.split('#')[0]
    if (!fs.existsSync(path.join(ROOT, p))) errors.push(`${at}: code → missing path ${p}`)
  }
  for (const mm of text.matchAll(/\]\(((?!https?:|#|mailto:)[^)\s]+)\)/g)) {
    const target = mm[1].split('#')[0]
    if (!target) continue
    if (!fs.existsSync(path.resolve(path.dirname(file), target))) errors.push(`${at}: broken link ${mm[1]}`)
  }
}

// ── code cites only existing knowledge ─────────────────────────────────────────────────────────
const codeFiles = [...walk(path.join(ROOT, 'src'), (p) => /\.(ts|tsx|json)$/.test(p)), ...walk(path.join(ROOT, 'tools'), (p) => p.endsWith('.mjs')), ...walk(path.join(ROOT, '.claude'), (p) => p.endsWith('.md'))]
for (const file of codeFiles) {
  for (const m of read(file).matchAll(/brain\/[\w./-]+?\.(md|json)/g)) {
    if (!fs.existsSync(path.join(ROOT, m[0]))) errors.push(`${rel(file)}: cites missing ${m[0]}`)
  }
}

// ── duplicated rules stay identical (app ↔ tools) ──────────────────────────────────────────────
const dropRe = (s) => s.match(/const DROP_TOKEN = (\/.*\/\w*)/)?.[1]
const appDrop = dropRe(read(path.join(ROOT, 'src/core/parts/discovery.ts')))
const toolDrop = dropRe(read(path.join(ROOT, 'tools/learning/features.mjs')))
if (appDrop !== toolDrop) errors.push(`nodeBaseName DROP_TOKEN differs between src/core/parts/discovery.ts and tools/learning/features.mjs`)

// ── learned library freshness ──────────────────────────────────────────────────────────────────
const libFile = path.join(BRAIN, 'learning/signature-library.json')
if (!fs.existsSync(libFile)) warnings.push('signature library missing — run `npm run brain:learn`')
else if (fs.statSync(libFile).mtimeMs < newestProfile) warnings.push('signature library is older than a profile — run `npm run brain:learn`')

warnings.forEach((w) => console.log(`warn  ${w}`))
errors.forEach((e) => console.log(`error ${e}`))
console.log(`\nbrain:check — ${notes.length} notes, ${profileFiles.length} profiles, ${ontology.slots.length} slots, ${Object.keys(vocab).length} tokens: ${errors.length} error(s), ${warnings.length} warning(s)`)
process.exit(errors.length ? 1 : 0)
