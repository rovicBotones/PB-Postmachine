import { supabase } from './auth.service'
import { signoutService } from './signOut.service'

interface SessionTimeoutConfig {
  timeoutHours: number
  onWarning?: () => void
  onTimeout?: () => void
  enableWarnings?: boolean
}

export class AuthSessionTimeoutManager {
  private timeoutId: NodeJS.Timeout | null = null
  private warningTimeoutId: NodeJS.Timeout | null = null
  private checkIntervalId: NodeJS.Timeout | null = null
  private config: SessionTimeoutConfig
  private isActive: boolean = false
  private loginEventListener: ((event: CustomEvent) => void) | null = null

  constructor(config: SessionTimeoutConfig) {
    this.config = {
      enableWarnings: true,
      ...config
    }
    console.log(`Auth session timeout manager created - sessions expire after ${config.timeoutHours} hours of inactivity`)

    // Listen for login events to refresh session timeout
    this.setupLoginListener()
  }

  private setupLoginListener() {
    if (typeof window !== 'undefined') {
      this.loginEventListener = (event: CustomEvent) => {
        console.log('User login detected, refreshing session timeout')

        if (this.isActive) {
          this.refreshTimeout()
        } else {
          this.start()
        }
      }
      window.addEventListener('user-login', this.loginEventListener as EventListener)
    }
  }

