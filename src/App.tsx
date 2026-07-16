import { ConfigPanel } from './components/ConfigPanel'
import { Scene } from './components/Scene'
import './App.css'

function App() {
  return (
    <div className="app-layout">
      <div className="viewer">
        <Scene />
      </div>
      <ConfigPanel />
    </div>
  )
}

export default App
