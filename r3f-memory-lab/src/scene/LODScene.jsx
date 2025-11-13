// src/scene/LODScene.jsx
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useLODContext } from './LODContext'

const LOD_LEVELS = [0, 1, 2, 3]

function TextureLODPlane({ object }) {
  const {
    diffuseFolder,
    normalFolder,
    roughnessFolder,
    aoFolder,
    level,
  } = object

  const meshRef = useRef()

  // URLs for ALL diffuse LODs
  const diffuseUrls = useMemo(() => {
    return LOD_LEVELS.map((lod) => {
      const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
      return `${diffuseFolder}/${lodName}`
    })
  }, [diffuseFolder])

  // URLs for ALL normal LODs
  const normalUrls = useMemo(() => {
    return LOD_LEVELS.map((lod) => {
      const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
      return `${normalFolder}/${lodName}`
    })
  }, [normalFolder])

  // URLs for ALL roughness LODs
  const roughnessUrls = useMemo(() => {
    return LOD_LEVELS.map((lod) => {
      const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
      return `${roughnessFolder}/${lodName}`
    })
  }, [roughnessFolder])

  // URLs for ALL AO LODs
  const aoUrls = useMemo(() => {
    return LOD_LEVELS.map((lod) => {
      const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
      return `${aoFolder}/${lodName}`
    })
  }, [aoFolder])

  // Load ALL textures once (per object)
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

  // Configure normal textures (linear)
  useEffect(() => {
    normalMaps.forEach((tex) => {
      if (!tex) return
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = 8

      if ('colorSpace' in tex) {
        tex.colorSpace = THREE.LinearSRGBColorSpace
      } else {
        tex.encoding = THREE.LinearEncoding
      }
    })
  }, [normalMaps])

  // Configure roughness textures (linear)
  useEffect(() => {
    roughnessMaps.forEach((tex) => {
      if (!tex) return
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = 8

      if ('colorSpace' in tex) {
        tex.colorSpace = THREE.LinearSRGBColorSpace
      } else {
        tex.encoding = THREE.LinearEncoding
      }
    })
  }, [roughnessMaps])

  // Configure AO textures (linear)
  useEffect(() => {
    aoMaps.forEach((tex) => {
      if (!tex) return
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = 8

      if ('colorSpace' in tex) {
        tex.colorSpace = THREE.LinearSRGBColorSpace
      } else {
        tex.encoding = THREE.LinearEncoding
      }
    })
  }, [aoMaps])

  // Ensure uv2 exists for aoMap (Three uses uv2)
  useEffect(() => {
    if (!meshRef.current) return
    const geom = meshRef.current.geometry
    if (!geom) return

    if (!geom.attributes.uv2 && geom.attributes.uv) {
      geom.setAttribute(
        'uv2',
        new THREE.BufferAttribute(geom.attributes.uv.array, 2)
      )
    }
  }, [])

  // Pick textures for current LOD; fall back to LOD 0 if needed
  const diffuseMap = diffuseMaps[level] || diffuseMaps[0]
  const normalMap = normalMaps[level] || normalMaps[0] || null
  const roughnessMap = roughnessMaps[level] || roughnessMaps[0] || null
  const aoMap = aoMaps[level] || aoMaps[0] || null

  return (
    <mesh
      ref={meshRef}
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial
        map={diffuseMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        aoMap={aoMap}
        normalScale={new THREE.Vector2(1, 1)}
        color="#ffffff"
        roughness={1}  // modulated by roughnessMap
        metalness={0}
        side={THREE.FrontSide}
      />
    </mesh>
  )
}

export default function LODScene() {
  const { objects } = useLODContext()
  const models = Object.values(objects)

  return (
    <>
      {models.map((model) => (
        <TextureLODPlane key={model.id} object={model} />
      ))}
    </>
  )
}
