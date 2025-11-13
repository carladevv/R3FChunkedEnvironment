// src/scene/LODScene.jsx
import React, { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useLODContext } from './LODContext'

const LOD_LEVELS = [0, 1, 2, 3]

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

  // ------- TEXTURE URL ARRAYS (fixed, not per-level) -------

  const diffuseUrls = useMemo(
    () =>
      LOD_LEVELS.map((lod) => {
        const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
        return `${diffuseFolder}/${lodName}`
      }),
    [diffuseFolder]
  )

  const normalUrls = useMemo(
    () =>
      LOD_LEVELS.map((lod) => {
        const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
        return `${normalFolder}/${lodName}`
      }),
    [normalFolder]
  )

  const roughnessUrls = useMemo(
    () =>
      LOD_LEVELS.map((lod) => {
        const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
        return `${roughnessFolder}/${lodName}`
      }),
    [roughnessFolder]
  )

  const aoUrls = useMemo(
    () =>
      LOD_LEVELS.map((lod) => {
        const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
        return `${aoFolder}/${lodName}`
      }),
    [aoFolder]
  )

  // ------- LOAD ALL TEXTURES ONCE (no reload on LOD change) -------

  const diffuseMaps = useLoader(THREE.TextureLoader, diffuseUrls)
  const normalMaps = useLoader(THREE.TextureLoader, normalUrls)
  const roughnessMaps = useLoader(THREE.TextureLoader, roughnessUrls)
  const aoMaps = useLoader(THREE.TextureLoader, aoUrls)

  // Configure diffuse textures (sRGB)
  useEffect(() => {
    diffuseMaps.forEach((tex) => {
      if (!tex) return
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = 8

      if ('colorSpace' in tex) {
        tex.colorSpace = THREE.SRGBColorSpace
      } else {
        tex.encoding = THREE.sRGBEncoding
      }
    })
  }, [diffuseMaps])

  // Configure normal / roughness / ao as linear
  useEffect(() => {
    const configureLinear = (tex) => {
      if (!tex) return
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = 8

      if ('colorSpace' in tex) {
        tex.colorSpace = THREE.LinearSRGBColorSpace
      } else {
        tex.encoding = THREE.LinearEncoding
      }
    }

    normalMaps.forEach(configureLinear)
    roughnessMaps.forEach(configureLinear)
    aoMaps.forEach(configureLinear)
  }, [normalMaps, roughnessMaps, aoMaps])

  // ------- Pick textures for the current LOD -------

  const diffuseMap = diffuseMaps[level] || diffuseMaps[0]
  const normalMap = normalMaps[level] || normalMaps[0] || null
  const roughnessMap = roughnessMaps[level] || roughnessMaps[0] || null
  const aoMap = aoMaps[level] || aoMaps[0] || null

  // ------- Apply textures to mesh materials whenever LOD changes -------

  useEffect(() => {
    if (!gltf || !gltf.scene) return

    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.material) return

      const mat = child.material

      // Assign maps
      if (diffuseMap) mat.map = diffuseMap
      if (normalMap) mat.normalMap = normalMap
      if (roughnessMap) mat.roughnessMap = roughnessMap
      if (aoMap) mat.aoMap = aoMap

      mat.color = new THREE.Color(0xffffff)
      mat.roughness = 1
      mat.metalness = 0

      // Ensure UV2 exists for AO
      if (aoMap && child.geometry) {
        const geom = child.geometry
        if (!geom.attributes.uv2 && geom.attributes.uv) {
          geom.setAttribute(
            'uv2',
            new THREE.BufferAttribute(geom.attributes.uv.array, 2)
          )
        }
      }

      mat.needsUpdate = true
    })
  }, [gltf, diffuseMap, normalMap, roughnessMap, aoMap])

  // You can position/rotate/scale this object here if you want per-object transforms
  return <primitive object={gltf.scene} />
}

// Optional: if you like preloading
// useGLTF.preload('models/environment/Ground68_00.glb')

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
