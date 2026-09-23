import { exteriorColors } from '../data/fusca'
import { deleteAsset, putAsset } from '../data/partsAssets'
import { partKey, usePartsStore } from '../store/partsStore'

type Vec3 = [number, number, number]

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  fmt?: (v: number) => string
}) {
  return (
    <label className="adj-row">
      <span className="adj-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="adj-val">{fmt ? fmt(value) : value.toFixed(2)}</span>
    </label>
  )
}

/**
 * Painel "Peças": lista automática das peças do modelo (do GLTF) + peças ADICIONADAS pelo usuário.
 * Por peça: mostrar/ocultar, cor e (modo Ajuste) posição/escala/rotação; e calibração do modelo. As
 * peças adicionadas (GLTF via upload) são posicionadas/escaladas pelos mesmos sliders e removíveis.
 */
export function PartsPanel({ modelKey }: { modelKey: string }) {
  const parts = usePartsStore((s) => s.discoveredParts)
  const overrides = usePartsStore((s) => s.partOverrides)
  const selected = usePartsStore((s) => s.selectedPartKey)
  const adjustMode = usePartsStore((s) => s.adjustMode)
  const modelCalib = usePartsStore((s) => s.modelCalib)
  const extraParts = usePartsStore((s) => s.extraParts)
  const selectPart = usePartsStore((s) => s.selectPart)
  const setPartOverride = usePartsStore((s) => s.setPartOverride)
  const resetPart = usePartsStore((s) => s.resetPart)
  const setAdjustMode = usePartsStore((s) => s.setAdjustMode)
  const setModelCalib = usePartsStore((s) => s.setModelCalib)
  const resetModelCalib = usePartsStore((s) => s.resetModelCalib)
  const addExtraPart = usePartsStore((s) => s.addExtraPart)
  const updateExtraPart = usePartsStore((s) => s.updateExtraPart)
  const removeExtraPart = usePartsStore((s) => s.removeExtraPart)

  const myExtras = extraParts.filter((p) => p.modelKey === modelKey)
  if (!parts.length && !myExtras.length) return null

  const calib = modelCalib[modelKey] ?? {}

  async function onAddFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const id = crypto.randomUUID()
    await putAsset(id, file)
    addExtraPart({
      id,
      modelKey,
      name: file.name.replace(/\.(glb|gltf)$/i, ''),
      assetId: id,
      position: [0, 0, 0.5],
      scale: [1, 1, 1],
      rotation: [0, 0, 0],
    })
    selectPart(`extra:${id}`)
    setAdjustMode(true)
  }

  const selectedExtra = selected?.startsWith('extra:') ? myExtras.find((p) => `extra:${p.id}` === selected) : undefined
  const selectedPart = !selectedExtra ? parts.find((p) => p.key === selected) : undefined
  const selKey = selectedPart ? partKey(modelKey, selectedPart.key) : null
  const selOv = selKey ? overrides[selKey] : undefined

  const pos: Vec3 = selOv?.position ?? [0, 0, 0]
  const scl: Vec3 = selOv?.scale ?? [1, 1, 1]
  const rot: Vec3 = selOv?.rotation ?? [0, 0, 0]
  const setPartVec = (field: 'position' | 'rotation', i: number, v: number) => {
    const cur = (field === 'position' ? pos : rot).slice() as Vec3
    cur[i] = v
    setPartOverride(selKey!, { [field]: cur })
  }

  return (
    <div className="panel-section">
      <div className="parts-head">
        <h3>Peças ({parts.length + myExtras.length})</h3>
        <button
          type="button"
          className={`swatch-btn${adjustMode ? ' active' : ''}`}
          onClick={() => setAdjustMode(!adjustMode)}
        >
          {adjustMode ? 'Ajuste: ON' : 'Ajuste'}
        </button>
      </div>

      {adjustMode && (
        <div className="part-editor">
          <div className="part-editor-head">
            <strong>Modelo — escala & rotação</strong>
            <button type="button" className="link-btn" onClick={() => resetModelCalib(modelKey)}>
              Restaurar
            </button>
          </div>
          <Slider
            label="Escala"
            value={calib.scaleMul ?? 1}
            min={0.6}
            max={1.6}
            step={0.01}
            onChange={(v) => setModelCalib(modelKey, { scaleMul: v })}
            fmt={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="Girar Y"
            value={calib.rotationYDeg ?? 0}
            min={-180}
            max={180}
            step={1}
            onChange={(v) => setModelCalib(modelKey, { rotationYDeg: v })}
            fmt={(v) => `${Math.round(v)}°`}
          />
        </div>
      )}

      <div className="parts-list">
        {parts.map((p) => {
          const ov = overrides[partKey(modelKey, p.key)]
          const tag = ov?.hidden ? 'oculta' : ov?.color ? 'colorida' : ov?.position || ov?.scale || ov?.rotation ? 'ajustada' : ''
          return (
            <button
              key={p.key}
              type="button"
              className={`part-row${p.key === selected ? ' active' : ''}`}
              onClick={() => selectPart(p.key === selected ? null : p.key)}
            >
              <span className="part-name">{p.label}</span>
              <span className="part-meta">
                {ov?.color && <span className="color-dot" style={{ background: ov.color }} />}
                {tag && <span className="part-tag">{tag}</span>}
              </span>
            </button>
          )
        })}
        {myExtras.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`part-row${`extra:${p.id}` === selected ? ' active' : ''}`}
            onClick={() => selectPart(`extra:${p.id}` === selected ? null : `extra:${p.id}`)}
          >
            <span className="part-name">{p.name}</span>
            <span className="part-meta">
              <span className="part-tag">adicionada</span>
            </span>
          </button>
        ))}
      </div>

      <label className="swatch-btn add-part-btn">
        + Adicionar peça (GLTF)
        <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" onChange={onAddFile} hidden />
      </label>

      {/* Editor de peça do GLTF */}
      {selectedPart && selKey && (
        <div className="part-editor">
          <div className="part-editor-head">
            <strong>{selectedPart.label}</strong>
            <button type="button" className="link-btn" onClick={() => resetPart(selKey)}>
              Restaurar
            </button>
          </div>

          <button
            type="button"
            className={`swatch-btn${selOv?.hidden ? ' active' : ''}`}
            onClick={() => setPartOverride(selKey, { hidden: !selOv?.hidden })}
          >
            {selOv?.hidden ? 'Peça oculta — mostrar' : 'Ocultar peça'}
          </button>

          <p className="hint" style={{ marginTop: 10 }}>Cor</p>
          <div className="swatch-row">
            <button
              type="button"
              className={`swatch-btn${!selOv?.color ? ' active' : ''}`}
              onClick={() => setPartOverride(selKey, { color: undefined })}
              title="Cor original"
            >
              Original
            </button>
            {exteriorColors.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`swatch-btn${selOv?.color === c.hex ? ' active' : ''}`}
                onClick={() => setPartOverride(selKey, { color: c.hex, finish: c.finish })}
                title={c.label}
              >
                <span className="color-dot" style={{ background: c.hex }} />
              </button>
            ))}
          </div>

          {adjustMode && (
            <>
              <p className="hint" style={{ marginTop: 10 }}>Posição (m)</p>
              <Slider label="X" value={pos[0]} min={-0.6} max={0.6} step={0.01} onChange={(v) => setPartVec('position', 0, v)} />
              <Slider label="Y" value={pos[1]} min={-0.6} max={0.6} step={0.01} onChange={(v) => setPartVec('position', 1, v)} />
              <Slider label="Z" value={pos[2]} min={-0.6} max={0.6} step={0.01} onChange={(v) => setPartVec('position', 2, v)} />
              <p className="hint" style={{ marginTop: 8 }}>Escala</p>
              <Slider label="×" value={scl[0]} min={0.2} max={3} step={0.05} onChange={(v) => setPartOverride(selKey, { scale: [v, v, v] })} fmt={(v) => `${v.toFixed(2)}x`} />
              <p className="hint" style={{ marginTop: 8 }}>Rotação (°)</p>
              <Slider label="X" value={rot[0]} min={-180} max={180} step={1} onChange={(v) => setPartVec('rotation', 0, v)} fmt={(v) => `${Math.round(v)}°`} />
              <Slider label="Y" value={rot[1]} min={-180} max={180} step={1} onChange={(v) => setPartVec('rotation', 1, v)} fmt={(v) => `${Math.round(v)}°`} />
              <Slider label="Z" value={rot[2]} min={-180} max={180} step={1} onChange={(v) => setPartVec('rotation', 2, v)} fmt={(v) => `${Math.round(v)}°`} />
            </>
          )}
        </div>
      )}

      {/* Editor de peça ADICIONADA */}
      {selectedExtra && (
        <div className="part-editor">
          <div className="part-editor-head">
            <strong>{selectedExtra.name}</strong>
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                removeExtraPart(selectedExtra.id)
                deleteAsset(selectedExtra.assetId)
                selectPart(null)
              }}
            >
              Remover
            </button>
          </div>
          <p className="hint">Posição (m)</p>
          {(['X', 'Y', 'Z'] as const).map((ax, i) => (
            <Slider
              key={`p${ax}`}
              label={ax}
              value={selectedExtra.position[i]}
              min={-1.2}
              max={1.2}
              step={0.01}
              onChange={(v) => {
                const n = selectedExtra.position.slice() as Vec3
                n[i] = v
                updateExtraPart(selectedExtra.id, { position: n })
              }}
            />
          ))}
          <p className="hint" style={{ marginTop: 8 }}>Escala (m)</p>
          <Slider
            label="×"
            value={selectedExtra.scale[0]}
            min={0.05}
            max={3}
            step={0.05}
            onChange={(v) => updateExtraPart(selectedExtra.id, { scale: [v, v, v] })}
            fmt={(v) => `${v.toFixed(2)}m`}
          />
          <p className="hint" style={{ marginTop: 8 }}>Rotação (°)</p>
          {(['X', 'Y', 'Z'] as const).map((ax, i) => (
            <Slider
              key={`r${ax}`}
              label={ax}
              value={selectedExtra.rotation[i]}
              min={-180}
              max={180}
              step={1}
              onChange={(v) => {
                const n = selectedExtra.rotation.slice() as Vec3
                n[i] = v
                updateExtraPart(selectedExtra.id, { rotation: n })
              }}
              fmt={(v) => `${Math.round(v)}°`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
