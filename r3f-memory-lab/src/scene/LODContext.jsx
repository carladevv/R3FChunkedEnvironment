// src/scene/LODContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'

const LODContext = createContext()

// One config = one “LOD object” in the scene
const LOD_OBJECTS = [
  {
    id: 'Ground68_00',
    label: 'Ground68_00',

    // NEW: custom mesh
    meshFolder: 'models/environment/Ground68_00.glb',

    // Texture folders
    diffuseFolder: 'textures/LODs/Ground68_00/Diffuse_LODs',
    normalFolder: 'textures/LODs/Ground68_00/Normal_LODs',
    roughnessFolder: 'textures/LODs/Ground68_00/Roughness_LODs',
    aoFolder: 'textures/LODs/Ground68_00/AO_LODs',
  },
  {
    id: 'Ground68_01',
    label: 'Ground68_01',

    // NEW: custom mesh
    meshFolder: 'models/environment/Ground68_01.glb',

    // Texture folders
    diffuseFolder: 'textures/LODs/Ground68_00/Diffuse_LODs',
    normalFolder: 'textures/LODs/Ground68_00/Normal_LODs',
    roughnessFolder: 'textures/LODs/Ground68_00/Roughness_LODs',
    aoFolder: 'textures/LODs/Ground68_00/AO_LODs',
  },
  {
    id: 'Ground68_02',
    label: 'Ground68_02',

    // NEW: custom mesh
    meshFolder: 'models/environment/Ground68_02.glb',

    // Texture folders
    diffuseFolder: 'textures/LODs/Ground68_00/Diffuse_LODs',
    normalFolder: 'textures/LODs/Ground68_00/Normal_LODs',
    roughnessFolder: 'textures/LODs/Ground68_00/Roughness_LODs',
    aoFolder: 'textures/LODs/Ground68_00/AO_LODs',
  },
  {
    id: 'Ground68_03',
    label: 'Ground68_03',

    // NEW: custom mesh
    meshFolder: 'models/environment/Ground68_03.glb',

    // Texture folders
    diffuseFolder: 'textures/LODs/Ground68_00/Diffuse_LODs',
    normalFolder: 'textures/LODs/Ground68_00/Normal_LODs',
    roughnessFolder: 'textures/LODs/Ground68_00/Roughness_LODs',
    aoFolder: 'textures/LODs/Ground68_00/AO_LODs',
  },

  // Add more objects here and they’ll all spawn:
  // {
  //   id: 'Rock_01',
  //   label: 'Rock_01',
  //   meshFolder: 'models/environment/Rock_01.glb',
  //   diffuseFolder: 'textures/LODs/Rock_01/Diffuse_LODs',
  //   normalFolder: 'textures/LODs/Rock_01/Normal_LODs',
  //   roughnessFolder: 'textures/LODs/Rock_01/Roughness_LODs',
  //   aoFolder: 'textures/LODs/Rock_01/AO_LODs',
  // },
]

export function LODProvider({ children }) {
  const [objects, setObjects] = useState({})
  const [mode, setMode] = useState('manual') // 'manual' | 'auto'

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