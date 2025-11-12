// src/scene/SceneJanitor.jsx
import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

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

const disposeTexture = (t) => { try { t?.dispose?.() } catch {} }
const disposeMaterial = (m) => {
  if (!m) return
  try {
    for (const t of iterMaterialTextures(m)) disposeTexture(t)
    m.dispose?.()
  } catch {}
}
const disposeGeometry = (g) => { try { g?.dispose?.() } catch {} }

export default function SceneJanitor() {
  const { scene, gl } = useThree()

  useEffect(() => {
    const handler = async () => {
      // 0) Let GcModel wrappers unmount FIRST (avoid remount after cache clear)
      await Promise.resolve() // microtask
      await new Promise((r) => requestAnimationFrame(() => r()))

      let meshCount = 0, geomCount = 0, matCount = 0, texCount = 0, extraTex = 0

      // 1) Collect drawables
      const drawables = []
      scene.traverse((o) => {
        if (o.isMesh || o.isPoints || o.isLine || o.isSprite) drawables.push(o)
      })

      // 2) Dispose them
      for (const o of drawables) {
        meshCount++
        if (o.geometry) {
          disposeGeometry(o.geometry)
          o.geometry = null
          geomCount++
        }
        const mats = Array.isArray(o.material) ? o.material : [o.material].filter(Boolean)
        for (const m of mats) {
          for (const _ of iterMaterialTextures(m)) texCount++
          disposeMaterial(m)
          matCount++
        }
        o.material = null
        o.parent?.remove(o)
      }

      // 3) Env/background
      if (scene.environment?.isTexture) {
        disposeTexture(scene.environment)
        scene.environment = null
        extraTex++
      }
      if (scene.background?.isTexture) {
        disposeTexture(scene.background)
        scene.background = null
        extraTex++
      }

      // 4) Reset renderer internals
      try {
        gl.setRenderTarget?.(null)
        gl.renderLists?.dispose?.()
        gl.info?.reset?.()
      } catch {}

      // 5) Clear loader caches for any GLTF URLs we’ve used
      const urlSet = new Set()
      if (typeof window !== 'undefined' && window.__R3F_ASSET_URLS) {
        for (const u of window.__R3F_ASSET_URLS) urlSet.add(u)
      }
      // (also pick up any lingering annotations just in case)
      scene.traverse((o) => {
        const u = o?.userData?.__gltfUrl
        if (typeof u === 'string') urlSet.add(u)
      })

      try {
        const mod = await import('@react-three/drei')
        if (mod?.useGLTF?.clear) {
          for (const url of urlSet) {
            try { mod.useGLTF.clear(url) } catch {}
          }
        }
        if (mod?.useTexture?.clear && window.__R3F_TEXTURE_URLS) {
          for (const url of window.__R3F_TEXTURE_URLS) {
            try { mod.useTexture.clear(url) } catch {}
          }
        }
      } catch {}

      // 6) Optional: clear generic file cache
      try {
        // eslint-disable-next-line no-undef
        if (typeof THREE !== 'undefined' && THREE?.Cache?.clear) THREE.Cache.clear()
      } catch {}

      console.info(
        `[SceneJanitor] Removed ${meshCount} drawables · disposed ${geomCount} geometries, ${matCount} materials, ~${texCount + extraTex} textures · cleared ${urlSet.size} GLTF cache entries`
      )
    }

    window.addEventListener('gc:delete-geometries', handler)
    return () => window.removeEventListener('gc:delete-geometries', handler)
  }, [scene, gl])

  return null
}