  private async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error fetching session:', error)
        return null
      }
      return session
    } catch (error) {
      console.error('Error getting current session:', error)
      return null
    }
  }

  private async getLastSignInTime(): Promise<Date | null> {
    try {
      const session = await this.getCurrentSession()
      if (!session?.user) {
        return null
      }

      // Always get fresh user data from Supabase auth to check last_sign_in_at
      const { data: user, error } = await supabase.auth.getUser()
      if (error || !user.user?.last_sign_in_at) {
        console.error('Error getting user data or no last_sign_in_at:', error)
        return null
      }

      const lastSignInTime = new Date(user.user.last_sign_in_at)
      console.log('Last sign in time from Supabase auth:', lastSignInTime.toLocaleString())

      return lastSignInTime
    } catch (error) {
      console.error('Error getting last sign in time:', error)
      return null
    }
  }

  private async calculateTimeUntilTimeout(): Promise<number> {
    const lastSignIn = await this.getLastSignInTime()
    if (!lastSignIn) {
      return 0
    }

    const now = new Date()
    const timeoutTime = new Date(lastSignIn.getTime() + (this.config.timeoutHours * 60 * 60 * 1000))
    const remainingTime = timeoutTime.getTime() - now.getTime()

    console.log(`Session timeout check:`)
    console.log(`- Last sign in: ${lastSignIn.toLocaleString()}`)
    console.log(`- Timeout after: ${this.config.timeoutHours} hours (${this.config.timeoutHours * 60} minutes)`)
    console.log(`- Timeout time: ${timeoutTime.toLocaleString()}`)
    console.log(`- Current time: ${now.toLocaleString()}`)
    console.log(`- Remaining time: ${Math.floor(remainingTime / 1000 / 60)} minutes (${Math.floor(remainingTime / 1000)} seconds)`)

    // If remaining time is negative, session has expired
    if (remainingTime <= 0) {
      console.log('Session has expired based on last_sign_in_at')
      return 0
    }

    return remainingTime
  }

  private async terminateSession() {
    try {
      console.log('Terminating session - Auth timeout reached')

      if (this.config.onTimeout) {
        this.config.onTimeout()
      }

      // Sign out the user
      await signoutService()

      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Error during session termination:', error)
    }
  }

  private async showWarning() {
    try {
      if (this.config.enableWarnings && this.config.onWarning) {
        this.config.onWarning()
      }
      // Warning alerts disabled - session will terminate silently
    } catch (error) {
      console.error('Error showing warning:', error)
    }
  }

  private async setTimeouts() {
    const remainingTime = await this.calculateTimeUntilTimeout()

    if (remainingTime <= 0) {
      // Session has already expired based on last_sign_in_at
      console.log('Session expired - terminating immediately')
      await this.terminateSession()
      return
    }

    console.log(`Setting session timeout. Time remaining: ${Math.floor(remainingTime / 1000 / 60)} minutes`)

    // Clear existing timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId)
    }

    // Set warning timeout (10 minutes before expiry)
    const warningTime = Math.max(0, remainingTime - (10 * 60 * 1000))
    if (warningTime > 0 && this.config.enableWarnings) {
      this.warningTimeoutId = setTimeout(async () => {
        // Re-check if session is still valid before showing warning
        const currentRemainingTime = await this.calculateTimeUntilTimeout()
        if (currentRemainingTime > 0) {
          this.showWarning()
        } else {
          await this.terminateSession()
        }
      }, warningTime)
    }

    // Set main timeout
    this.timeoutId = setTimeout(async () => {
      // Final check before termination
      const finalRemainingTime = await this.calculateTimeUntilTimeout()
      if (finalRemainingTime <= 0) {
        await this.terminateSession()
      }
    }, remainingTime)
  }

  public async start() {
    console.log(`Starting auth session timeout manager (${this.config.timeoutHours} hours)`)
    this.isActive = true

    // Check if user is authenticated
    const session = await this.getCurrentSession()
    if (!session) {
      console.log('No active session found, not starting timeout')
      return
    }

    // Check if session is already expired on start
    const remainingTime = await this.calculateTimeUntilTimeout()
    if (remainingTime <= 0) {
      console.log('Session already expired on start - terminating immediately')
      await this.terminateSession()
      return
    }

    // Set initial timeouts
    await this.setTimeouts()

    // Check session status every 2 minutes for more responsive timeout enforcement
    this.checkIntervalId = setInterval(async () => {
      if (this.isActive) {
        const currentSession = await this.getCurrentSession()
        if (!currentSession) {
          console.log('Session no longer exists, stopping timeout manager')
          this.stop()
          return
        }

        // Check if session has expired based on last_sign_in_at
        const remainingTime = await this.calculateTimeUntilTimeout()
        if (remainingTime <= 0) {
          console.log('Session expired during periodic check - terminating')
          await this.terminateSession()
          return
        }

        // Recalculate timeouts in case of any changes
        await this.setTimeouts()
      }
    }, 1 * 60 * 60 * 1000) // Check every 2 hrs
  }

  public stop() {
    console.log('Stopping auth session timeout manager')
    this.isActive = false

    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId)
      this.warningTimeoutId = null
    }

    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }

    // Clean up login event listener
    if (this.loginEventListener && typeof window !== 'undefined') {
      window.removeEventListener('user-login', this.loginEventListener as EventListener)
      this.loginEventListener = null
    }
  }

  public async refreshTimeout() {
    console.log('Refreshing session timeout - re-checking last_sign_in_at')

    if (this.isActive) {
      await this.setTimeouts()
    }
  }

  public async getRemainingTime(): Promise<number> {
    return this.calculateTimeUntilTimeout()
  }

  public async getFormattedRemainingTime(): Promise<string> {
    const ms = await this.calculateTimeUntilTimeout()

    if (ms <= 0) {
      return '00:00:00'
    }

    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((ms % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  public getConfig(): SessionTimeoutConfig {
    return { ...this.config }
  }

  public updateConfig(newConfig: Partial<SessionTimeoutConfig>) {
    this.config = { ...this.config, ...newConfig }
    console.log(`Session timeout config updated: ${this.config.timeoutHours} hours`)

    // Restart with new config if currently active
    if (this.isActive) {
      this.setTimeouts()
    }
  }

  public recordActivity() {
    console.log('Recording user activity - re-checking session timeout based on last_sign_in_at')

    if (this.isActive) {
      this.setTimeouts()
    }
  }
}

// Singleton instance
let authSessionManager: AuthSessionTimeoutManager | null = null

export const getAuthSessionManager = (config?: SessionTimeoutConfig): AuthSessionTimeoutManager => {
  if (!authSessionManager && config) {
    authSessionManager = new AuthSessionTimeoutManager(config)
  } else if (!authSessionManager) {
    // Default to 8 hours if no config provided
    authSessionManager = new AuthSessionTimeoutManager({ timeoutHours: 8 })
  }
  return authSessionManager
}

export const destroyAuthSessionManager = () => {
  if (authSessionManager) {
    authSessionManager.stop()
    authSessionManager = null
  }
  console.log('Auth session timeout manager destroyed')
}