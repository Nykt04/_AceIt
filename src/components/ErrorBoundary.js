import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { logError } from '../services/notificationService';

/**
 * Error Boundary Component
 * Catches unhandled errors in child components
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    logError('ErrorBoundary', error, {
      componentStack: errorInfo.componentStack,
      errorCount: this.state.errorCount + 1,
    });

    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error Info:', errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.errorContent}>
              <Text style={styles.errorTitle}>Oops! Something went wrong</Text>

              <View style={styles.errorBox}>
                <Text style={styles.errorLabel}>Error:</Text>
                <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text>
              </View>

              {this.state.errorInfo && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorLabel}>Details:</Text>
                  <Text style={styles.errorDetails}>{this.state.errorInfo.componentStack}</Text>
                </View>
              )}

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonPrimary]}
                  onPress={this.handleReset}
                >
                  <Text style={styles.buttonText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonSecondary]}
                  onPress={() => {
                    // Reload the app or navigate home
                    console.log('[ErrorBoundary] User requested refresh');
                  }}
                >
                  <Text style={styles.buttonTextSecondary}>Go Home</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.supportText}>
                If this problem persists, please contact support.
              </Text>
            </View>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#e2e8f0',
    fontFamily: 'monospace',
  },
  errorDetails: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
  },
  buttonSecondary: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  supportText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
