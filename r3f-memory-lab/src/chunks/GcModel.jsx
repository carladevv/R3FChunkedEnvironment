import React from 'react'
import { useGLTF } from '@react-three/drei'

/**
 * GcModel
 * - Loads a GLB and mounts its scene.
 * - Props:
 *    - url: string (path to .glb)
 *    - position?: [number, number, number]
 *
 * Notes:
 * - We rely on R3F's default disposal on unmount (no `dispose={null}`).
 * - Put .glb files in /public/models/... for easy local testing.
 */
export default function GcModel({ url, position = [0, 0, 0] }) {
  const gltf = useGLTF(url)

  // Optional: ensure names exist for your HUD "per-mesh" list
  gltf.scene.name ||= `GcModel:${url}`

  return (
    <primitive object={gltf.scene} position={position} />
  )
}

// Optional: you can preload common assets if helpful
// useGLTF.preload('/models/your-model.glb')
