import { Alert } from 'react-native';

/**
 * Notification types
 */
export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Global reference to notification function
let globalAddNotification = null;

export const setNotificationHandler = (addNotificationFn) => {
  globalAddNotification = addNotificationFn;
};

/**
 * Show notification alert
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {string} type - Notification type (success, error, warning, info)
 * @param {Function} onDismiss - Callback when dismissed
 */
export const showNotification = (title, message = '', type = NotificationType.INFO, onDismiss = null) => {
  if (globalAddNotification) {
    globalAddNotification({
      title,
      message,
      type,
      duration: 4000,
    });
  } else {
    // Fallback to Alert if notification handler not set
    const buttons = [
      {
        text: 'OK',
        onPress: onDismiss,
        style: type === NotificationType.ERROR ? 'destructive' : 'default',
      },
    ];
    Alert.alert(title, message, buttons);
  }
};

/**
 * Show success notification
 */
export const showSuccess = (title, message = '', onDismiss = null) => {
  showNotification(title, message, NotificationType.SUCCESS, onDismiss);
};

/**
 * Show error notification
 */
export const showError = (title, message = '', onDismiss = null) => {
  showNotification(title, message, NotificationType.ERROR, onDismiss);
};

/**
 * Show warning notification
 */
export const showWarning = (title, message = '', onDismiss = null) => {
  showNotification(title, message, NotificationType.WARNING, onDismiss);
};

/**
 * Show info notification
 */
export const showInfo = (title, message = '', onDismiss = null) => {
  showNotification(title, message, NotificationType.INFO, onDismiss);
};

/**
 * Show confirmation dialog with two options
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {Function} onConfirm - Callback when confirmed
 * @param {Function} onCancel - Callback when cancelled
 * @param {string} confirmText - Confirm button text
 * @param {string} cancelText - Cancel button text
 */
export const showConfirm = (
  title,
  message,
  onConfirm,
  onCancel = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
) => {
  const buttons = [
    {
      text: cancelText,
      onPress: onCancel,
      style: 'cancel',
    },
    {
      text: confirmText,
      onPress: onConfirm,
      style: 'destructive',
    },
  ];

  Alert.alert(title, message, buttons);
};

/**
 * Global error handler - call this in catch blocks
 * @param {Error} error - Error object
 * @param {string} context - Where the error occurred (for logging)
 * @param {Function} onDismiss - Optional callback
 */
export const handleError = (error, context = 'Error', onDismiss = null) => {
  const errorMessage = error?.message || String(error) || 'An unexpected error occurred';
  console.error(`[${context}] Error:`, errorMessage, error);

  // Extract meaningful error message
  let title = 'Error';
  let message = errorMessage;

  // Handle specific error types
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    title = 'Network Error';
    message = 'Unable to connect. Please check your internet connection.';
  } else if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
    title = 'Authentication Error';
    message = 'Please log in again.';
  } else if (errorMessage.includes('permission') || errorMessage.includes('forbidden')) {
    title = 'Permission Denied';
    message = 'You do not have permission to perform this action.';
  } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    title = 'Not Found';
    message = 'The requested resource was not found.';
  } else if (errorMessage.includes('timeout')) {
    title = 'Request Timeout';
    message = 'The request took too long. Please try again.';
  } else if (errorMessage.includes('server') || errorMessage.includes('500')) {
    title = 'Server Error';
    message = 'Something went wrong on the server. Please try again later.';
  }

  showError(title, message, onDismiss);
};

/**
 * Log error with context
 * @param {string} context - Context string
 * @param {Error} error - Error object
 * @param {object} additionalData - Additional data to log
 */
export const logError = (context, error, additionalData = null) => {
  const errorInfo = {
    context,
    message: error?.message || String(error),
    stack: error?.stack,
    timestamp: new Date().toISOString(),
    ...additionalData,
  };

  console.error(`[${context}] Error:`, errorInfo);

  // In production, you could send this to an error tracking service
  // e.g., Sentry, LogRocket, etc.
};

/**
 * Show loading indicator
 * @param {string} message - Loading message
 */
export const showLoading = (message = 'Loading...') => {
  // This would typically show a modal with activity indicator
  console.log(`[Loading] ${message}`);
};

/**
 * Hide loading indicator
 */
export const hideLoading = () => {
  console.log('[Loading] Hidden');
};
