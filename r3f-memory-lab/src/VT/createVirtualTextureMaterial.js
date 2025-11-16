// src/VT/createVirtualTextureMaterial.js
import * as THREE from 'three';

export function createVirtualTextureMaterial(atlasTexture, tilesPerAxis) {
  const material = new THREE.MeshStandardMaterial({
    map: atlasTexture,
  });

  material.onBeforeCompile = (shader) => {
    // Add uniform for tile layout
    shader.uniforms.uTilesPerAxis = { value: tilesPerAxis };

    // 1) Inject our helper function right after map_pars_fragment include
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_pars_fragment>',
      `
      #include <map_pars_fragment>
      uniform float uTilesPerAxis;

      // Convert a regular 0..1 UV to atlas UV in a tilesPerAxis x tilesPerAxis grid
      vec2 vtAtlasUv(vec2 uv) {
        vec2 tiledUv = uv * uTilesPerAxis;   // [0..tilesPerAxis]
        vec2 page = floor(tiledUv);          // which tile (x,y)
        vec2 localUv = fract(tiledUv);       // uv inside tile [0..1]
        return (page + localUv) / uTilesPerAxis;
      }

      vec4 vtSampleMap(sampler2D tex, vec2 uv) {
        // NOTE: If your console says "texture2D not supported", change this to 'texture(tex, vtAtlasUv(uv))'
        return texture2D(tex, vtAtlasUv(uv));
      }
      `
    );

    // 2) Replace ONLY the map sampling line to use our helper
    // This line exists in the default MeshStandardMaterial fragment shader in WebGL1 mode:
    // vec4 texelColor = texture2D( map, vMapUv );
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 texelColor = texture2D( map, vMapUv );',
      'vec4 texelColor = vtSampleMap( map, vMapUv );'
    );

    // expose for debugging if you want to log it
    material.userData.shader = shader;
    // console.log(shader.fragmentShader);
  };

  material.needsUpdate = true;
  return material;
}
