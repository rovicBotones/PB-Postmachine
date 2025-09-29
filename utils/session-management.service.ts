import { supabase } from "./auth.service";

interface UserSessionInfo {
  userId: string;
  email: string;
  lastSignInAt: Date | null;
  remainingTimeMs: number;
  formattedRemainingTime: string;
  isExpired: boolean;
}

export class SessionManagementService {

  // Get session timeout setting for a user (from localStorage or default)
  static getUserTimeoutHours(userId: string): number {
    if (typeof window === 'undefined') return 8; // Default for server-side

    const savedHours = localStorage.getItem(`session_timeout_hours_${userId}`);
    if (savedHours) {
      const hours = parseFloat(savedHours);
      if (hours > 0 && hours <= 24) {
        return hours;
      }
    }
    return 8; // Default 8 hours
  }

  // Calculate remaining session time for a user
  static calculateUserSessionTime(lastSignInAt: Date | null, timeoutHours: number): {
    remainingTimeMs: number;
    formattedRemainingTime: string;
    isExpired: boolean;
  } {
    if (!lastSignInAt) {
      return {
        remainingTimeMs: 0,
        formattedRemainingTime: '--:--:--',
        isExpired: true
      };
    }

    const now = new Date();
    const timeoutTime = new Date(lastSignInAt.getTime() + (timeoutHours * 60 * 60 * 1000));
    const remainingTime = timeoutTime.getTime() - now.getTime();

    if (remainingTime <= 0) {
      return {
        remainingTimeMs: 0,
        formattedRemainingTime: 'Expired',
        isExpired: true
      };
    }

    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    return {
      remainingTimeMs: remainingTime,
      formattedRemainingTime: formattedTime,
      isExpired: false
    };
  }

  // Get session info for multiple users
  static async getUsersSessionInfo(userIds: string[]): Promise<UserSessionInfo[]> {
    if (userIds.length === 0) return [];

    try {
      // Get user authentication data from Supabase
      const userPromises = userIds.map(async (userId) => {
        try {
          const { data: user, error } = await supabase.auth.admin.getUserById(userId);

          if (error || !user.user) {
            console.error(`Failed to get user ${userId}:`, error);
            return null;
          }

          const lastSignInAt = user.user.last_sign_in_at ? new Date(user.user.last_sign_in_at) : null;
          const timeoutHours = this.getUserTimeoutHours(userId);
          const sessionTime = this.calculateUserSessionTime(lastSignInAt, timeoutHours);

          return {
            userId: userId,
            email: user.user.email || 'Unknown',
            lastSignInAt,
            remainingTimeMs: sessionTime.remainingTimeMs,
            formattedRemainingTime: sessionTime.formattedRemainingTime,
            isExpired: sessionTime.isExpired
          };
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(userPromises);
      return results.filter((result): result is UserSessionInfo => result !== null);
    } catch (error) {
      console.error('Error getting users session info:', error);
      return [];
    }
  }

  // Get session info for a single user
  static async getUserSessionInfo(userId: string): Promise<UserSessionInfo | null> {
    const results = await this.getUsersSessionInfo([userId]);
    return results.length > 0 ? results[0] : null;
  }

  // Format time remaining for display
  static formatTimeRemaining(remainingTimeMs: number): string {
    if (remainingTimeMs <= 0) return 'Expired';

    const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTimeMs % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Check if a user's session is about to expire (within warning threshold)
  static isSessionNearExpiry(remainingTimeMs: number, warningMinutes: number = 10): boolean {
    const warningThreshold = warningMinutes * 60 * 1000; // Convert to milliseconds
    return remainingTimeMs > 0 && remainingTimeMs <= warningThreshold;
  }
}