import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_STORAGE_KEY = 'auth_rate_limits';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an identifier (email) is rate limited
 * @param {string} identifier - Email or username to check
 * @returns {Promise<{allowed: boolean, error?: string, remainingTime?: number}>}
 */
export const checkRateLimit = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};

    if (attempts[identifier]) {
      const { count, lockedUntil } = attempts[identifier];
      const now = Date.now();

      if (now < lockedUntil) {
        const remainingSeconds = Math.ceil((lockedUntil - now) / 1000);
        return {
          allowed: false,
          error: `Too many login attempts. Please try again in ${remainingSeconds} seconds.`,
          remainingTime: remainingSeconds,
        };
      } else {
        // Lockout expired, reset this identifier
        delete attempts[identifier];
        await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts));
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('[RateLimit] Check error:', error);
    // On error, allow attempt (fail open)
    return { allowed: true };
  }
};

/**
 * Record a failed login attempt
 * @param {string} identifier - Email or username
 */
export const recordFailedAttempt = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};

    if (!attempts[identifier]) {
      attempts[identifier] = { count: 1, lockedUntil: null };
    } else {
      attempts[identifier].count += 1;
    }

    // Lock after MAX_ATTEMPTS
    if (attempts[identifier].count >= MAX_ATTEMPTS) {
      attempts[identifier].lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      console.log('[RateLimit] Account locked for:', identifier);
    }

    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts));
    console.log(`[RateLimit] Failed attempt recorded for ${identifier}. Count: ${attempts[identifier].count}/${MAX_ATTEMPTS}`);
  } catch (error) {
    console.error('[RateLimit] Recording error:', error);
  }
};

/**
 * Clear attempts for a successful login
 * @param {string} identifier - Email or username
 */
export const clearAttempts = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};
    delete attempts[identifier];
    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts));
    console.log('[RateLimit] Attempts cleared for:', identifier);
  } catch (error) {
    console.error('[RateLimit] Clear error:', error);
  }
};

/**
 * Get remaining attempts for an identifier
 * @param {string} identifier - Email or username
 * @returns {Promise<{attempts: number, remaining: number}>}
 */
export const getAttemptInfo = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};

    if (attempts[identifier]) {
      return {
        attempts: attempts[identifier].count,
        remaining: Math.max(0, MAX_ATTEMPTS - attempts[identifier].count),
      };
    }

    return { attempts: 0, remaining: MAX_ATTEMPTS };
  } catch (error) {
    console.error('[RateLimit] Get attempt info error:', error);
    return { attempts: 0, remaining: MAX_ATTEMPTS };
  }
};

/**
 * Reset all rate limits (admin function - for testing)
 */
export const resetAllRateLimits = async () => {
  try {
    await AsyncStorage.removeItem(RATE_LIMIT_STORAGE_KEY);
    console.log('[RateLimit] All rate limits reset');
  } catch (error) {
    console.error('[RateLimit] Reset error:', error);
  }
};
