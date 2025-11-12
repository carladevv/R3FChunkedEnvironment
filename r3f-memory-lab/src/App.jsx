// src/App.jsx
import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Environment } from '@react-three/drei'

// your existing components/paths (keep as-is)
import GcModel from './chunks/GcModel'
import LODModel from './chunks/LODModel'
import MetricsHud from './metrics/MetricsHud'
import MetricsCollector from './metrics/MetricCollector'

// new components
import SceneJanitor from './scene/SceneJanitor'
import LODSwitchButton from './scene/LODSwitchButton'

// styles you already have
import './metrics/panel.css'

// reflect LOD changes to the global (for the button cycle UX)
// not strictly necessary; just convenient to show the current index externally
if (typeof window !== 'undefined' && window.__LOD_CURRENT__ == null) {
  window.__LOD_CURRENT__ = 3
}

export default function App() {
  const [metrics, setMetrics] = useState(null)

  const handleMetrics = useCallback((m) => {
    setMetrics(m)
  }, [])

  return (
    <>
      {/* 3D Scene */}
      <Canvas
        style={{ position: 'fixed', inset: 0 }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
        shadows={false}
      >
         {/* swap your base to the folder that contains LOD_00.glb .. LOD_03.glb */}
        <LODModel base="/models/LODs/Ground68_00_LODs" position={[0, 0, 0]} initialLevel={0} />

        {/* metrics collector (inside canvas) */}
        <MetricsCollector onUpdate={handleMetrics} />

        {/* janitor listens for the global event and disposes scene assets */}
        <SceneJanitor />

        {/* usual scene helpers */}
        <Stats />
        <OrbitControls />
        <Environment preset="forest" />
      </Canvas>

      {/* your HUD (outside canvas) */}
      <MetricsHud data={metrics} />

      {/* independent bottom-left button (outside canvas) */}
      <LODSwitchButton />
    </>
  )
}
