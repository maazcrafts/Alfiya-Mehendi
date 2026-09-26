import { useEffect, useRef, useState } from 'react'

const SLOW_REQUEST_MS = 4000

function readOnlineState() {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(readOnlineState)
  const [slow, setSlow] = useState(false)
  const [restored, setRestored] = useState(false)
  const activeSlowRequests = useRef(0)
  const restoreTimer = useRef(null)

  useEffect(() => {
    const goOffline = () => {
      setIsOnline(false)
      setRestored(false)
    }

    const goOnline = () => {
      setIsOnline(true)
      setSlow(false)
      activeSlowRequests.current = 0
      setRestored(true)
      if (restoreTimer.current) clearTimeout(restoreTimer.current)
      restoreTimer.current = setTimeout(() => setRestored(false), 2800)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    const originalFetch = window.fetch.bind(window)

    window.fetch = async (...args) => {
      let slowTimer
      let markedSlow = false

      const markSlow = () => {
        markedSlow = true
        activeSlowRequests.current += 1
        setSlow(true)
      }

      slowTimer = window.setTimeout(markSlow, SLOW_REQUEST_MS)

      try {
        const response = await originalFetch(...args)

        if (markedSlow) {
          activeSlowRequests.current = Math.max(0, activeSlowRequests.current - 1)
          if (activeSlowRequests.current === 0) setSlow(false)
        }

        return response
      } catch (error) {
        if (markedSlow) {
          activeSlowRequests.current = Math.max(0, activeSlowRequests.current - 1)
          if (activeSlowRequests.current === 0) setSlow(false)
        }
        throw error
      } finally {
        window.clearTimeout(slowTimer)
      }
    }

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      window.fetch = originalFetch
      if (restoreTimer.current) clearTimeout(restoreTimer.current)
    }
  }, [])

  if (!isOnline) {
    return (
      <div className="network-status-banner network-status-offline" role="status" aria-live="assertive">
        <span className="network-status-signal" aria-hidden="true"><i></i><i></i><i></i></span>
        <div>
          <strong>You're offline</strong>
          <span>Check your internet connection. Some features may not work.</span>
        </div>
      </div>
    )
  }

  if (slow) {
    return (
      <div className="network-status-banner network-status-slow" role="status" aria-live="polite">
        <span className="network-status-clock" aria-hidden="true"></span>
        <div>
          <strong>It's taking longer than usual</strong>
          <span>You're on a slow connection. Please wait…</span>
        </div>
        <span className="network-status-progress" aria-hidden="true"><i></i></span>
      </div>
    )
  }

  if (restored) {
    return (
      <div className="network-status-banner network-status-restored" role="status" aria-live="polite">
        <span className="network-status-check" aria-hidden="true">✓</span>
        <div>
          <strong>Back online</strong>
          <span>Your connection has been restored.</span>
        </div>
      </div>
    )
  }

  return null
}
