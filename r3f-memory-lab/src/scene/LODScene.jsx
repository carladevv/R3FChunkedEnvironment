// src/scene/LODScene.jsx
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { useLODContext } from './LODContext'

const LOD_LEVELS = [0, 1, 2, 3]

function TextureLODPlane({ object }) {
  const { diffuseFolder, level } = object
  const meshRef = useRef()

  // Build URLs for ALL LODs once
  const urls = useMemo(() => {
    return LOD_LEVELS.map((lod) => {
      const lodName = `LOD_${String(lod).padStart(2, '0')}.jpg`
      return `${diffuseFolder}/${lodName}`
    })
  }, [diffuseFolder])

  // Load ALL textures in one go; returns an array of textures
  const textures = useLoader(THREE.TextureLoader, urls)

  // Configure textures once they’re loaded
  useEffect(() => {
    textures.forEach((tex) => {
      if (!tex) return
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping
      tex.anisotropy = 8

      // Support both newer and older three.js versions
      if ('colorSpace' in tex) {
        tex.colorSpace = THREE.SRGBColorSpace
      } else {
        tex.encoding = THREE.sRGBEncoding
      }
    })
  }, [textures])

  // Optional: sanity-check UVs
  useEffect(() => {
    if (!meshRef.current) return
    const geom = meshRef.current.geometry
    if (!geom) return

    if (!geom.attributes.uv) {
      console.warn('Plane has no UVs – texture will not show correctly')
    }
  }, [])

  // Pick the texture for the current LOD; fallback to level 0 if anything is weird
  const diffuseMap = textures[level] || textures[0]

  return (
    <mesh
      ref={meshRef}
      rotation-x={-Math.PI / 2}
      position={[0, 0, 0]}
    >
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial
        map={diffuseMap}
        color="#ffffff"
        roughness={1}
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
