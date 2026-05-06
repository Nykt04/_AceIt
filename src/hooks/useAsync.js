import { useState, useCallback } from 'react';
import { handleError, logError } from '../services/notificationService';

/**
 * Custom hook for async operations with error handling
 * @param {Function} asyncFunction - The async function to execute
 * @param {string} context - Context for error logging
 * @returns {Object} { execute, loading, error, data }
 */
export const useAsyncOperation = (asyncFunction, context = 'AsyncOperation') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        console.log(`[${context}] Starting operation...`);

        const result = await asyncFunction(...args);
        setData(result);

        console.log(`[${context}] Operation completed successfully`);
        return result;
      } catch (err) {
        logError(context, err, { args });
        setError(err);
        handleError(err, context);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction, context]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return { execute, loading, error, data, reset };
};

/**
 * Custom hook for managing form state with validation
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and handlers
 */
export const useForm = (initialValues, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }, [touched]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      if (e?.preventDefault) e.preventDefault();

      try {
        setIsSubmitting(true);
        setErrors({});
        console.log('[useForm] Submitting form...');

        await onSubmit(values);
        console.log('[useForm] Form submitted successfully');
      } catch (error) {
        logError('useForm', error, { values });
        if (error.validationErrors) {
          setErrors(error.validationErrors);
        } else {
          handleError(error, 'FormSubmission');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const setFieldError = useCallback((field, error) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldError,
    setValues,
  };
};

/**
 * Custom hook for retry logic
 * @param {Function} asyncFunction - The async function to retry
 * @param {Object} options - Retry options
 * @returns {Object} { execute, loading, error, retrying, retryCount }
 */
export const useRetry = (
  asyncFunction,
  options = {
    maxRetries: 3,
    delay: 1000,
    backoff: 1.5,
    context: 'Retry',
  }
) => {
  const { maxRetries = 3, delay = 1000, backoff = 1.5, context = 'Retry' } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  const execute = useCallback(
    async (...args) => {
      let lastError = null;
      let currentDelay = delay;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setLoading(true);
          setError(null);
          setRetrying(attempt > 0);

          console.log(
            `[${context}] Attempt ${attempt + 1}/${maxRetries + 1}...`
          );

          const result = await asyncFunction(...args);
          setRetryCount(0);
          console.log(`[${context}] Operation succeeded on attempt ${attempt + 1}`);
          return result;
        } catch (err) {
          lastError = err;
          console.error(`[${context}] Attempt ${attempt + 1} failed:`, err.message);

          if (attempt < maxRetries) {
            console.log(`[${context}] Retrying in ${currentDelay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, currentDelay));
            currentDelay *= backoff;
          }
        }
      }

      // All retries exhausted
      logError(context, lastError, {
        attempts: maxRetries + 1,
        args,
      });
      setError(lastError);
      handleError(lastError, `${context} (After ${maxRetries + 1} retries)`);
      throw lastError;
    },
    [asyncFunction, maxRetries, delay, backoff, context]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setRetryCount(0);
    setRetrying(false);
  }, []);

  return { execute, loading, error, retrying, retryCount, reset };
};
