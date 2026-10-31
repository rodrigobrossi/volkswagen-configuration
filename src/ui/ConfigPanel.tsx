import type { CatalogOption, OptionGroup } from '../core/contracts/catalog'
import { OPEN_GROUPS } from '../core/ontology'
import { useConfigStore } from '../store/configStore'
import { usePartsStore } from '../store/partsStore'
import { useFamily, useResolvedModel, useSelected } from '../store/selectors'
import { PartsPanel } from './PartsPanel'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

type ColorOption = CatalogOption & { hex?: string }
/** Engine options may list their parts for the spec sheet. */
type SpecOption = CatalogOption & { parts?: string[] }

/** One option group, rendered by its declared `ui` — the panel knows no vehicle-specific field. */
function OptionGroupControl({ group }: { group: OptionGroup }) {
  const selectedId = useConfigStore((s) => s.selections[group.id])
  const select = useConfigStore((s) => s.select)
  const selected = group.options.find((o) => o.id === selectedId) ?? group.options[group.fallbackIndex ?? 0]

  if (group.ui === 'select') {
    return (
      <Section title={group.title}>
        <select value={selected.id} onChange={(e) => select(group.id, e.target.value)}>
          {group.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        {selected.note && <p className="hint">{selected.note}</p>}
      </Section>
    )
  }
  return (
    <Section title={group.title}>
      <div className="swatch-row">
        {(group.options as ColorOption[]).map((option) => (
          <button
            key={option.id}
            type="button"
            className={`swatch-btn${option.id === selectedId ? ' active' : ''}`}
            onClick={() => select(group.id, option.id)}
            title={option.label}
          >
            {group.ui === 'color' && option.hex ? <span className="color-dot" style={{ background: option.hex }} /> : option.label}
          </button>
        ))}
      </div>
    </Section>
  )
}

/**
 * Configurator panel — generated from the active family's option groups, presets and open groups,
 * plus what the resolved model's profile supports. Brain: brain/specs/config-panel.md.
 */
export function ConfigPanel() {
  const family = useFamily()
  const profile = useResolvedModel()
  const activePresetId = useConfigStore((s) => s.activePresetId)
  const applyPreset = useConfigStore((s) => s.applyPreset)
  const open = useConfigStore((s) => s.open)
  const toggleOpen = useConfigStore((s) => s.toggleOpen)
  const chassisView = useConfigStore((s) => s.chassisView)
  const setChassisView = useConfigStore((s) => s.setChassisView)
  const editorOpen = usePartsStore((s) => s.editorOpen)
  const setEditorOpen = usePartsStore((s) => s.setEditorOpen)
  const engine = useSelected<SpecOption>('engine')

  return (
    <aside className="config-panel">
      <header>
        <h1>{family.label}</h1>
        <p className="subtitle">{family.subtitle}</p>
      </header>

      {profile && (
        <div className="real-model-hint">
          Showing a real 3D model ({profile.label}, {profile.asset.credit}).{' '}
          {profile.wheels?.mounts.length ? (
            <>Wheel style swaps this model's real wheels.</>
          ) : (
            <>Wheel style won't visually apply on this model — its wheels aren't separable from the body.</>
          )}{' '}
          {profile.openables?.length ? (
            <>Doors, front trunk, and engine lid below do open on this model.</>
          ) : (
            <>This model has no separable doors/trunk/hood, so the openable-parts toggles below won't visually apply.</>
          )}{' '}
          Exterior color repaints this model's body (use the “Patina / Rat Look” color for a weathered finish).
          Interior and steering wheel selections below are saved but won't visually apply to a real model.
        </div>
      )}

      <Section title="Style Preset">
        <div className="preset-grid">
          {family.presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn${preset.id === activePresetId ? ' active' : ''}`}
              onClick={() => applyPreset(preset.id)}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
      </Section>

      {family.optionGroups.map((group) => (
        <OptionGroupControl key={group.id} group={group} />
      ))}

      <Section title="Openable Parts">
        <div className="swatch-row">
          {OPEN_GROUPS.map((g) => (
            <button key={g} type="button" className={`swatch-btn${open[g] ? ' active' : ''}`} onClick={() => toggleOpen(g)}>
              {family.openGroupLabels[g]}: {open[g] ? 'Open' : 'Closed'}
            </button>
          ))}
        </div>
      </Section>

      {profile?.platform?.enabled && family.platform && (
        <Section title="Chassi (plataforma)">
          <div className="swatch-row">
            {(
              [
                ['off', 'Carro'],
                ['assembled', 'Chassi montado'],
                ['exploded', 'Chassi explodido'],
              ] as const
            ).map(([view, label]) => (
              <button
                key={view}
                type="button"
                className={`swatch-btn${chassisView === view ? ' active' : ''}`}
                onClick={() => setChassisView(view)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="hint">
            Substitui a carroceria pela plataforma da família (assoalhos, túnel central, chapéu de napoleão e travessas).
          </p>
        </Section>
      )}

      {profile && (
        <div className="panel-section">
          <button type="button" className="swatch-btn add-part-btn" onClick={() => setEditorOpen(!editorOpen)}>
            {editorOpen ? '▾ Editor de peças' : '▸ Editor de peças (avançado)'}
          </button>
        </div>
      )}
      {profile && editorOpen && <PartsPanel modelKey={profile.id} />}

      <Section title="Spec Sheet">
        <ul className="spec-list">
          <li>
            Engine: {engine.label}
            {engine.parts?.length ? ` — ${engine.parts.join(', ')}` : ''}
          </li>
        </ul>
      </Section>
    </aside>
  )
}
