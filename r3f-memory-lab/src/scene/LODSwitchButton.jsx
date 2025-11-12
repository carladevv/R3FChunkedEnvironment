// src/ui/LODSwitchButton.jsx
import React from 'react'

export default function LODSwitchButton() {
  const cycle = () => {
    // drive the LOD switch through the global hook exposed by LODModel
    const api = window.__LOD_SWITCH__
    if (!api) return
    const current = window.__LOD_CURRENT__ ?? 3
    const next = (current + 1) % 4
    window.__LOD_CURRENT__ = next
    api(next)
  }

  const setTo = (n) => {
    const api = window.__LOD_SWITCH__
    if (!api) return
    window.__LOD_CURRENT__ = n
    api(n)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 10000,
        display: 'flex',
        gap: 8,
        padding: 8,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.25)',
        background: 'rgba(20,20,20,0.7)',
        color: 'white',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        userSelect: 'none',
      }}
    >
      <button onClick={() => setTo(0)}>LOD 0</button>
      <button onClick={() => setTo(1)}>LOD 1</button>
      <button onClick={() => setTo(2)}>LOD 2</button>
      <button onClick={() => setTo(3)}>LOD 3</button>
      <button onClick={cycle} title="Cycle 0→1→2→3→0">Cycle</button>
    </div>
  )
}
