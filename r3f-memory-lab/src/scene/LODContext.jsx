// src/scene/LODContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'

const LODContext = createContext()

// One config = one “LOD object” in the scene
// Everything is explicit here to avoid any path/regex weirdness
const LOD_OBJECTS = [
  {
    id: 'Ground68_00',
    label: 'Ground68_00',
    diffuseFolder: 'textures/LODs/Ground68_00/Diffuse_LODs',
    normalFolder: 'textures/LODs/Ground68_00/Normal_LODs',
    roughnessFolder:   'textures/LODs/Ground68_00/Roughness_LODs', 
    aoFolder: 'textures/LODs/Ground68_00/AO_LODs',
  },
  // Add more objects here later if you want
]

export function LODProvider({ children }) {
  const [objects, setObjects] = useState({})

  // Initialize objects once
  useEffect(() => {
    const initial = {}
    LOD_OBJECTS.forEach((cfg) => {
      initial[cfg.id] = {
        ...cfg,
        level: 0,
        isLoading: false,
      }
    })
    setObjects(initial)
  }, [])

  const setLevel = (objectId, newLevel) => {
    setObjects((prev) => {
      const obj = prev[objectId]
      if (!obj || obj.level === newLevel) return prev

      return {
        ...prev,
        [objectId]: {
          ...obj,
          level: newLevel,
        },
      }
    })
  }

  return (
    <LODContext.Provider value={{ objects, setLevel }}>
      {children}
    </LODContext.Provider>
  )
}

export function useLODContext() {
  const ctx = useContext(LODContext)
  if (!ctx) {
    throw new Error('useLODContext must be used within LODProvider')
  }
  return ctx
}
