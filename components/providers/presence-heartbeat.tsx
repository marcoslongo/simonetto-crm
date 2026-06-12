'use client'

import { useEffect } from 'react'

const INTERVAL_MS = 60_000 // 60 s

async function ping() {
  try {
    await fetch('/api/presence', { method: 'POST' })
  } catch {
    // silently ignore — network issues shouldn't break the app
  }
}

export function PresenceHeartbeat() {
  useEffect(() => {
    ping() // ping imediatamente ao montar
    const id = setInterval(ping, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return null
}
