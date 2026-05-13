# Security Improvements Roadmap

## 🔴 High Priority (Implement First)

### 1. **Rate Limiting & Brute Force Protection**
**Problem:** No protection against password brute force attacks
**Solution:** Implement rate limiting on auth endpoints

```javascript
// services/rateLimitService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const RATE_LIMIT_STORAGE_KEY = 'auth_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const checkRateLimit = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};
    
    if (attempts[identifier]) {
      const { count, lockedUntil } = attempts[identifier];
      const now = Date.now();
      
      if (now < lockedUntil) {
        const remainingTime = Math.ceil((lockedUntil - now) / 1000);
        throw new Error(`Too many attempts. Please try again in ${remainingTime} seconds.`);
      } else {
        // Lockout expired, reset
        delete attempts[identifier];
      }
    }
    
    return { allowed: true };
  } catch (error) {
    return { allowed: false, error: error.message };
  }
};

export const recordFailedAttempt = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};
    
    if (!attempts[identifier]) {
      attempts[identifier] = { count: 1, lockedUntil: Date.now() + LOCKOUT_DURATION_MS };
    } else {
      attempts[identifier].count += 1;
      if (attempts[identifier].count >= MAX_ATTEMPTS) {
        attempts[identifier].lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      }
    }
    
    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Rate limit recording error:', error);
  }
};

export const clearAttempts = async (identifier) => {
  try {
    const stored = await AsyncStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};
    delete attempts[identifier];
    await AsyncStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Clear attempts error:', error);
  }
};
```

**Implementation in LoginSignupScreen:**
```javascript
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '../services/rateLimitService';

const handleLogin = async () => {
  const { allowed, error } = await checkRateLimit(email);
  if (!allowed) {
    showError('Too Many Attempts', error);
    return;
  }
  
  try {
    const { user, session, error } = await signIn(email, password);
    if (error) {
      await recordFailedAttempt(email);
      throw error;
    }
    await clearAttempts(email);
    // ... proceed with login
  } catch (error) {
    showError('Login Failed', parseAuthError(error.message).message);
  }
};
```

---

### 2. **Input Validation & Sanitization**
**Problem:** Limited validation on user inputs
**Solution:** Comprehensive input validation

```javascript
// services/inputValidationService.js

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email too long' };
  }
  return { valid: true };
};

export const sanitizeInput = (input, maxLength = 255) => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"']/g, ''); // Remove potentially dangerous characters
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('Special character (!@#$%^&*)');
  if (password.length > 128) errors.push('Password too long');
  
  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? `Missing: ${errors.join(', ')}` : null
  };
};

export const validateStudySetTitle = (title) => {
  const sanitized = sanitizeInput(title, 100);
  if (sanitized.length === 0) {
    return { valid: false, error: 'Title cannot be empty' };
  }
  return { valid: true, sanitized };
};
```

---

### 3. **Account Lockout After Failed Attempts**
**Problem:** No account protection after multiple failed login attempts
**Solution:** Temporary account lockout (5 attempts → 15 min lockout)

```javascript
// Already covered in Rate Limiting Service above
```

---

### 4. **Secure Password Reset Flow**
**Problem:** No password reset functionality shown
**Solution:** Add secure password reset with token validation

