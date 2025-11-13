// src/scene/LODContext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

const LODContext = createContext()

// Base folders for LOD objects
const LOD_BASE_FOLDERS = [
  'public/models/LODs/Ground68_00_LODs',
  // Add more folders here as needed
]

// ------- disposal helpers (scoped to a single scene tree) -------
function* iterMaterialTextures(material) {
  if (!material) return
  for (const key of Object.keys(material)) {
    const v = material[key]
    if (v && v.isTexture) yield v
  }
  const uniforms = material.uniforms
  if (uniforms && typeof uniforms === 'object') {
    for (const key of Object.keys(uniforms)) {
      const u = uniforms[key]
      const val = u && (u.value ?? u)
      if (val && val.isTexture) yield val
      if (Array.isArray(val)) for (const t of val) if (t?.isTexture) yield t
    }
  }
}
const disposeTex = (t) => { try { t?.dispose?.() } catch {} }
const disposeMat = (m) => {
  if (!m) return
  try {
    for (const t of iterMaterialTextures(m)) disposeTex(t)
    m.dispose?.()
  } catch {}
}
const disposeGeom = (g) => { try { g?.dispose?.() } catch {} }

function disposeSceneTree(root) {
  if (!root) return { mesh:0, geom:0, mat:0, tex:0 }
  let mesh=0, geom=0, mat=0, tex=0
  const targets = []
  root.traverse((o) => {
    if (o.isMesh || o.isPoints || o.isLine || o.isSprite) targets.push(o)
  })
  for (const o of targets) {
    mesh++
    if (o.geometry) { disposeGeom(o.geometry); o.geometry = null; geom++ }
    const mats = Array.isArray(o.material) ? o.material : [o.material].filter(Boolean)
    for (const m of mats) {
      for (const _ of iterMaterialTextures(m)) tex++
      disposeMat(m); mat++
    }
    o.material = null
    o.parent?.remove(o)
  }
  return { mesh, geom, mat, tex }
}
// ---------------------------------------------------------------


export function LODProvider({ children }) {
  const [objects, setObjects] = useState({})
  const modelRefs = useRef({})

  // Initialize objects
  useEffect(() => {
    const initialObjects = {}
    LOD_BASE_FOLDERS.forEach(folder => {
      const id = folder.split('/').pop()
      initialObjects[id] = {
        id,
        label: id,
        baseFolder: folder,
        level: 0,
        isLoading: false,
        currentUrl: `${folder}/LOD_00.glb`
      }
    })
    setObjects(initialObjects)
  }, [])

  const setLevel = async (objectId, newLevel) => {
    const object = objects[objectId]
    if (!object || object.level === newLevel) return

    const newUrl = `${object.baseFolder}/LOD_${String(newLevel).padStart(2, '0')}.glb`
    
    // Set loading state
    setObjects(prev => ({
      ...prev,
      [objectId]: {
        ...prev[objectId],
        isLoading: true
      }
    }))

    // Dispose current model
    const currentGltf = modelRefs.current[objectId]
    if (currentGltf?.scene) {
      disposeSceneTree(currentGltf.scene)
      
      try {
        const mod = await import('@react-three/drei')
        mod?.useGLTF?.clear?.(object.currentUrl)
      } catch {}
      
      modelRefs.current[objectId] = null
    }

    // Update to new level
    setObjects(prev => ({
      ...prev,
      [objectId]: {
        ...prev[objectId],
        level: newLevel,
        currentUrl: newUrl,
        isLoading: false
      }
    }))
  }

  const handleModelReady = (objectId, gltf) => {
    modelRefs.current[objectId] = gltf
    
    if (typeof window !== 'undefined') {
      window.__R3F_ASSET_URLS = window.__R3F_ASSET_URLS || new Set()
      window.__R3F_ASSET_URLS.add(gltf?.scene?.userData?.__gltfUrl)
    }
  }

  const value = {
    objects,
    setLevel,
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