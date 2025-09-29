import { useState, useEffect } from 'react'
import { supabase } from 'utils/auth.service'
import { getUserRole } from 'utils/users.service'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  role: string
  avatar_url?: string
  full_name?: string
  initials: string
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true)
        setError(null)

        // Get current user from Supabase Auth
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!authUser) {
          setUser(null)
          return
        }

        // Get user role
        const userRole = await getUserRole(authUser.id)

        // Create initials from email or full name
        const getInitials = (email: string, fullName?: string): string => {
          if (fullName) {
            return fullName
              .split(' ')
              .map(name => name.charAt(0))
              .join('')
              .toUpperCase()
              .slice(0, 2)
          }

          // Fallback to email initials
          const emailParts = email.split('@')[0].split('.')
          if (emailParts.length >= 2) {
            return (emailParts[0].charAt(0) + emailParts[1].charAt(0)).toUpperCase()
          }
          return email.charAt(0).toUpperCase() + (email.charAt(1) || '').toUpperCase()
        }

        const userProfile: UserProfile = {
          id: authUser.id,
          email: authUser.email || 'Unknown',
          role: userRole || 'User',
          avatar_url: authUser.user_metadata?.avatar_url,
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          initials: getInitials(authUser.email || 'U', authUser.user_metadata?.full_name || authUser.user_metadata?.name)
        }

        setUser(userProfile)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data')
        console.error('Error fetching user:', err)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading, error }
}