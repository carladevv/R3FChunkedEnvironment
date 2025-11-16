// src/VT/VirtualTexturedEnvironment.jsx

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';

import { VT_ENVIRONMENTS } from './VTConfig';
import { VirtualTextureManager } from './VirtualTextureManager';
import { createVirtualTextureMaterial } from './createVirtualTextureMaterial';

export function VirtualTexturedEnvironment({ envName, visible = true }) {
  const envConfig = useMemo(
    () => VT_ENVIRONMENTS.find((e) => e.name === envName),
    [envName]
  );

  const gltf = useLoader(
    GLTFLoader,
    envConfig ? envConfig.meshPath : null
  );

  const [material, setMaterial] = useState(null);
  const managerRef = useRef(null);

  // Init VT manager + material when envConfig changes
  useEffect(() => {
    if (!envConfig) return;

    let cancelled = false;
    const manager = new VirtualTextureManager(envConfig);
    managerRef.current = manager;

    (async () => {
      await manager.init();
      if (cancelled) return;

      const vtMaterial = createVirtualTextureMaterial(
        manager.atlasTexture,
        envConfig.tilesPerAxis
      );

      setMaterial(vtMaterial);
    })();

    return () => {
      cancelled = true;

      if (managerRef.current?.atlasTexture) {
        managerRef.current.atlasTexture.dispose();
      }
      managerRef.current = null;

      if (material) {
        material.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envConfig?.name]);

  // Once we have material and gltf, apply material to all meshes
  useEffect(() => {
    if (!material || !gltf) return;

    gltf.scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = material;
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [gltf, material]);

  if (!visible || !envConfig) return null;
  if (!material) return null; // still loading VT

  return <primitive object={gltf.scene} />;
}
