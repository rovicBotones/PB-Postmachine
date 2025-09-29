import { useEffect, useState, useCallback, useRef } from 'react'
import { getAuthSessionManager, destroyAuthSessionManager } from 'utils/auth-session-timeout.service'

interface UseAuthSessionTimeoutOptions {
  timeoutHours: number
  onTimeout?: () => void
  showWarningToast?: boolean
  enableWarnings?: boolean
  enabled?: boolean
}

export function useAuthSessionTimeout(options: UseAuthSessionTimeoutOptions) {
  const [remainingTime, setRemainingTime] = useState(0)
  const [formattedRemainingTime, setFormattedRemainingTime] = useState('--:--:--')
  const [isActive, setIsActive] = useState(false)
  const [lastSignInTime, setLastSignInTime] = useState<Date | null>(null)
  const hasShownInitialToast = useRef(false)
  const isInitialized = useRef(false)

  const handleTimeout = useCallback(() => {
    setIsActive(false)

    if (options.onTimeout) {
      options.onTimeout()
    }
  }, [options.onTimeout, options.timeoutHours])

  const handleWarning = useCallback(() => {
    // Warning functionality disabled - no toast notifications
  }, [options.timeoutHours])

  useEffect(() => {
    // Only initialize if enabled and not already initialized
    if (!options.enabled || isInitialized.current) {
      return
    }

    isInitialized.current = true

    const sessionManager = getAuthSessionManager({
      timeoutHours: options.timeoutHours,
      onTimeout: handleTimeout,
      onWarning: handleWarning,
      enableWarnings: options.enableWarnings !== false
    })

    const startSession = async () => {
      console.log('Starting auth session timeout manager')
      await sessionManager.start()
      setIsActive(true)

      // Initial toast notification disabled
      hasShownInitialToast.current = true
    }

    startSession()

    // Update remaining time every 30 seconds
    const updateInterval = setInterval(async () => {
      try {
        const remaining = await sessionManager.getRemainingTime()
        const formatted = await sessionManager.getFormattedRemainingTime()

        setRemainingTime(remaining)
        setFormattedRemainingTime(formatted)

        // If session has expired, stop the interval
        if (remaining <= 0) {
          setIsActive(false)
          clearInterval(updateInterval)
        }
      } catch (error) {
        console.error('Error updating auth session timeout:', error)
      }
    }, 30000) // Update every 30 seconds

    return () => {
      console.log('Cleaning up auth session timeout')
      clearInterval(updateInterval)
      destroyAuthSessionManager()
      setIsActive(false)
      isInitialized.current = false
      hasShownInitialToast.current = false
    }
  }, [options.enabled])

  // Handle timeout hours changes separately
  useEffect(() => {
    if (options.enabled && isInitialized.current) {
      const manager = getAuthSessionManager()
      manager.updateConfig({
        timeoutHours: options.timeoutHours,
        onTimeout: handleTimeout,
        onWarning: handleWarning,
        enableWarnings: options.enableWarnings !== false
      })
    }
  }, [options.enabled, options.timeoutHours, handleTimeout, handleWarning, options.enableWarnings])

  const refreshSession = useCallback(async () => {
    const manager = getAuthSessionManager()
    await manager.refreshTimeout()
  }, [])

  const updateTimeoutHours = useCallback(async (newHours: number) => {
    const manager = getAuthSessionManager()
    manager.updateConfig({ timeoutHours: newHours })

    // Update state
    const remaining = await manager.getRemainingTime()
    const formatted = await manager.getFormattedRemainingTime()
    setRemainingTime(remaining)
    setFormattedRemainingTime(formatted)
  }, [])

  const recordActivity = useCallback(() => {
    const manager = getAuthSessionManager()
    manager.recordActivity()
  }, [])

  return {
    remainingTime,
    formattedRemainingTime,
    isActive,
    lastSignInTime,
    refreshSession,
    updateTimeoutHours,
    recordActivity,
    timeoutHours: options.timeoutHours
  }
}