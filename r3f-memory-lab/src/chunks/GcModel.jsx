// src/chunks/GcModel.jsx
import React, { useEffect } from 'react'
import { useGLTF } from '@react-three/drei'

export default function GcModel({
  url,
  position = [0, 0, 0],
  onReady,
  visible = true,
}) {
  const gltf = useGLTF(url)

  useEffect(() => {
    gltf.scene.userData.__gltfUrl = url
    gltf.scene.name ||= `GcModel:${url}`
    onReady?.(gltf)
  }, [gltf, url, onReady])

  return (
      <primitive
        object={gltf.scene}
        position={position}
        visible={visible}
      />
  )
}
