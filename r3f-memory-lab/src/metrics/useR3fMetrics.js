import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

function fmtBytes(b) {
    if (b == null) return 'n/a'
    const u = ['B', 'KB', 'MB', 'GB']
    let i = 0; let x = b
    while (x >= 1024 && i < u.length - 1) { x /= 1024; i++ }
    return `${x.toFixed(1)} ${u[i]}`
}

function triCount(geom) {
    if (!geom) return 0
    if (geom.index) return geom.index.count / 3
    const pos = geom.attributes?.position
    if (!pos) return 0
    return pos.count / 3
}

// Frame over-budget tracker
function useFrameOverBudget(windowMs = 5000, budgetMs = 16.7) {
    const [pct, setPct] = useState(0)
    const [count, setCount] = useState(0)
    const lastRef = useRef(performance.now())
    const samplesRef = useRef([]) // [{t, dt, over}]

    useFrame(() => {
        const now = performance.now()
        const dt = now - lastRef.current
        lastRef.current = now
        const over = Math.max(0, dt - budgetMs)
        samplesRef.current.push({ t: now, dt, over })

        const cutoff = now - windowMs
        samplesRef.current = samplesRef.current.filter(s => s.t >= cutoff)

        const overSum = samplesRef.current.reduce((a, s) => a + s.over, 0)
        const framesOver = samplesRef.current.reduce((a, s) => a + (s.over > 0 ? 1 : 0), 0)

        setPct(Math.min(100, (overSum / windowMs) * 100))
        setCount(framesOver)
    })

    return { overPct: pct, framesOver: count, budgetMs }
}


/** Main-thread busy % over a sliding window using the Long Tasks API */
function useLongTaskLoad(windowMs = 5000) {
    const [busyPct, setBusyPct] = useState(0)
    const bufferRef = useRef([])

    useEffect(() => {
        if (!('PerformanceObserver' in window)) return
        const obs = new PerformanceObserver((list) => {
            const now = performance.now()
            for (const entry of list.getEntries()) {
                bufferRef.current.push({ t: now, d: entry.duration })
            }
            bufferRef.current = bufferRef.current.filter(e => now - e.t <= windowMs)
            const total = bufferRef.current.reduce((a, e) => a + e.d, 0)
            setBusyPct(Math.min(100, (total / windowMs) * 100))
        })
        try { obs.observe({ type: 'longtask', buffered: true }) } catch { }
        const id = setInterval(() => {
            const now = performance.now()
            bufferRef.current = bufferRef.current.filter(e => now - e.t <= windowMs)
            const total = bufferRef.current.reduce((a, e) => a + e.d, 0)
            setBusyPct(Math.min(100, (total / windowMs) * 100))
        }, 500)
        return () => { obs.disconnect?.(); clearInterval(id) }
    }, [windowMs])

    return busyPct
}

/** FPS avg/min/max over a sliding window (seconds) */
function useFps(windowSec = 5) {
    const [fps, setFps] = useState(0)
    const [min, setMin] = useState(Infinity)
    const [max, setMax] = useState(0)
    const lastRef = useRef(performance.now())
    const samplesRef = useRef([])

    useFrame(() => {
        const now = performance.now()
        const dt = now - lastRef.current
        lastRef.current = now
        const instFps = dt > 0 ? 1000 / dt : 0
        samplesRef.current.push({ t: now, fps: instFps })
        const cutoff = now - windowSec * 1000
        samplesRef.current = samplesRef.current.filter(s => s.t >= cutoff)
        const arr = samplesRef.current.map(s => s.fps)
        const avg = arr.reduce((a, x) => a + x, 0) / (arr.length || 1)
        setFps(avg)
        setMin(Math.min(...arr, Infinity))
        setMax(Math.max(...arr, 0))
    })
    return { fps, min, max }
}

/** WEBGL_debug_renderer_info helper */
function readRendererInfo(glCtx) {
    const info = { renderer: 'unknown', vendor: 'unknown' }
    if (!glCtx) return info
    const ext = glCtx.getExtension('WEBGL_debug_renderer_info')
    if (ext) {
        info.renderer = glCtx.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown'
        info.vendor = glCtx.getParameter(ext.UNMASKED_VENDOR_WEBGL) || 'unknown'
    }
    return info
}

/** Traverse scene for counts + per-mesh summary */
function gatherSceneStats(scene) {
    const out = {
        meshes: 0,
        instancedMeshes: 0,
        materials: 0,
        geometries: 0,
        triangles: 0,
        items: []
    }
    if (!scene) return out

    const mats = new Set()
    const geoms = new Set()

    scene.traverse((obj) => {
        if (obj.isInstancedMesh) out.instancedMeshes++
        if (obj.isMesh || obj.isPoints || obj.isLine) {
            out.meshes++
            const g = obj.geometry
            const m = obj.material
            if (g) geoms.add(g)
            if (m) {
                if (Array.isArray(m)) m.forEach(mm => mats.add(mm))
                else mats.add(m)
            }
            out.triangles += obj.isMesh ? triCount(g) : 0
            out.items.push({
                name: obj.name || '(unnamed)',
                type: obj.type,
                tris: obj.isMesh ? triCount(g) : 0,
                drawMode: obj.material?.wireframe ? 'wireframe' : 'triangles'
            })
        }
    })

    out.materials = mats.size
    out.geometries = geoms.size
    return out
}

