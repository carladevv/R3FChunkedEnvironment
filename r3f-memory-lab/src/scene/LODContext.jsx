// src/scene/LODContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'

const LODContext = createContext()

// Base folders for LOD objects
const LOD_BASE_FOLDERS = [
  'public/models/LODs/Ground68_00_LODs',
  // Add more folders here as needed
]

export function LODProvider({ children }) {
  const [objects, setObjects] = useState({})
  const [activeModels, setActiveModels] = useState({})

  // Initialize objects from base folders
  useEffect(() => {
    const initialObjects = {}
    LOD_BASE_FOLDERS.forEach(folder => {
      const id = folder.split('/').pop() // Use folder name as ID
      initialObjects[id] = {
        id,
        label: id,
        baseFolder: folder,
        level: 0, // Start at LOD 0
        isLoading: false
      }
    })
    setObjects(initialObjects)
  }, [])

  // Update active models when objects change
  useEffect(() => {
    const newActiveModels = {}
    
    Object.values(objects).forEach(obj => {
      const lodUrl = `${obj.baseFolder}/LOD_${String(obj.level).padStart(2, '0')}.glb`
      
      // Keep existing model if URL hasn't changed
      if (activeModels[obj.id] && activeModels[obj.id].url === lodUrl) {
        newActiveModels[obj.id] = activeModels[obj.id]
      } else {
        // Create new model entry
        newActiveModels[obj.id] = {
          id: obj.id,
          url: lodUrl,
          isLoading: obj.isLoading,
          position: [0, 0, 0] // Default position, can be customized
        }
      }
    })

    setActiveModels(newActiveModels)
  }, [objects])

  const setLevel = (objectId, level) => {
    setObjects(prev => ({
      ...prev,
      [objectId]: {
        ...prev[objectId],
        level: level,
        isLoading: true
      }
    }))
  }

  const handleModelReady = (objectId, gltf) => {
    setObjects(prev => ({
      ...prev,
      [objectId]: {
        ...prev[objectId],
        isLoading: false
      }
    }))
  }

  const value = {
    objects,
    setLevel,
    activeModels,
    onModelReady: handleModelReady
  }

  return (
    <LODContext.Provider value={value}>
      {children}
    </LODContext.Provider>
  )
}

export function useLODContext() {
  const context = useContext(LODContext)
  if (!context) {
    throw new Error('useLODContext must be used within LODProvider')
  }
  return context
}