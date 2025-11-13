// src/scene/LODScene.jsx
import React from 'react'
import GcModel from '../chunks/GcModel'
import { useLODContext } from './LODContext'

export default function LODScene() {
  const { activeModels, onModelReady } = useLODContext()

  return (
    <>
      {Object.values(activeModels).map(model => (
        <GcModel
          key={`${model.id}-${model.url}`} // Force remount when URL changes
          url={model.url}
          position={model.position}
          onReady={(gltf) => onModelReady(model.id, gltf)}
          visible={true}
        />
      ))}
    </>
  )
}