/** GPU frame-time (ms) via EXT_disjoint_timer_query(_webgl2) */
function useGpuFrameTime(glRenderer) {
    const [ms, setMs] = useState(null)
    const [supported, setSupported] = useState(false)
    const qRef = useRef(null)
    const extRef = useRef(null)
    const ctxRef = useRef(null)
    const isWebGL2Ref = useRef(false)

    useEffect(() => {
        const ctx = glRenderer.getContext()
        ctxRef.current = ctx
        const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && ctx instanceof WebGL2RenderingContext
        isWebGL2Ref.current = isWebGL2
        const ext = isWebGL2
            ? ctx.getExtension('EXT_disjoint_timer_query_webgl2')
            : ctx.getExtension('EXT_disjoint_timer_query')
        extRef.current = ext || null
        setSupported(!!ext)
    }, [glRenderer])

    useFrame(() => {
        const ctx = ctxRef.current
        const ext = extRef.current
        if (!ctx || !ext) return

        const isWebGL2 = isWebGL2Ref.current

        // If previous query finished, read/publish it
        if (qRef.current) {
            // IMPORTANT: the enum comes from the extension in BOTH cases
            const disjoint = ctx.getParameter(ext.GPU_DISJOINT_EXT)

            const available = isWebGL2
                ? ctx.getQueryParameter(qRef.current, ctx.QUERY_RESULT_AVAILABLE)
                : ext.getQueryObjectEXT(qRef.current, ext.QUERY_RESULT_AVAILABLE_EXT)

            if (available && !disjoint) {
                const ns = isWebGL2
                    ? ctx.getQueryParameter(qRef.current, ctx.QUERY_RESULT)
                    : ext.getQueryObjectEXT(qRef.current, ext.QUERY_RESULT_EXT)

                setMs(ns / 1e6) // ns -> ms

                if (isWebGL2) ctx.deleteQuery(qRef.current)
                else ext.deleteQueryEXT(qRef.current)
                qRef.current = null
            }
        }

        // Start a new query for this frame if none pending
        if (!qRef.current) {
            if (isWebGL2) {
                const q = ctx.createQuery()
                ctx.beginQuery(ext.TIME_ELAPSED_EXT, q)
                queueMicrotask(() => ctx.endQuery(ext.TIME_ELAPSED_EXT))
                qRef.current = q
            } else {
                const q = ext.createQueryEXT()
                ext.beginQueryEXT(ext.TIME_ELAPSED_EXT, q)
                queueMicrotask(() => ext.endQueryEXT(ext.TIME_ELAPSED_EXT))
                qRef.current = q
            }
        }
    })

    return { gpuMs: ms, supported }
}


export function useR3fMetrics() {
    const { gl, scene } = useThree() // gl is THREE.WebGLRenderer
    const [rendererInfo, setRendererInfo] = useState({ renderer: 'unknown', vendor: 'unknown' })
    const [glInfo, setGlInfo] = useState({ render: {}, memory: {}, programs: 0 })
    const [heap, setHeap] = useState({ jsUsed: null, jsTotal: null })
    const [sceneStats, setSceneStats] = useState(gatherSceneStats(scene))
    const { fps, min, max } = useFps(5)
    const busyPct = useLongTaskLoad(5000)
    const { gpuMs, supported: gpuTimerSupported } = useGpuFrameTime(gl)
    const frameBudget = useFrameOverBudget(5000, 16.7)

    useEffect(() => {
        // static renderer info, once
        setRendererInfo(readRendererInfo(gl.getContext()))
    }, [gl])

    // sample GL + heap + scene periodically
    useEffect(() => {
        const id = setInterval(() => {
            const info = gl.info
            setGlInfo({
                render: {
                    calls: info.render.calls,
                    frame: info.render.frame,
                    triangles: info.render.triangles,
                    points: info.render.points,
                    lines: info.render.lines
                },
                memory: {
                    geometries: info.memory.geometries,
                    textures: info.memory.textures
                },
                programs: (info.programs || []).length
            })
            const pm = performance.memory
            setHeap({
                jsUsed: pm?.usedJSHeapSize ?? null,
                jsTotal: pm?.totalJSHeapSize ?? null
            })
            setSceneStats(gatherSceneStats(scene))
        }, 500)
        return () => clearInterval(id)
    }, [gl, scene])

    return useMemo(() => ({
        fps: { avg: fps, min, max },
        cpu: {
            mainThreadBusyPct: busyPct,             // long tasks >50 ms
            frameOverBudgetPct: frameBudget.overPct, // frames over 16.7 ms
            framesOverBudget: frameBudget.framesOver,
            frameBudgetMs: frameBudget.budgetMs
        }, heap: {
            usedBytes: heap.jsUsed,
            totalBytes: heap.jsTotal,
            usedHuman: fmtBytes(heap.jsUsed),
            totalHuman: fmtBytes(heap.jsTotal),
        },
        gl: {
            renderer: rendererInfo.renderer,
            vendor: rendererInfo.vendor,
            memory: glInfo.memory,
            render: glInfo.render,
            programs: glInfo.programs,
            gpuFrameMs: gpuMs,
            gpuTimerSupported
        },
        scene: sceneStats
    }), [fps, min, max, busyPct, heap, glInfo, rendererInfo, sceneStats, gpuMs, gpuTimerSupported])
}
