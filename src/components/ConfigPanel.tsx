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
import { pickRealModel } from '../data/carModels'
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

  const selectedEngine = engineOptions.find((e) => e.id === state.engineId)!
  const selectedChassis = chassisYears.find((c) => c.id === state.chassisYearId)!
  const activeRealModel = pickRealModel(state.activePresetId, state.chassisYearId)

  return (
    <aside className="config-panel">
      <header>
        <h1>Fusca Configurator</h1>
        <p className="subtitle">Monte seu Fusca — Brazilian VW Beetle 3D builder</p>
      </header>

      {activeRealModel && (
        <div className="real-model-hint">
          Showing a real 3D model ({activeRealModel.label}, {activeRealModel.credit}).{' '}
          {activeRealModel.wheelMounts?.length ? (
            <>Wheel style swaps this model's real wheels.</>
          ) : (
            <>Wheel style won't visually apply on this model — its wheels aren't separable from the body.</>
          )}{' '}
          {activeRealModel.openableParts?.length ? (
            <>Doors, front trunk, and engine lid below do open on this model.</>
          ) : (
            <>This model has no separable doors/trunk/hood, so the openable-parts toggles below won't visually apply.</>
          )}{' '}
          {activeRealModel.recolorable === false ? (
            <>
              Exterior color won't visually apply on this model — its body is entirely rust/patina
              photo textures, and tinting them would just discolor the weathering.
            </>
          ) : (
            <>Exterior color repaints this model's body.</>
          )}{' '}
          Interior and steering wheel selections below are saved but won't visually apply to a
          real model.
        </div>
      )}

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

      <Section title="Openable Parts">
        <div className="swatch-row">
          <button
            type="button"
            className={`swatch-btn${state.doorsOpen ? ' active' : ''}`}
            onClick={() => state.toggleDoors()}
          >
            Doors: {state.doorsOpen ? 'Open' : 'Closed'}
          </button>
          <button
            type="button"
            className={`swatch-btn${state.frontTrunkOpen ? ' active' : ''}`}
            onClick={() => state.toggleFrontTrunk()}
          >
            Porta-malas: {state.frontTrunkOpen ? 'Open' : 'Closed'}
          </button>
          <button
            type="button"
            className={`swatch-btn${state.engineLidOpen ? ' active' : ''}`}
            onClick={() => state.toggleEngineLid()}
          >
            Tampa do Motor: {state.engineLidOpen ? 'Open' : 'Closed'}
          </button>
        </div>
      </Section>

      {activeRealModel?.key === 'model-1980' && (
        <Section title="Chassi (1973)">
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
                className={`swatch-btn${state.chassisView === view ? ' active' : ''}`}
                onClick={() => state.setChassisView(view)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="hint">
            Substitui a carroceria pela plataforma do Fusca (assoalhos, túnel central, chapéu de
            napoleão e travessas). Só no modelo de 1971–1985 (representa o 1973).
          </p>
        </Section>
      )}

      <Section title="Spec Sheet">
        <ul className="spec-list">
          <li>
            Engine: {selectedEngine.label} — {selectedEngine.parts.join(', ')}
          </li>
        </ul>
      </Section>
    </aside>
  )
}
