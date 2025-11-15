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
        <mesh position={[0,1,0]}>
          <boxGeometry args={[0.5, 2, 0.5]} />
          <meshStandardMaterial color="orange" />
        </mesh>

        {/* metrics collector (inside canvas) */}
        <MetricsCollector onUpdate={handleMetrics} />

        {/* usual scene helpers */}
        <Stats />
        <OrbitControls />
        <Environment preset="forest" environmentIntensity={0.2} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
      </Canvas>

      {/* your HUD (outside canvas) */}
      {/* <MetricsHud data={metrics} /> */}

      {/* LOD controller button */}
      <LODSwitchButton />
    </LODProvider>
  )
}