// src/GcModel.jsx (or your current path)
import React, { useEffect, useState, memo } from 'react'
import { useGLTF } from '@react-three/drei'

function GcModelInner({ url, position = [0, 0, 0] }) {
  const gltf = useGLTF(url)
  // annotate for debugging + janitor URL discovery
  gltf.scene.userData.__gltfUrl = url
  gltf.scene.name ||= `GcModel:${url}`
  return <primitive object={gltf.scene} position={position} />
}

/**
 * GcModel
 * - Renders while `alive === true`.
 * - On 'gc:delete-geometries' event, it flips `alive` to false => unmounts loader.
 *   This prevents re-fetch/remount after caches are cleared.
 */
export default function GcModel({ url, position }) {
  const [alive, setAlive] = useState(true)

  useEffect(() => {
    const kill = () => setAlive(false)
    window.addEventListener('gc:delete-geometries', kill)
    return () => window.removeEventListener('gc:delete-geometries', kill)
  }, [])

  if (!alive) return null
  return <GcModelInner url={url} position={position} />
}

// Optional: keep using preload elsewhere if you want
// useGLTF.preload('/models/whatever.glb')
