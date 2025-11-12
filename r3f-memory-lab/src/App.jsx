import { Canvas } from '@react-three/fiber'
import MetricsHud from './metrics/MetricsHud'
import GcModel from './chunks/GcModel'
import { Stats } from '@react-three/drei'
import { OrbitControls } from '@react-three/drei'

export default function App() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0 }}
      gl={{ alpha: true, antialias: false }}
      dpr={[1, 1.5]}
      shadows={false}
    >
      {/* Your first chunk */}
      <GcModel url="/models/tile_ground068.glb" position={[0, 0, 0]} />

      {/* HUD */}
      <MetricsHud />
      <Stats />

      {/* Controls */}
      <OrbitControls />
    </Canvas>
  )
}
