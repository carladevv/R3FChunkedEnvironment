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

        // File extension of the texture
        diffuseExtension: '.jpg',

        // LOD names in your folders
        // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
        lodNames: {
            low: 'LOD_00',    // tiny (64)
            mid: 'LOD_01',    // 512
            high: 'LOD_02',   // 1024
        },

        // Distances in *view space* for switching LODs (you can tweak)
        lodDistances: {
            midStart: 40.0,   // > 40 → use low
            highStart: 10.0,  // < 10 → use high
        },
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

        // File extension of the texture
        diffuseExtension: '.jpg',

        // LOD names in your folders
        // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
        lodNames: {
            low: 'LOD_00',    // tiny (64)
            mid: 'LOD_01',    // 512
            high: 'LOD_02',   // 1024
        },

        // Distances in *view space* for switching LODs (you can tweak)
        lodDistances: {
            midStart: 40.0,   // > 40 → use low
            highStart: 10.0,  // < 10 → use high
        },
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

        // File extension of the texture
        diffuseExtension: '.jpg',

        // LOD names in your folders
        // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
        lodNames: {
            low: 'LOD_00',    // tiny (64)
            mid: 'LOD_01',    // 512
            high: 'LOD_02',   // 1024
        },

        // Distances in *view space* for switching LODs (you can tweak)
        lodDistances: {
            midStart: 40.0,   // > 40 → use low
            highStart: 10.0,  // < 10 → use high
        },
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

        // File extension of the texture
        diffuseExtension: '.jpg',

        // LOD names in your folders
        // e.g. models/Ground68/Ground68_01/Diffuse/LOD_02.jpg
        lodNames: {
            low: 'LOD_00',    // tiny (64)
            mid: 'LOD_01',    // 512
            high: 'LOD_02',   // 1024
        },

        // Distances in *view space* for switching LODs (you can tweak)
        lodDistances: {
            midStart: 40.0,   // > 40 → use low
            highStart: 10.0,  // < 10 → use high
        },
    },
];
