// src/App.jsx
import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats, Environment } from '@react-three/drei'

// your existing components/paths (keep as-is)
import GcModel from './chunks/GcModel'
import MetricsHud from './metrics/MetricsHud'
import MetricsCollector from './metrics/MetricCollector'

// new components
import SceneJanitor from './scene/SceneJanitor'
import DeleteGeometriesButton from './scene/DeleteGeometriesButton'

// styles you already have
import './metrics/panel.css'

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
        {/* example content; keep your own */}
        <GcModel url="/models/tile_ground068_00.glb" position={[0, 0, 0]} />
        <GcModel url="/models/tile_ground068_01.glb" position={[2, 0, 0]} />
        <GcModel url="/models/tile_ground068_02.glb" position={[0, 0, 2]} />
        <GcModel url="/models/tile_ground068_03.glb" position={[2, 0, 2]} />

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
      <DeleteGeometriesButton />
    </>
  )
}
