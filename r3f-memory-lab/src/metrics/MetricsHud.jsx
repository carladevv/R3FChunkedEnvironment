import { useState, useMemo } from 'react'
import { Html } from '@react-three/drei'
import { useR3fMetrics } from './useR3fMetrics'
import './panel.css'

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="sec">
      <button className="secHeader" onClick={() => setOpen(o => !o)}>
        <span>{open ? '▾' : '▸'}</span> {title}
      </button>
      {open && <div className="secBody">{children}</div>}
    </div>
  )
}

export default function MetricsHud() {
  const m = useR3fMetrics()

  const csvHref = useMemo(() => {
    // gather metrics into an object
    const data = {
      timestamp: new Date().toISOString(),
      fps_avg: m.fps.avg.toFixed(1),
      fps_min: m.fps.min.toFixed(1),
      fps_max: m.fps.max.toFixed(1),
      cpu_main_busy_pct: m.cpu.mainThreadBusyPct.toFixed(1),
      heap_used_bytes: m.heap.usedBytes ?? '',
      heap_total_bytes: m.heap.totalBytes ?? '',
      gl_vendor: m.gl.vendor,
      gl_renderer: m.gl.renderer,
      gl_prog: m.gl.programs,
      gl_mem_geometries: m.gl.memory.geometries,
      gl_mem_textures: m.gl.memory.textures,
      gl_render_calls: m.gl.render.calls,
      gl_render_tris: m.gl.render.triangles,
      scene_meshes: m.scene.meshes,
      scene_geometries: m.scene.geometries,
      scene_materials: m.scene.materials,
      scene_triangles: m.scene.triangles,
      gpu_frame_ms: m.gl.gpuTimerSupported ? (m.gl.gpuFrameMs ?? 0).toFixed(3) : 'n/a'
    }

    // transpose: one header row + one data row
    const headers = Object.keys(data)
    const values = Object.values(data)
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ].join('\n')

    return URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  }, [m])


  return (
    <Html fullscreen transform={false} pointerEvents="none" style={{ zIndex: 10 }}>
      {/* full viewport absolute container to anchor HUD in top-right */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        <aside
          className="metricsPanel"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            pointerEvents: 'auto',
          }}
        >
          <div className="bar">
            <strong>Metrics</strong>
            <a className="btn" href={csvHref} download={`metrics-${Date.now()}.csv`}>
              Snapshot CSV
            </a>
          </div>

          <Section title="FPS">
            <div className="grid">
              <div><b>Avg</b><div>{m.fps.avg.toFixed(1)}</div></div>
              <div><b>Min</b><div>{m.fps.min.toFixed(1)}</div></div>
              <div><b>Max</b><div>{m.fps.max.toFixed(1)}</div></div>
            </div>
          </Section>

          <Section title="Scene (geometry/material/draw)">
            <div className="grid">
              <div><b>Meshes</b><div>{m.scene.meshes}</div></div>
              <div><b>Geometries</b><div>{m.scene.geometries}</div></div>
              <div><b>Materials</b><div>{m.scene.materials}</div></div>
              <div><b>Triangles</b><div>{m.scene.triangles.toLocaleString()}</div></div>
              <div><b>Draw calls</b><div>{m.gl.render.calls}</div></div>
              <div><b>Programs</b><div>{m.gl.programs}</div></div>
              <div><b>Textures</b><div>{m.gl.memory.textures}</div></div>
              <div><b>GL Geometries</b><div>{m.gl.memory.geometries}</div></div>
            </div>
            <details>
              <summary>Per-mesh</summary>
              <ul className="list">
                {m.scene.items.slice(0, 100).map((it, i) => (
                  <li key={i}><code>{it.type}</code> — {it.name} — {it.tris} tris</li>
                ))}
              </ul>
              {m.scene.items.length > 100 && <em>…{m.scene.items.length - 100} more</em>}
            </details>
          </Section>

          <Section title="System (memory / CPU / GPU)">
            <div className="grid">
              <div><b>JS Heap Used</b><div>{m.heap.usedHuman}</div></div>
              <div><b>JS Heap Total</b><div>{m.heap.totalHuman}</div></div>
              <div><b>Main busy % (5s)</b><div>{m.cpu.mainThreadBusyPct.toFixed(1)}%</div></div>
              <div><b>GPU frame</b><div>{m.gl.gpuTimerSupported ? `${(m.gl.gpuFrameMs ?? 0).toFixed(2)} ms` : 'n/a'}</div></div>
              <div><b>GL Vendor</b><div>{m.gl.vendor}</div></div>
              <div><b>GL Renderer</b><div>{m.gl.renderer}</div></div>
            </div>
            <p className="hint">
              Nota: el % de CPU/GPU real por pestaña no está disponible en JS.
              El tiempo de frame GPU y los contadores GL sirven como proxy.
            </p>
          </Section>
        </aside>
      </div>
    </Html>
  )
}
