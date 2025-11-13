// Updated LODScene.jsx
import React from 'react'
import { Suspense } from 'react'
import GcModel from '../chunks/GcModel'
import { useLODContext } from './LODContext'

const LODModelInstance = React.memo(({ model }) => {
  const { onModelReady } = useLODContext()

  const handleReady = (gltf) => {
    onModelReady(model.id, gltf)
  }

  return (
    <GcModel
      key={`${model.id}-${model.currentUrl}`} // This ensures complete remount on URL change
      url={model.currentUrl}
      position={[0, 0, 0]}
      onReady={handleReady}
      visible={true}
    />
  )
})

export default function LODScene() {
  const { objects } = useLODContext()

  return (
    
    <Suspense>
      {Object.values(objects).map(model => (
        
        <LODModelInstance
          key={model.id}
          model={model}
        />
      ))}
    </Suspense>
  )
}