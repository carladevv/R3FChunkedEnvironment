// src/scene/LODSwitchButton.jsx
import React, { useEffect, useState } from 'react'
import { useLODContext } from './LODContext'

export default function LODSwitchButton() {
  const { objects, setLevel } = useLODContext()
  const ids = Object.keys(objects)

  const [selectedId, setSelectedId] = useState(null)

  // Auto-select first object when it appears
  useEffect(() => {
    if (!selectedId && ids.length > 0) {
      setSelectedId(ids[0])
    }
  }, [ids, selectedId])

  const current = selectedId ? objects[selectedId] : null
  const currentLevel = current?.level ?? 0

  const handleSetLOD = (level) => {
    if (!selectedId) return
    setLevel(selectedId, level)
  }

  const handleCycle = () => {
    if (!selectedId) return
    const next = ((currentLevel || 0) + 1) % 4
    setLevel(selectedId, next)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: 10,
        borderRadius: 10,
        border: '1px solid rgba(255,255,255,0.25)',
        background: 'rgba(15,15,15,0.85)',
        color: 'white',
        backdropFilter: 'blur(6px)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
      }}
    >
      <div style={{ marginBottom: 4, opacity: 0.8 }}>
        LOD controller
      </div>

      {/* Target object selector */}
      <select
        value={selectedId || ''}
        onChange={(e) => setSelectedId(e.target.value || null)}
        style={{
          padding: '4px 6px',
          borderRadius: 6,
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(0,0,0,0.4)',
          color: 'white',
        }}
      >
        {ids.length === 0 && (
          <option value="">No LOD objects</option>
        )}
        {ids.length > 0 && (
          <>
            <option value="">Select object…</option>
            {ids.map(id => (
              <option key={id} value={id}>
                {objects[id].label || id}
                {objects[id].isLoading ? ' (loading...)' : ''}
              </option>
            ))}
          </>
        )}
      </select>

      {/* LOD level buttons */}
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {[0, 1, 2, 3].map((level) => {
          const isActive = currentLevel === level
          return (
            <button
              key={level}
              onClick={() => handleSetLOD(level)}
              disabled={current?.isLoading}
              style={{
                padding: '4px 6px',
                borderRadius: 6,
                border: isActive
                  ? '1px solid rgba(0,255,150,0.9)'
                  : '1px solid rgba(255,255,255,0.3)',
                background: isActive
                  ? 'rgba(0,255,150,0.2)'
                  : 'rgba(0,0,0,0.4)',
                color: 'white',
                cursor: current?.isLoading ? 'not-allowed' : 'pointer',
                fontSize: 11,
                opacity: current?.isLoading ? 0.6 : 1,
              }}
            >
              LOD {level}
            </button>
          )
        })}

        <button
          onClick={handleCycle}
          disabled={current?.isLoading}
          title="Cycle 0 → 1 → 2 → 3 → 0"
          style={{
            padding: '4px 6px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(0,0,0,0.4)',
            color: 'white',
            cursor: current?.isLoading ? 'not-allowed' : 'pointer',
            fontSize: 11,
            marginLeft: 4,
            opacity: current?.isLoading ? 0.6 : 1,
          }}
        >
          Cycle
        </button>
      </div>

      {current && (
        <div style={{ marginTop: 4, opacity: 0.8 }}>
          Current: <strong>{current.label}</strong> → LOD {currentLevel}
          {current.isLoading && ' (switching...)'}
        </div>
      )}
    </div>
  )
}