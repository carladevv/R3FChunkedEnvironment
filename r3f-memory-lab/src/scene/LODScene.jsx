// src/scene/LODScene.jsx
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useLODContext } from './LODContext'

function LODTexturedMesh({ object }) {
  const {
    meshFolder,
    diffuseFolder,
    normalFolder,
    roughnessFolder,
    aoFolder,
    level,
  } = object

  // Load the base mesh once
  const gltf = useGLTF(meshFolder)

  // ONE TextureLoader per component
  const loader = useMemo(() => new THREE.TextureLoader(), [])

  // Keep track of currently active textures (for this object)
  const currentTexturesRef = useRef({
    diffuse: null,
    normal: null,
    roughness: null,
    ao: null,
  })

  // Ensure uv2 exists for AO (only needs to run once per mesh)
  useEffect(() => {
    if (!gltf || !gltf.scene) return

    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return
      const geom = child.geometry
      if (!geom.attributes.uv2 && geom.attributes.uv) {
        geom.setAttribute(
          'uv2',
          new THREE.BufferAttribute(geom.attributes.uv.array, 2)
        )
      }
    })
  }, [gltf])

  // Load new textures whenever LOD level changes
  useEffect(() => {
    if (!gltf || !gltf.scene) return
    if (!diffuseFolder) return

    let cancelled = false

    const lodName = `LOD_${String(level).padStart(2, '0')}.jpg`
    const urls = {
      diffuse: `${diffuseFolder}/${lodName}`,
      normal: `${normalFolder}/${lodName}`,
      roughness: `${roughnessFolder}/${lodName}`,
      ao: `${aoFolder}/${lodName}`,
    }

    const nextTextures = {
      diffuse: null,
      normal: null,
      roughness: null,
      ao: null,
    }

    let remaining = Object.keys(urls).length

    const finishIfReady = () => {
      remaining -= 1
      if (remaining > 0) return

      if (cancelled) {
        // We loaded these but component is gone, so just dispose them
        Object.values(nextTextures).forEach((t) => t && t.dispose())
        return
      }

      // Apply new textures to materials
      gltf.scene.traverse((child) => {
        if (!child.isMesh || !child.material) return
        const mat = child.material

        mat.map = nextTextures.diffuse || null
        mat.normalMap = nextTextures.normal || null
        mat.roughnessMap = nextTextures.roughness || null
        mat.aoMap = nextTextures.ao || null

        mat.color = new THREE.Color(0xffffff)
        mat.roughness = 1
        mat.metalness = 0
        mat.needsUpdate = true
      })

      // Dispose old textures now that materials point at the new ones
      const old = currentTexturesRef.current
      if (old) {
        Object.values(old).forEach((t) => t && t.dispose())
      }

      currentTexturesRef.current = nextTextures
    }

    const onTextureLoaded = (key, texture) => {
      if (cancelled) {
        texture.dispose()
        return
      }

      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.anisotropy = 8

      if (key === 'diffuse') {
        // sRGB for color
        if ('colorSpace' in texture) {
          texture.colorSpace = THREE.SRGBColorSpace
        } else {
          texture.encoding = THREE.sRGBEncoding
        }
      } else {
        // Linear for data maps
        if ('colorSpace' in texture) {
          texture.colorSpace = THREE.LinearSRGBColorSpace
        } else {
          texture.encoding = THREE.LinearEncoding
        }
      }

      nextTextures[key] = texture
      finishIfReady()
    }

    // Trigger loads for this LOD
    Object.entries(urls).forEach(([key, url]) => {
      loader.load(
        url,
        (tex) => onTextureLoaded(key, tex),
        undefined,
        (err) => {
          console.warn(`Error loading ${key} texture for LOD ${level}:`, url, err)
          // Even if this one failed, we still want to complete the batch
          finishIfReady()
        }
      )
    })

    return () => {
      cancelled = true
    }
  }, [
    gltf,
    loader,
    level,
    diffuseFolder,
    normalFolder,
    roughnessFolder,
    aoFolder,
  ])

  // Dispose whatever textures are left when this object unmounts
  useEffect(() => {
    return () => {
      const { diffuse, normal, roughness, ao } = currentTexturesRef.current
      if (diffuse) diffuse.dispose()
      if (normal) normal.dispose()
      if (roughness) roughness.dispose()
      if (ao) ao.dispose()

      currentTexturesRef.current = {
        diffuse: null,
        normal: null,
        roughness: null,
        ao: null,
      }
    }
  }, [])

  // You can still position/scale the object if you add those props to LOD_OBJECTS
  return <primitive object={gltf.scene} />
}

export default function LODScene() {
  const { objects } = useLODContext()
  const models = Object.values(objects)

  return (
    <>
      {models.map((model) => (
        <LODTexturedMesh key={model.id} object={model} />
      ))}
    </>
  )
}
