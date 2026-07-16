import { ConfigPanel } from './components/ConfigPanel'
import { Scene } from './components/Scene'
import { useConfigStore } from './store/configStore'
import './App.css'

function App() {
  const autoRotate = useConfigStore((s) => s.autoRotate)
  const toggleAutoRotate = useConfigStore((s) => s.toggleAutoRotate)

  return (
    <div className="app-layout">
      <div className="viewer">
        <Scene />
        <button type="button" className="rotate-toggle" onClick={toggleAutoRotate}>
          {autoRotate ? '⏸ 360°' : '⏵ 360°'}
        </button>
      </div>
      <ConfigPanel />
    </div>
  )
}

export default App
