// src/metrics/MetricsCollector.jsx
import { useEffect, useRef } from 'react'
import { useR3fMetrics } from './useR3fMetrics'

export default function MetricsCollector({ onUpdate, intervalMs = 250 }) {
  const m = useR3fMetrics()
  const latestRef = useRef(m)

  // keep latest metrics in a ref without re-creating the interval
  useEffect(() => {
    latestRef.current = m
  }, [m])

  // stable interval that reads from the ref
  useEffect(() => {
    // push once immediately so HUD renders right away
    onUpdate?.(latestRef.current)

    const id = setInterval(() => {
      onUpdate?.(latestRef.current)
    }, intervalMs)

    return () => clearInterval(id)
  }, [onUpdate, intervalMs])

  return null
}
