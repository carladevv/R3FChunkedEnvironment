// src/VT/createVirtualTextureMaterial.js
import * as THREE from 'three';

export function createVirtualTextureMaterial(uniforms) {
  // Use high LOD atlas as "map" so USE_MAP is defined
  const material = new THREE.MeshStandardMaterial({
    map: uniforms.uAtlasLod2.value,
  });

  material.onBeforeCompile = (shader) => {
    // Attach our uniforms
    shader.uniforms.uAtlasLod0 = uniforms.uAtlasLod0;
    shader.uniforms.uAtlasLod1 = uniforms.uAtlasLod1;
    shader.uniforms.uAtlasLod2 = uniforms.uAtlasLod2;
    shader.uniforms.uTilesPerAxis = uniforms.uTilesPerAxis;
    shader.uniforms.uLod1Distance = uniforms.uLod1Distance;
    shader.uniforms.uLod2Distance = uniforms.uLod2Distance;

    // Make sure USE_MAP is defined
    if (!material.defines) material.defines = {};
    material.defines.USE_MAP = '';

    // 1) Inject helpers
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_pars_fragment>',
      `
      #include <map_pars_fragment>

      uniform sampler2D uAtlasLod0;
      uniform sampler2D uAtlasLod1;
      uniform sampler2D uAtlasLod2;
      uniform float uTilesPerAxis;
      uniform float uLod1Distance;
      uniform float uLod2Distance;

      vec2 vtAtlasUv(vec2 uv) {
        vec2 tiledUv = uv * uTilesPerAxis;
        vec2 page = floor(tiledUv);
        vec2 localUv = fract(tiledUv);
        return (page + localUv) / uTilesPerAxis;
      }

      vec4 vtSampleAtlas(sampler2D tex, vec2 uv) {
        // If WebGL2 complains about texture2D, change to 'texture'
        return texture2D(tex, vtAtlasUv(uv));
      }

      vec4 vtSampleVirtualTexture(vec2 uv, float viewDist) {
        if (viewDist > uLod1Distance) {
          return vtSampleAtlas(uAtlasLod0, uv); // far
        } else if (viewDist > uLod2Distance) {
          return vtSampleAtlas(uAtlasLod1, uv); // mid
        } else {
          return vtSampleAtlas(uAtlasLod2, uv); // near
        }
      }
      `
    );

    // 2) Replace map sampling
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #ifdef USE_MAP
        float viewDist = length(vViewPosition);
        vec4 texelColor = vtSampleVirtualTexture(vMapUv, viewDist);
        // no mapTexelToLinear to avoid type issues
        diffuseColor *= texelColor;
      #endif
      `
    );

    material.userData.shader = shader;
  };

  material.needsUpdate = true;
  return material;
}
