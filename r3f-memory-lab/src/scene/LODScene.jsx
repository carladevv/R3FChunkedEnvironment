// src/scene/LODScene.jsx
import React, { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useLODContext } from './LODContext'

function LODTexturedMesh({ object }) {
  const {
    id,
    meshFolder,
    diffuseFolder,
    normalFolder,
    roughnessFolder,
    aoFolder,
    level,
  } = object

  const { camera } = useThree()
  const { mode, setLevel } = useLODContext()

  const gltf = useGLTF(meshFolder)
  const loader = useMemo(() => new THREE.TextureLoader(), [])

  function loadTileTexture(url, onLoad, onProgress, onError) {
    return loader.load(
      url,
      (texture) => {
        texture.flipY = false;    // <--- fix vertical flip here
        texture.needsUpdate = true;
        onLoad && onLoad(texture);
      },
      onProgress,
      (err) => {
        console.warn('Error loading texture:', url, err);
        onError && onError(err);
      }
    );
  }


  const currentTexturesRef = useRef({
    diffuse: null,
    normal: null,
    roughness: null,
    ao: null,
  })

  const cubeBoxRef = useRef(null)
  const boxHelperRef = useRef(null)

  // 1) Build bounding box -> cube -> helper; also ensure uv2 exists
  useEffect(() => {
    if (!gltf || !gltf.scene) return

    // Compute tight bounding box from the object
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const center = new THREE.Vector3()
    const size = new THREE.Vector3()
    box.getCenter(center)
    box.getSize(size)

    const maxSide = Math.max(size.x, size.y, size.z) || 1e-6
    const half = maxSide / 2

    const cubeBox = new THREE.Box3(
      new THREE.Vector3(center.x - half, center.y - half, center.z - half),
      new THREE.Vector3(center.x + half, center.y + half, center.z + half)
    )
    cubeBoxRef.current = cubeBox

    // Visible wireframe helper for the cube
    const helper = new THREE.Box3Helper(cubeBox, new THREE.Color(0x00ff00))
    boxHelperRef.current = helper
    gltf.scene.add(helper)

    // Ensure uv2 exists for AO
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

    return () => {
      if (boxHelperRef.current) {
        gltf.scene.remove(boxHelperRef.current)
        boxHelperRef.current.geometry?.dispose()
        boxHelperRef.current.material?.dispose()
        boxHelperRef.current = null
      }
    }
  }, [gltf])

  // 2) Load & swap textures when LOD level changes (with disposal)
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
        Object.values(nextTextures).forEach((t) => t && t.dispose())
        return
      }

      // Apply new textures
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

      // Dispose old textures
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
        if ('colorSpace' in texture) {
          texture.colorSpace = THREE.SRGBColorSpace
        } else {
          texture.encoding = THREE.sRGBEncoding
        }
      } else {
        if ('colorSpace' in texture) {
          texture.colorSpace = THREE.LinearSRGBColorSpace
        } else {
          texture.encoding = THREE.LinearEncoding
        }
      }

      nextTextures[key] = texture
      finishIfReady()
    }

    Object.entries(urls).forEach(([key, url]) => {
      loadTileTexture(
        url,
        (tex) => onTextureLoaded(key, tex),
        undefined,
        (err) => {
          console.warn(`Error loading ${key} texture for LOD ${level}:`, url, err)
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

  // 3) Dispose textures when this object unmounts
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

  // 4) Auto LOD based on camera distance to bounding cube
  useFrame(() => {
    if (mode !== 'auto') return
    const cube = cubeBoxRef.current
    if (!cube) return

    const p = camera.position
    const min = cube.min
    const max = cube.max

    // Distance from point to axis-aligned box
    const dx =
      p.x < min.x ? min.x - p.x : p.x > max.x ? p.x - max.x : 0
    const dy =
      p.y < min.y ? min.y - p.y : p.y > max.y ? p.y - max.y : 0
    const dz =
      p.z < min.z ? min.z - p.z : p.z > max.z ? p.z - max.z : 0

    const inside = dx === 0 && dy === 0 && dz === 0
    const dist = inside ? 0 : Math.sqrt(dx * dx + dy * dy + dz * dz)

    let targetLevel
    if (inside) {
      targetLevel = 2
    } else if (dist < 20) {
      targetLevel = 1
    } else {
      targetLevel = 0
    }

    if (targetLevel !== level) {
      setLevel(id, targetLevel)
    }
  })

  // You can add per-object transforms if you store them in LOD_OBJECTS
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
