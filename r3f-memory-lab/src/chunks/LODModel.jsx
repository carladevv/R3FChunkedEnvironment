// src/LODModel.jsx
import React, { useCallback, useMemo, useRef, useState } from 'react'
import GcModel from './GcModel'

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

export default function LODModel({
  base,          // e.g. "/models/castle"
  position = [0, 0, 0],
  initialLevel = 3, // 0..3 (03 highest by your spec)
}) {
  const [level, setLevel] = useState(initialLevel)
  const currentGltfRef = useRef(null)

  const urls = useMemo(() => ([
    `${base}/LOD_00.glb`,
    `${base}/LOD_01.glb`,
    `${base}/LOD_02.glb`,
    `${base}/LOD_03.glb`,
  ]), [base])

  const url = urls[level]

  const handleReady = useCallback((gltf) => {
    currentGltfRef.current = gltf
    // track URL globally for any tooling you might have
    if (typeof window !== 'undefined') {
      window.__R3F_ASSET_URLS = window.__R3F_ASSET_URLS || new Set()
      window.__R3F_ASSET_URLS.add(gltf?.scene?.userData?.__gltfUrl)
    }
  }, [])

  const switchTo = useCallback(async (next) => {
    if (next === level) return
    const prev = currentGltfRef.current
    const prevUrl = prev?.scene?.userData?.__gltfUrl

    // 1) dispose previous subtree (only this model)
    if (prev?.scene) {
      const stats = disposeSceneTree(prev.scene)
      // optional: console.info('[LODModel] disposed prev LOD', stats)
    }
    currentGltfRef.current = null

    // 2) clear loader cache for the previous URL (prevents lingering refs)
    try {
      const mod = await import('@react-three/drei')
      mod?.useGLTF?.clear?.(prevUrl)
    } catch {}

    // 3) mount next
    setLevel(() => Math.max(0, Math.min(3, next)))
  }, [level])

  // expose a tiny API via window (optional, handy for debugging)
  if (typeof window !== 'undefined') {
    window.__LOD_SWITCH__ = switchTo
  }

  return (
    <GcModel url={url} position={position} onReady={handleReady} />
  )
}
