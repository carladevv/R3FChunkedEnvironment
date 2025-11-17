// src/VT/VirtualTextureManager.js

import * as THREE from 'three';

export class VirtualTextureManager {
  constructor(envConfig) {
    this.env = envConfig;
    this.loader = new THREE.TextureLoader();

    this.tilesPerAxis = envConfig.tilesPerAxis;
    this.tileCount = envConfig.tileCount;

    this.atlasLow = null;   // LOD_00 atlas
    this.atlasMid = null;   // LOD_01 atlas
    this.atlasHigh = null;  // LOD_02 atlas

    this.tileSizes = {
      low: null,
      mid: null,
      high: null,
    };
  }

  async init() {
    const { lodNames } = this.env;

    // 1) Load tiles for each LOD (in parallel)
    const [lowTiles, midTiles, highTiles] = await Promise.all([
      this._loadTilesForLod(lodNames.low),
      this._loadTilesForLod(lodNames.mid),
      this._loadTilesForLod(lodNames.high),
    ]);

    if (!lowTiles.length) {
      throw new Error(`[VT] No tiles for low LOD (${lodNames.low}) in ${this.env.name}`);
    }
    if (!midTiles.length) {
      console.warn(`[VT] No tiles for mid LOD (${lodNames.mid}) in ${this.env.name}`);
    }
    if (!highTiles.length) {
      console.warn(`[VT] No tiles for high LOD (${lodNames.high}) in ${this.env.name}`);
    }

    // 2) Build atlases
    this.atlasLow = this._buildAtlasFromTiles(lowTiles, 'low');
    this.atlasMid = midTiles.length ? this._buildAtlasFromTiles(midTiles, 'mid') : null;
    this.atlasHigh = highTiles.length ? this._buildAtlasFromTiles(highTiles, 'high') : null;

    // Dispose individual tiles; we only keep the atlases
    lowTiles.forEach((t) => t.dispose());
    midTiles.forEach((t) => t.dispose());
    highTiles.forEach((t) => t.dispose());
  }

  async _loadTilesForLod(lodName) {
    const {
      name,
      tileBasePath,
      tileCount,
      diffuseFolderName,
      diffuseExtension,
    } = this.env;

    const promises = [];

    for (let i = 0; i < tileCount; i++) {
      const index = String(i + 1).padStart(2, '0'); // 01..16
      const tileId = `${name}_${index}`;
      const url = `${tileBasePath}/${tileId}/${diffuseFolderName}/${lodName}${diffuseExtension}`;

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
              console.warn(`[VT] Failed to load tile ${tileId} (${lodName}):`, url, err);
              resolve(null); // continue even if some fail
            }
          );
        })
      );
    }

    const results = await Promise.all(promises);

    return results.filter((t) => t);
  }

  _buildAtlasFromTiles(tileTextures, lodKey) {
    if (!tileTextures.length) return null;

    const first = tileTextures[0].image;
    const tileWidth = first.width;
    const tileHeight = first.height;

    if (tileWidth !== tileHeight) {
      console.warn(
        `[VT] Tiles for ${this.env.name} (${lodKey}) are not square: ${tileWidth}x${tileHeight}`
      );
    }

    this.tileSizes[lodKey] = tileWidth;

    const atlasSize = tileWidth * this.tilesPerAxis;
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;
    const ctx = canvas.getContext('2d');

    // row-major: 0..3 = top row, 4..7 = second row, etc.
    tileTextures.forEach((tex, i) => {
      const img = tex.image;
      const col = i % this.tilesPerAxis;
      const row = Math.floor(i / this.tilesPerAxis);
      const x = col * tileWidth;
      const y = row * tileWidth;
      ctx.drawImage(img, x, y, tileWidth, tileWidth);
    });

    const atlasTexture = new THREE.CanvasTexture(canvas);
    atlasTexture.flipY = false;
    atlasTexture.wrapS = THREE.ClampToEdgeWrapping;
    atlasTexture.wrapT = THREE.ClampToEdgeWrapping;
    atlasTexture.minFilter = THREE.LinearMipMapLinearFilter;
    atlasTexture.magFilter = THREE.LinearFilter;
    atlasTexture.generateMipmaps = true;
    atlasTexture.needsUpdate = true;

    return atlasTexture;
  }

  getUniforms() {
    const { lodDistances } = this.env;

    // Fallbacks: if mid/high are missing, fall back to low
    const atlasLow = this.atlasLow;
    const atlasMid = this.atlasMid || this.atlasLow;
    const atlasHigh = this.atlasHigh || atlasMid;

    return {
      uAtlasLod0: { value: atlasLow },
      uAtlasLod1: { value: atlasMid },
      uAtlasLod2: { value: atlasHigh },
      uTilesPerAxis: { value: this.tilesPerAxis },
      uLod1Distance: { value: lodDistances.midStart },
      uLod2Distance: { value: lodDistances.highStart },
    };
  }

  dispose() {
    if (this.atlasLow) this.atlasLow.dispose();
    if (this.atlasMid && this.atlasMid !== this.atlasLow) this.atlasMid.dispose();
    if (this.atlasHigh && this.atlasHigh !== this.atlasMid) this.atlasHigh.dispose();
  }
}
