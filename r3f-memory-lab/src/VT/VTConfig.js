// src/VT/VTConfig.js

export const VT_ENVIRONMENTS = [
  {
    name: 'Ground68',
    meshPath: 'models/Ground68/Ground68_mesh.glb',

    // We pre-split the 4K texture into 4x4 tiles -> 16 tiles total
    tilesPerAxis: 4,
    tileCount: 16,

    // Folder where Ground68_01, Ground68_02, ... live
    tileBasePath: 'models/Ground68',

    // Subfolder for the diffuse LOD textures inside each tile folder
    // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
    diffuseFolderName: 'Diffuse',

    // Which LOD level we want to use for this prototype
    diffuseLodName: 'LOD_02',

    // File extension of the texture
    diffuseExtension: '.jpg',
  },
  {
    name: 'Ground48',
    meshPath: 'models/Ground48/Ground48_mesh.glb',

    // We pre-split the 4K texture into 4x4 tiles -> 16 tiles total
    tilesPerAxis: 4,
    tileCount: 16,

    // Folder where Ground68_01, Ground68_02, ... live
    tileBasePath: 'models/Ground48',

    // Subfolder for the diffuse LOD textures inside each tile folder
    // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
    diffuseFolderName: 'Diffuse',

    // Which LOD level we want to use for this prototype
    diffuseLodName: 'LOD_02',

    // File extension of the texture
    diffuseExtension: '.jpg',
  },
  {
    name: 'Ground93',
    meshPath: 'models/Ground93/Ground93_mesh.glb',

    // We pre-split the 4K texture into 4x4 tiles -> 16 tiles total
    tilesPerAxis: 4,
    tileCount: 16,

    // Folder where Ground68_01, Ground68_02, ... live
    tileBasePath: 'models/Ground93',

    // Subfolder for the diffuse LOD textures inside each tile folder
    // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
    diffuseFolderName: 'Diffuse',

    // Which LOD level we want to use for this prototype
    diffuseLodName: 'LOD_02',

    // File extension of the texture
    diffuseExtension: '.jpg',
  },
  {
    name: 'Rock58',
    meshPath: 'models/Rock58/Rock58_mesh.glb',

    // We pre-split the 4K texture into 4x4 tiles -> 16 tiles total
    tilesPerAxis: 4,
    tileCount: 16,

    // Folder where Ground68_01, Ground68_02, ... live
    tileBasePath: 'models/Rock58',

    // Subfolder for the diffuse LOD textures inside each tile folder
    // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
    diffuseFolderName: 'Diffuse',

    // Which LOD level we want to use for this prototype
    diffuseLodName: 'LOD_02',

    // File extension of the texture
    diffuseExtension: '.jpg',
  },
];
