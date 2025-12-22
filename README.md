# **Large-Scale Virtual Environment with LOD Streaming**

A React + Three.js web application built with Vite, React Three Fiber, and custom LOD (Level-of-Detail) streaming logic that enables interactive exploration of massive textured 3D environments — such as architectural ruins or terrain meshes — while maintaining real-time performance through intelligent resource management.

Users can navigate a scene composed of dozens of individually textured chunks, each supporting multiple resolution levels (LOD 00–02), with manual or automatic switching based on camera distance. The app includes comprehensive performance metrics, memory cleanup utilities, and a debug HUD for monitoring geometry, texture, and GPU usage in real time.

---

## **🖼️ What It Does**
- **Chunked environment loading:** Splits large models (e.g. Saint-Pierre d’Aleth Cathedral) into 57+ individually addressable tiles
- **Multi-resolution LOD system:** Each tile includes 3 baked texture LODs (64px, 512px, 1024px) for dynamic detail scaling
- **Auto/manual LOD switching:** Toggle between distance-based automatic LOD or manual per-tile control via UI
- **Memory-aware resource handling:** Full disposal of geometries, materials, and textures when switching or cleaning up
- **Real-time performance HUD:** Tracks FPS, draw calls, triangle count, GPU frame time, JS heap, and WebGL memory
- **Blender-to-web pipeline:** End-to-end workflow from high-res model → chunking → UVs → baking → LOD export
- **Extensible tile-based architecture:** Supports multiple environments (Ground48, Rock58, etc.) with consistent folder structure

<img width="1913" height="953" alt="Large-Scale Virtual Environment Test" src="https://github.com/user-attachments/assets/c5ce65ed-d860-413a-a508-7cf25dc77736" />

## **📂 Repository Structure**
```bash
environment_model_prep_scripts/     # Blender Python scripts for chunking, UVs, baking, and LOD export
├── 01_mesh_into_chunks.py          # Splits mesh based on texture density & world bounds
├── 02_uv_unwrap_chunks.py          # Applies Smart UV per chunk + global texel density normalization
├── 03_bake_textures_to_chunks.py   # Bakes diffuse to 1K per chunk using Cycles
└── 04_export_chunks_and_texture_lods.py  # Exports GLB + 3 LOD JPEGs per tile

r3f-memory-lab/                     # Main React + R3F application
├── public/models/                  # Organized tile folders (e.g. SaintPierredAlethCathedral_01/)
│   └── {env}_XX/
│       ├── {env}_XX.glb            # Geometry-only chunk
│       └── Diffuse/                # LOD_00.jpg, LOD_01.jpg, LOD_02.jpg
│
└── src/
    ├── App.jsx                     # Root scene with Canvas, OrbitControls, and HUD
    ├── chunks/                     # GcModel + LODModel components
    ├── scene/                      # LODContext, LODScene, and SceneJanitor for cleanup
    └── metrics/                    # Performance collector, HUD panel, and useR3fMetrics hook

```

## **🛠️ Tech Stack**
- **Framework:** React 19 (with Concurrent Rendering)
- **3D Engine:** Three.js r181 via @react-three/fiber and @react-three/drei
- **State Management:** Custom context + React state (no external store)
- **Build Tool:** Vite 7
- **Memory & Performance:** Custom disposal logic, renderer.info monitoring, Long Tasks API, GPU timer queries
- **Asset Pipeline:** Blender 4.x scripting (bmesh, Cycles baking, GLTF export)
- **Utilities:** useGLTF, TextureLoader, manual WebGL memory management

## **▶️ Local Development**
```bash
npm install
npm run dev
```
> **Note:** This project assumes you’ve already generated tile assets using the Blender scripts in `environment_model_prep_scripts/`. The public models folder must contain structured tile directories matching the config in `LODContext.jsx`.

## **🔍 Debug Features**
- Press **Cycle** or click **LOD 0–3** buttons to manually override detail level
- Toggle **Auto/Manual** mode to test distance-based switching logic
- Open browser DevTools → Console to see disposal logs
- Use **Metrics HUD** (right panel) to monitor WebGL memory (geometries, textures) and detect leaks
