// src/ui/DeleteGeometriesButton.jsx
import React from 'react'

export default function DeleteGeometriesButton() {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(new CustomEvent('gc:delete-geometries'))
      }
      title="Dispose all geometries & materials currently in the scene"
      style={{
        position: 'fixed',
        left: '12px',
        bottom: '12px',
        zIndex: 10000,
        padding: '8px 12px',
        fontSize: '14px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.25)',
        background: 'rgba(20,20,20,0.7)',
        color: 'white',
        backdropFilter: 'blur(6px)',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        userSelect: 'none',
      }}
    >
      Delete geometries
    </button>
  )
}