```javascript
// services/authService.js - Add this function

export const resetPasswordRequest = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.EXPO_PUBLIC_SITE_URL}/reset-password`,
    });
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const resetPasswordWithToken = async (newPassword, accessToken) => {
  try {
    const { error } = await supabase.auth.updateUser(
      { password: newPassword },
      { accessToken }
    );
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};
```

---

## 🟡 Medium Priority (Implement Next)

### 5. **Two-Factor Authentication (2FA)**
**Problem:** Only email/password protection
**Solution:** TOTP-based 2FA (Google Authenticator compatible)

```javascript
// services/twoFactorService.js

export const generateTOTPSecret = async (userId) => {
  try {
    // Use supabase-js built-in or external library
    const { data, error } = await supabase
      .from('user_2fa')
      .insert([{
        user_id: userId,
        enabled: false,
        // secret will be generated server-side
      }]);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

export const verifyTOTP = async (userId, code) => {
  try {
    // Call Supabase function to verify
    const { data, error } = await supabase.functions.invoke('verify-totp', {
      body: { userId, code }
    });
    
    if (error) throw error;
    return { valid: data.valid, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

export const enableTwoFactor = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_2fa')
      .update({ enabled: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};
```

---

### 6. **Refresh Token Rotation**
**Problem:** No automatic refresh token rotation
**Solution:** Rotate tokens on every refresh

```javascript
// services/authService.js - Enhance existing refresh logic

export const setupRefreshTokenRotation = () => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED') {
      console.log('[Auth] Token refreshed successfully');
      // New token automatically stored by Supabase
    }
  });
};

export const secureRefreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    // New access token + refresh token generated
    return { session, error: null };
  } catch (error) {
    return { session: null, error: error.message };
  }
};
```

---

### 7. **Audit Logging**
**Problem:** No security event logging
**Solution:** Log security events to Supabase

```javascript
// services/auditService.js

export const logSecurityEvent = async (userId, eventType, details) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        user_id: userId,
        event_type: eventType, // 'login', 'logout', 'password_change', 'failed_login', etc.
        details: JSON.stringify(details),
        ip_address: 'client-side (set server-side)', // Better to capture server-side
        timestamp: new Date().toISOString(),
      }]);
    
    if (error) console.error('Audit logging error:', error);
  } catch (error) {
    console.error('Audit service error:', error);
  }
};

// Usage in authService.js
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed attempt
      await logSecurityEvent(null, 'failed_login', { email, timestamp: new Date() });
      throw error;
    }

    // Log successful login
    await logSecurityEvent(data.user.id, 'login', { email });
    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error: error.message };
  }
};
```

**Database schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);
```

---

### 8. **Secure Error Handling**
**Problem:** Auth errors might expose sensitive information
**Solution:** Generic error messages to users, detailed logs internally

```javascript
// services/errorHandler.js - Enhance existing

export const sanitizeAuthError = (error) => {
  const errorMap = {
    'Invalid login credentials': 'Email or password is incorrect',
    'Email not confirmed': 'Please verify your email before logging in',
    'User already registered': 'This email is already registered',
    'Password too short': 'Password must be at least 8 characters',
  };

  const userMessage = errorMap[error] || 'An error occurred. Please try again.';
  
  // Log full error internally (not shown to user)
  console.error('[Security] Auth Error:', {
    originalError: error,
    timestamp: new Date().toISOString(),
  });

  return userMessage;
};
```

---

## 🟢 Low Priority (Nice to Have)

### 9. **Certificate Pinning**
Ensure app only communicates with legitimate Supabase servers (prevents MITM attacks on specific networks)

### 10. **Encryption at Rest**
Encrypt sensitive local data beyond what AsyncStorage provides

### 11. **Session Timeout**
Auto-logout users after 30 minutes of inactivity

```javascript
export const setupSessionTimeout = () => {
  let inactivityTimer;
  
  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      console.log('[Security] Session timeout - logging out');
      signOut();
    }, 30 * 60 * 1000); // 30 minutes
  };
  
  // Reset on user activity (touches, keypresses, etc.)
  AppState.addEventListener('focus', resetTimer);
};
```

---

## 📋 Implementation Priority

1. **Week 1:** Rate limiting + Input validation
2. **Week 2:** Account lockout + Secure password reset
3. **Week 3:** Audit logging + Better error handling
4. **Week 4:** 2FA implementation
5. **Later:** Token rotation + Session timeout

---

## 🔐 Database Security Checklist

- ✅ RLS enabled on all tables
- ✅ User-scoped policies
- ⚠️ TODO: Add audit_logs table
- ⚠️ TODO: Add user_2fa table for 2FA
- ⚠️ TODO: Add failed_login_attempts tracking

---

## 🛡️ Deployment Security

Before deploying to production:
- [ ] Rotate Supabase anon key
- [ ] Enable Supabase email confirmations
- [ ] Set up CORS restrictions
- [ ] Configure rate limiting on Supabase side
- [ ] Enable backups
- [ ] Review and remove debug console logs
- [ ] Set up monitoring/alerts for security events
