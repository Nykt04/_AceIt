# Error Handling & Notifications Guide

This document explains how to use the comprehensive error handling and notification system in Study Buddy App.

## Overview

The app includes:
- **Notification Service** - Centralized alerts and error messages
- **Error Boundary** - Global error catcher for React components
- **Custom Hooks** - Async operations with built-in error handling
- **Logging** - Consistent error logging across the app

---

## 1. Notification Service

Located in: `src/services/notificationService.js`

### Basic Notifications

```javascript
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo,
  showConfirm,
  handleError 
} from '../services/notificationService';

// Success notification
showSuccess('Success', 'Operation completed!');

// Error notification
showError('Error', 'Something went wrong');

// Warning notification
showWarning('Warning', 'Please review this action');

// Info notification
showInfo('Info', 'Here is some useful information');
```

### Confirmation Dialog

```javascript
showConfirm(
  'Confirm Delete',
  'Are you sure you want to delete this set?',
  () => {
    // Handle confirmation
    deleteSet();
  },
  () => {
    // Handle cancellation
    console.log('Cancelled');
  },
  'Delete',
  'Cancel'
);
```

### Global Error Handler

The `handleError()` function provides smart error handling based on error type:

```javascript
try {
  await someAsyncOperation();
} catch (error) {
  // Smart error detection and user-friendly messages
  handleError(error, 'ContextName');
}
```

It automatically detects:
- Network errors → "Unable to connect"
- Authentication errors → "Please log in again"
- Permission errors → "You don't have permission"
- Server errors → "Server error, try again later"
- Timeout errors → "Request took too long"

### Error Logging

```javascript
import { logError } from '../services/notificationService';

try {
  riskyOperation();
} catch (error) {
  logError('MyComponent', error, {
    userId: user.id,
    action: 'deleteSet',
  });
}
```

---

## 2. Error Boundary Component

Located in: `src/components/ErrorBoundary.js`

The app is wrapped with `<ErrorBoundary>` which catches unhandled React errors.

**Already wrapped in App.js:**
```javascript
<ErrorBoundary>
  <AuthProvider>
    <StudyProvider>
      <RootNavigator />
    </StudyProvider>
  </AuthProvider>
</ErrorBoundary>
```

**For wrapping specific sections:**
```javascript
import { ErrorBoundary } from '../components/ErrorBoundary';

function MyComponent() {
  return (
    <ErrorBoundary>
      <SomeRiskyComponent />
    </ErrorBoundary>
  );
}
```

---

## 3. Custom Hooks

Located in: `src/hooks/useAsync.js`

### useAsyncOperation

Handles async operations with automatic error handling:

```javascript
import { useAsyncOperation } from '../hooks/useAsync';

function MyComponent() {
  const { execute, loading, error, data } = useAsyncOperation(
    async (query) => {
      return await searchStudySets(query);
    },
    'SearchStudySets'
  );

  const handleSearch = async () => {
    try {
      const results = await execute(searchQuery);
      console.log('Results:', results);
    } catch (err) {
      // Error is automatically handled and displayed
    }
  };

  return (
    <TouchableOpacity onPress={handleSearch} disabled={loading}>
      <Text>{loading ? 'Searching...' : 'Search'}</Text>
    </TouchableOpacity>
  );
}
```

### useForm

Form state management with validation:

```javascript
import { useForm } from '../hooks/useAsync';

function LoginForm() {
  const { 
    values, 
    errors, 
    touched, 
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError
  } = useForm(
    { email: '', password: '' },
    async (values) => {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        throw new Error(error);
      }
    }
  );

  return (
    <View>
      <TextInput
        value={values.email}
        onChangeText={(text) => handleChange('email', text)}
        onBlur={() => handleBlur('email')}
      />
      {touched.email && errors.email && (
        <Text style={{ color: 'red' }}>{errors.email}</Text>
      )}
      
      <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
        <Text>{isSubmitting ? 'Loading...' : 'Sign In'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### useRetry

Automatic retry with exponential backoff:

```javascript
import { useRetry } from '../hooks/useAsync';

