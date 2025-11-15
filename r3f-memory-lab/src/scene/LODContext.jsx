// src/scene/LODContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'

const LODContext = createContext()

// Helper that generates the 16 tiles for a given ground name
function createEnvironmentTiles(baseName, count = 16) {
  return Array.from({ length: count }, (_, i) => {
    const index = String(i + 1).padStart(2, '0'); // 01, 02, ..., 16
    const id = `${baseName}_${index}`;
    const basePath = `models/${baseName}/${id}`;

    return {
      id,
      label: id,
      meshFolder: `${basePath}/${id}.glb`,
      diffuseFolder: `${basePath}/Diffuse`,
      normalFolder: `${basePath}/Normal`,
      roughnessFolder: `${basePath}/Roughness`,
      aoFolder: `${basePath}/AO`,
    };
  });
}

// Final config
const LOD_OBJECTS = [
  ...createEnvironmentTiles('Ground68', 16),
  ...createEnvironmentTiles('Ground48', 16),
  ...createEnvironmentTiles('Ground93', 16),
  ...createEnvironmentTiles('Rock58', 16),
];

export function LODProvider({ children }) {
  const [objects, setObjects] = useState({})
  const [mode, setMode] = useState('auto') // 'manual' | 'auto'

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
    <LODContext.Provider value={{ objects, setLevel, mode, setMode }}>
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