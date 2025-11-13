// Updated src/App.jsx
import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Environment } from '@react-three/drei'

import MetricsHud from './metrics/MetricsHud'
import MetricsCollector from './metrics/MetricCollector'

// LOD components
import { LODProvider } from './scene/LODContext'
import LODScene from './scene/LODScene'
import LODSwitchButton from './scene/LODSwitchButton'

import './metrics/panel.css'

export default function App() {
  const [metrics, setMetrics] = useState(null)

  const handleMetrics = useCallback((m) => {
    setMetrics(m)
  }, [])

  return (
    <LODProvider>
      {/* 3D Scene */}
      <Canvas
        style={{ position: 'fixed', inset: 0 }}
        gl={{ alpha: true, antialias: false }}
        dpr={[1, 1.5]}
        shadows={false}
      >
        {/* LOD objects will be rendered here as separate GcModel components */}
        <LODScene />

        {/* Your existing box */}
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        {/* metrics collector (inside canvas) */}
        <MetricsCollector onUpdate={handleMetrics} />

        {/* usual scene helpers */}
        <Stats />
        <OrbitControls />
        <Environment preset="forest" />
      </Canvas>

      {/* your HUD (outside canvas) */}
      <MetricsHud data={metrics} />

      {/* LOD controller button */}
      <LODSwitchButton />
    </LODProvider>
  )
}