function FetchData() {
  const { execute, loading, retrying, retryCount } = useRetry(
    async () => {
      return await unstableApiCall();
    },
    {
      maxRetries: 3,
      delay: 1000,
      backoff: 2,
      context: 'UnstableAPI'
    }
  );

  return (
    <View>
      {retrying && <Text>Retrying (Attempt {retryCount + 1})...</Text>}
      <TouchableOpacity onPress={execute} disabled={loading}>
        <Text>{loading ? 'Loading...' : 'Fetch Data'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 4. Best Practices

### ✅ DO:

```javascript
// 1. Use try-catch with handleError
try {
  const data = await fetchData();
} catch (error) {
  handleError(error, 'FetchData');
}

// 2. Log important operations
console.log('[ComponentName] Starting operation...');

// 3. Provide context in error messages
logError('handleGenerate', error, {
  questionCount: 10,
  contentLength: 1000,
});

// 4. Use custom hooks for async operations
const { execute, loading } = useAsyncOperation(fetchData);

// 5. Show confirmations for destructive actions
showConfirm('Delete?', 'This cannot be undone', deleteHandler);
```

### ❌ DON'T:

```javascript
// 1. Ignore errors silently
try {
  await riskyOperation();
} catch (error) {
  // Don't do this!
}

// 2. Use generic error messages
Alert.alert('Error', 'Error'); // ❌

// 3. Log without context
console.error(error); // ❌

// 4. Let unhandled promises
fetch(url).then(res => res.json()); // ❌

// 5. Alert.alert for all errors
try {
  operation();
} catch (e) {
  Alert.alert('Error', e.message); // ❌ Use handleError instead
}
```

---

## 5. Example: Complete Error Handling

Here's a complete example from FileUploadQuestionsScreen:

```javascript
import { handleError, showSuccess, logError } from '../services/notificationService';

const handleGenerate = async () => {
  // Validation
  if (!fileContent.trim()) {
    handleError(
      new Error('Please upload a file or paste study material'),
      'FileUploadScreen'
    );
    return;
  }

  setLoading(true);
  try {
    // Log operation
    console.log('[FileUploadScreen] Starting question generation');
    
    // Execute operation
    const questions = await generateQuestionsFromText(fileContent, questionCount);

    // Check results
    if (!questions || questions.length === 0) {
      throw new Error('No questions could be generated');
    }

    // Save data
    await addStudySet({ questions });

    // Show success
    showSuccess('Questions Generated', `${questions.length} questions created!`);
    
    // Navigate
    navigation.navigate('SetDetail', { set: newSet });
    
  } catch (error) {
    // Comprehensive error handling
    logError('handleGenerate', error, {
      questionCount,
      contentLength: fileContent.length,
    });
    handleError(error, 'QuestionGeneration');
    
  } finally {
    setLoading(false);
  }
};
```

---

## 6. Testing Errors

To test error handling:

```javascript
// Simulate network error
const testNetworkError = async () => {
  try {
    throw new Error('Network connection failed');
  } catch (error) {
    handleError(error, 'TestNetworkError');
  }
};

// Simulate auth error
const testAuthError = async () => {
  try {
    throw new Error('Unauthorized access - authentication failed');
  } catch (error) {
    handleError(error, 'TestAuthError');
  }
};

// Simulate server error
const testServerError = async () => {
  try {
    throw new Error('500 Internal Server Error');
  } catch (error) {
    handleError(error, 'TestServerError');
  }
};
```

---

## 7. Error Types & Handling

| Error Type | Pattern | Handled As |
|---|---|---|
| Network | `network\|fetch` | "Network Error - check connection" |
| Auth | `auth\|unauthorized` | "Authentication Error - log in again" |
| Permission | `permission\|forbidden` | "Permission Denied" |
| Not Found | `not found\|404` | "Not Found" |
| Timeout | `timeout` | "Request Timeout - try again" |
| Server | `server\|500` | "Server Error - try later" |
| Other | Any other error | Display error message |

---

## Summary

The error handling system provides:
✅ Centralized notification management  
✅ Global error catching with ErrorBoundary  
✅ Smart error detection and user-friendly messages  
✅ Consistent logging across the app  
✅ Custom hooks for async operations  
✅ Automatic retry with exponential backoff  

Always use these tools to provide a great user experience!
