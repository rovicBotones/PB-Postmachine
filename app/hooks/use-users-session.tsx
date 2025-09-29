import { useState, useEffect, useCallback } from 'react';
import { SessionManagementService } from '../../utils/session-management.service';

interface UserSessionData {
  userId: string;
  email: string;
  lastSignInAt: Date | null;
  remainingTimeMs: number;
  formattedRemainingTime: string;
  isExpired: boolean;
}

interface UseUsersSessionOptions {
  updateInterval?: number; // Update interval in milliseconds (default: 30 seconds)
  enabled?: boolean; // Whether to automatically fetch and update
}

export function useUsersSession(
  userIds: string[],
  options: UseUsersSessionOptions = {}
) {
  const { updateInterval = 30000, enabled = true } = options;

  const [sessionData, setSessionData] = useState<Record<string, UserSessionData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!enabled || userIds.length === 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const dataPromise = SessionManagementService.getUsersSessionInfo(userIds);

      const sessionsInfo = await Promise.race([dataPromise, timeoutPromise]) as UserSessionData[];

      const newSessionData: Record<string, UserSessionData> = {};
      sessionsInfo.forEach(info => {
        newSessionData[info.userId] = info;
      });

      setSessionData(newSessionData);
    } catch (err) {
      console.error('Error fetching session data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch session data');

      // Set default data for users when there's an error
      const defaultSessionData: Record<string, UserSessionData> = {};
      userIds.forEach(userId => {
        defaultSessionData[userId] = {
          userId,
          email: '',
          lastSignInAt: null,
          remainingTimeMs: 0,
          formattedRemainingTime: '--:--:--',
          isExpired: true
        };
      });
      setSessionData(defaultSessionData);
    } finally {
      setLoading(false);
    }
  }, [userIds, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Set up interval to update session data
  useEffect(() => {
    if (!enabled || updateInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchSessionData();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [fetchSessionData, updateInterval, enabled]);

  // Update remaining time every second for already loaded data (countdown effect)
  useEffect(() => {
    if (!enabled || Object.keys(sessionData).length === 0) {
      return;
    }

    const interval = setInterval(() => {
      setSessionData(prevData => {
        const newData = { ...prevData };
        let hasChanges = false;

        Object.keys(newData).forEach(userId => {
          const userData = newData[userId];
          if (userData.remainingTimeMs > 0) {
            const newRemainingTime = Math.max(0, userData.remainingTimeMs - 1000);

            if (newRemainingTime !== userData.remainingTimeMs) {
              const sessionTime = SessionManagementService.calculateUserSessionTime(
                userData.lastSignInAt,
                SessionManagementService.getUserTimeoutHours(userId)
              );

              newData[userId] = {
                ...userData,
                remainingTimeMs: sessionTime.remainingTimeMs,
                formattedRemainingTime: sessionTime.formattedRemainingTime,
                isExpired: sessionTime.isExpired
              };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? newData : prevData;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [enabled, sessionData]);

  const getSessionData = useCallback((userId: string): UserSessionData | null => {
    return sessionData[userId] || null;
  }, [sessionData]);

  const refreshSessionData = useCallback(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Helper functions
  const getUserRemainingTime = useCallback((userId: string): string => {
    const data = getSessionData(userId);
    return data?.formattedRemainingTime || '--:--:--';
  }, [getSessionData]);

  const isUserSessionExpired = useCallback((userId: string): boolean => {
    const data = getSessionData(userId);
    return data?.isExpired ?? true;
  }, [getSessionData]);

  const isUserSessionNearExpiry = useCallback((userId: string, warningMinutes: number = 10): boolean => {
    const data = getSessionData(userId);
    if (!data) return false;
    return SessionManagementService.isSessionNearExpiry(data.remainingTimeMs, warningMinutes);
  }, [getSessionData]);

  return {
    sessionData,
    loading,
    error,
    getSessionData,
    getUserRemainingTime,
    isUserSessionExpired,
    isUserSessionNearExpiry,
    refreshSessionData
  };
}