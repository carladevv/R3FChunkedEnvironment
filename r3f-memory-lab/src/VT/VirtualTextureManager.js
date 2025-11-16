// src/VT/VirtualTextureManager.js

import * as THREE from 'three';

export class VirtualTextureManager {
  constructor(envConfig) {
    this.env = envConfig;
    this.loader = new THREE.TextureLoader();

    this.atlasTexture = null;   // THREE.CanvasTexture
    this.tileSize = null;       // inferred from first loaded tile
    this.atlasSize = null;      // tileSize * tilesPerAxis
  }

  async init() {
    // 1) Load all tile textures (diffuse, for now)
    const tileTextures = await this._loadAllDiffuseTiles();

    if (!tileTextures.length) {
      throw new Error(`No tiles loaded for VT environment ${this.env.name}`);
    }

    // 2) Infer tile size from first tile
    const firstImage = tileTextures[0].image;
    const tileWidth = firstImage.width;
    const tileHeight = firstImage.height;

    if (tileWidth !== tileHeight) {
      console.warn(
        `[VT] Tiles for ${this.env.name} are not square: ` +
          `${tileWidth}x${tileHeight}. This is supported, but unexpected.`
      );
    }

    this.tileSize = tileWidth;
    this.atlasSize = this.tileSize * this.env.tilesPerAxis;

    // 3) Build atlas with a canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.atlasSize;
    canvas.height = this.atlasSize;
    const ctx = canvas.getContext('2d');

    // We assume tile indexing matches your Blender script:
    // 01..04 = top row, left to right
    // 05..08 = second row, ...
    // We'll place them row-major in the canvas accordingly.
    tileTextures.forEach((tex, i) => {
      const img = tex.image;
      const col = i % this.env.tilesPerAxis;             // x tile index
      const row = Math.floor(i / this.env.tilesPerAxis); // y tile index (top to bottom)

      const x = col * this.tileSize;
      const y = row * this.tileSize;

      ctx.drawImage(img, x, y, this.tileSize, this.tileSize);
    });

    // 4) Create CanvasTexture from atlas
    const atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.flipY = false;
    atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
    atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
    atlasTexture.minFilter = THREE.LinearMipMapLinearFilter;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.generateMipmaps = true;
    atlasTexture.needsUpdate = true;

    // Dispose individual tile textures (we don't need them anymore)
    tileTextures.forEach((t) => t.dispose());

    this.atlasTexture = atlasTexture;
  }

  async _loadAllDiffuseTiles() {
    const {
      name,
      tileBasePath,
      tileCount,
      diffuseFolderName,
      diffuseLodName,
      diffuseExtension,
    } = this.env;

    const promises = [];

    for (let i = 0; i < tileCount; i++) {
      const index = String(i + 1).padStart(2, '0'); // 01..16
      const tileId = `${name}_${index}`;

      const url = `${tileBasePath}/${tileId}/${diffuseFolderName}/${diffuseLodName}${diffuseExtension}`;

      promises.push(
        new Promise((resolve, reject) => {
          this.loader.load(
            url,
            (texture) => {
              texture.flipY = false;
              resolve(texture);
            },
            undefined,
            (err) => {
              console.warn(`[VT] Failed to load tile ${tileId}:`, url, err);
              reject(err);
            }
          );
        })
      );
    }

    // We want all tiles to load; if one fails, we still continue with others
    const results = await Promise.allSettled(promises);

    const textures = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value);

    if (textures.length !== tileCount) {
      console.warn(
        `[VT] Only loaded ${textures.length}/${tileCount} tiles for ${name}`
      );
    }

    return textures;
  }
}
