/**
 * Error Handler for Authentication
 * Converts Supabase error messages into user-friendly messages
 */

export const parseAuthError = (error) => {
  if (!error) {
    return { title: 'Error', message: 'An unexpected error occurred. Please try again.' };
  }

  const errorMessage = error.toLowerCase();

  // Login/Signin Errors
  if (
    errorMessage.includes('invalid login credentials') ||
    errorMessage.includes('invalid email or password')
  ) {
    return {
      title: 'Invalid Credentials',
      message: 'Email or password is incorrect. Please check and try again.',
    };
  }

  if (errorMessage.includes('user not found')) {
    return {
      title: 'User Not Found',
      message: 'No account found with this email. Please sign up first.',
    };
  }

  // Signup Errors - Duplicate Email or RLS Security
  if (
    errorMessage.includes('already registered') ||
    errorMessage.includes('user already exists') ||
    errorMessage.includes('duplicate') ||
    errorMessage.includes('unique violation') ||
    errorMessage.includes('email already in use') ||
    errorMessage.includes('row level security') ||
    errorMessage.includes('new row violates')
  ) {
    return {
      title: 'Email Already Registered',
      message: 'This email is already registered. Please log in instead or use a different email.',
    };
  }

  if (
    errorMessage.includes('password') &&
    errorMessage.includes('weak')
  ) {
    return {
      title: 'Weak Password',
      message: 'Password must be at least 6 characters. Please use a stronger password.',
    };
  }

  // Rate limiting (check BEFORE generic email check)
  if (
    errorMessage.includes('rate') ||
    errorMessage.includes('too many')
  ) {
    return {
      title: 'Too Many Attempts',
      message: 'You have made too many attempts. Please wait a few minutes and try again.',
    };
  }

  if (errorMessage.includes('email')) {
    return {
      title: 'Invalid Email',
      message: 'Please enter a valid email address.',
    };
  }

  // Session/Token Errors
  if (
    errorMessage.includes('session') ||
    errorMessage.includes('token')
  ) {
    return {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
    };
  }

  // Network Errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('offline')
  ) {
    return {
      title: 'Network Error',
      message: 'Please check your internet connection and try again.',
    };
  }

  // CORS/Server Errors
  if (errorMessage.includes('cors')) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please try again later.',
    };
  }

  // Default error
  return {
    title: 'Error',
    message: error || 'An unexpected error occurred. Please try again.',
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Get password strength feedback
 */
export const getPasswordStrengthFeedback = (password) => {
  if (!password) {
    return { strength: 'empty', message: 'Password is required' };
  }

  if (password.length < 6) {
    return {
      strength: 'weak',
      message: `Password must be at least 6 characters (${password.length}/6)`,
    };
  }

  if (password.length < 8) {
    return { strength: 'fair', message: 'Consider using a longer password' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  const strengthScore = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;

  if (strengthScore >= 3) {
    return { strength: 'strong', message: 'Strong password!' };
  }

  return { strength: 'good', message: 'Good password' };
};
