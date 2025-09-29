import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuthSessionTimeout } from '~/hooks/use-auth-session-timeout'
import { useUser } from '~/hooks/use-user'

interface AuthSessionTimeoutContextType {
  remainingTime: number
  formattedRemainingTime: string
  isActive: boolean
  timeoutHours: number
  refreshSession: () => Promise<void>
  updateTimeoutHours: (hours: number) => Promise<void>
  recordActivity: () => void
}

const AuthSessionTimeoutContext = createContext<AuthSessionTimeoutContextType | null>(null)

interface AuthSessionTimeoutProviderProps {
  children: React.ReactNode
  defaultTimeoutHours?: number
}

export function AuthSessionTimeoutProvider({
  children,
  defaultTimeoutHours = 8
}: AuthSessionTimeoutProviderProps) {
  const { user, loading } = useUser()
  const [timeoutHours, setTimeoutHours] = useState(defaultTimeoutHours)

  // Load user's session timeout preference from localStorage
  useEffect(() => {
    if (user?.id) {
      const savedHours = localStorage.getItem(`session_timeout_hours_${user.id}`)
      if (savedHours) {
        const hours = parseFloat(savedHours)
        if (hours > 0 && hours <= 24) {
          setTimeoutHours(hours)
        }
      }
    }
  }, [user?.id])

  const {
    remainingTime,
    formattedRemainingTime,
    isActive,
    refreshSession,
    updateTimeoutHours: updateTimeout,
    recordActivity
  } = useAuthSessionTimeout({
    timeoutHours,
    showWarningToast: false, // Disable toast notifications
    enabled: !loading && !!user, // Pass enabled flag
    onTimeout: () => {
      console.log('Auth session timeout occurred - user will be redirected to login')
    }
  })

  const updateTimeoutHours = async (hours: number) => {
    setTimeoutHours(hours)
    await updateTimeout(hours)

    // Save user preference
    if (user?.id) {
      localStorage.setItem(`session_timeout_hours_${user.id}`, hours.toString())
    }
  }

  const contextValue: AuthSessionTimeoutContextType = {
    remainingTime,
    formattedRemainingTime,
    isActive,
    timeoutHours,
    refreshSession,
    updateTimeoutHours,
    recordActivity
  }

  return (
    <AuthSessionTimeoutContext.Provider value={contextValue}>
      {children}
      {/* Optional: Add a small indicator showing time until session expiry */}
      {isActive && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white text-xs p-2 rounded opacity-75">
          <div>Session timeout: {timeoutHours}h</div>
          <div>Time remaining: {formattedRemainingTime}</div>
        </div>
      )}
    </AuthSessionTimeoutContext.Provider>
  )
}

export function useAuthSessionTimeoutContext() {
  const context = useContext(AuthSessionTimeoutContext)
  if (!context) {
    // Return default values instead of throwing error
    console.warn('useAuthSessionTimeoutContext is being used outside of AuthSessionTimeoutProvider. Returning default values.')
    return {
      remainingTime: 0,
      formattedRemainingTime: '--:--:--',
      isActive: false,
      timeoutHours: 8,
      refreshSession: async () => {},
      updateTimeoutHours: async () => {},
      recordActivity: () => {}
    }
  }
  return context
}