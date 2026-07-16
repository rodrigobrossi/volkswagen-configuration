import {
  chassisYears,
  engineOptions,
  exteriorColors,
  interiorOptions,
  steeringWheelOptions,
  stylePresets,
  suspensionOptions,
  wheelOptions,
} from '../data/fusca'
import { useConfigStore } from '../store/configStore'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel-section">
      <h3>{title}</h3>
      {children}
    </div>
  )
}

function SwatchRow<T extends { id: string; label: string }>({
  options,
  selectedId,
  onSelect,
  renderSwatch,
}: {
  options: T[]
  selectedId: string
  onSelect: (id: string) => void
  renderSwatch?: (option: T) => React.ReactNode
}) {
  return (
    <div className="swatch-row">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`swatch-btn${option.id === selectedId ? ' active' : ''}`}
          onClick={() => onSelect(option.id)}
          title={option.label}
        >
          {renderSwatch ? renderSwatch(option) : option.label}
        </button>
      ))}
    </div>
  )
}

export function ConfigPanel() {
  const state = useConfigStore()

  const selectedInterior = interiorOptions.find((i) => i.id === state.interiorId)!
  const selectedSteering = steeringWheelOptions.find((s) => s.id === state.steeringWheelId)!
  const selectedEngine = engineOptions.find((e) => e.id === state.engineId)!
  const selectedChassis = chassisYears.find((c) => c.id === state.chassisYearId)!

  return (
    <aside className="config-panel">
      <header>
        <h1>Fusca Configurator</h1>
        <p className="subtitle">Monte seu Fusca — Brazilian VW Beetle 3D builder</p>
      </header>

      <Section title="Style Preset">
        <div className="preset-grid">
          {stylePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`preset-btn${preset.id === state.activePresetId ? ' active' : ''}`}
              onClick={() => state.applyPreset(preset.id)}
            >
              <strong>{preset.label}</strong>
              <span>{preset.description}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Chassis Year">
        <select
          value={state.chassisYearId}
          onChange={(e) => state.set({ chassisYearId: e.target.value })}
        >
          {chassisYears.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <p className="hint">{selectedChassis.note}</p>
      </Section>

      <Section title="Exterior Color">
        <SwatchRow
          options={exteriorColors}
          selectedId={state.exteriorColorId}
          onSelect={(id) => state.set({ exteriorColorId: id })}
          renderSwatch={(c) => (
            <span className="color-dot" style={{ background: c.hex }} />
          )}
        />
      </Section>

      <Section title="Wheels">
        <SwatchRow
          options={wheelOptions}
          selectedId={state.wheelId}
          onSelect={(id) => state.set({ wheelId: id })}
        />
      </Section>

      <Section title="Suspension Height">
        <SwatchRow
          options={suspensionOptions}
          selectedId={state.suspensionId}
          onSelect={(id) => state.set({ suspensionId: id })}
        />
      </Section>

      <Section title="Steering Wheel">
        <SwatchRow
          options={steeringWheelOptions}
          selectedId={state.steeringWheelId}
          onSelect={(id) => state.set({ steeringWheelId: id })}
        />
      </Section>

      <Section title="Interior">
        <SwatchRow
          options={interiorOptions}
          selectedId={state.interiorId}
          onSelect={(id) => state.set({ interiorId: id })}
          renderSwatch={(i) => (
            <span className="color-dot" style={{ background: i.hex }} />
          )}
        />
      </Section>

      <Section title="Engine">
        <SwatchRow
          options={engineOptions}
          selectedId={state.engineId}
          onSelect={(id) => state.set({ engineId: id })}
        />
      </Section>

      <Section title="Spec Sheet">
        <ul className="spec-list">
          <li>Interior: {selectedInterior.label}</li>
          <li>Steering wheel: {selectedSteering.label}</li>
          <li>
            Engine: {selectedEngine.label} — {selectedEngine.parts.join(', ')}
          </li>
        </ul>
      </Section>
    </aside>
  )
}
