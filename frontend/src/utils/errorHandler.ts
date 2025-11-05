import { ApiError } from '../services/api';

export interface ErrorNotification {
  message: string;
  type: 'error' | 'warning' | 'info';
  details?: any;
}

export class ErrorHandler {
  private static listeners: Array<(notification: ErrorNotification) => void> = [];

  static subscribe(listener: (notification: ErrorNotification) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  static notify(notification: ErrorNotification): void {
    this.listeners.forEach(listener => listener(notification));
  }

  static handleError(error: unknown, context?: string): void {
    console.error(`[Error Handler${context ? ` - ${context}` : ''}]`, error);

    let message = 'An unexpected error occurred';
    let details: any = undefined;

    if (error instanceof ApiError) {
      message = error.message;
      details = error.details;

      // Provide more specific messages based on status code
      switch (error.statusCode) {
        case 400:
          message = error.message || 'Invalid request. Please check your input.';
          break;
        case 404:
          message = error.message || 'The requested resource was not found.';
          break;
        case 409:
          message = error.message || 'A conflict occurred. Please check for duplicates.';
          break;
        case 500:
          message = error.message || 'Server error. Please try again later.';
          break;
        case 0:
          message = 'Network error. Please check your connection.';
          break;
      }
    } else if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    this.notify({
      message,
      type: 'error',
      details,
    });
  }

  static handleSuccess(message: string): void {
    this.notify({
      message,
      type: 'info',
    });
  }

  static handleWarning(message: string): void {
    this.notify({
      message,
      type: 'warning',
    });
  }
}

// Utility function for wrapping async operations with error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    ErrorHandler.handleError(error, context);
    return null;
  }
}

// Utility function for wrapping async operations with loading state
export async function withLoadingAndError<T>(
  operation: () => Promise<T>,
  loadingCallback: (loading: boolean) => void,
  context?: string
): Promise<T | null> {
  try {
    loadingCallback(true);
    const result = await operation();
    return result;
  } catch (error) {
    ErrorHandler.handleError(error, context);
    return null;
  } finally {
    loadingCallback(false);
  }
}

// Convenience functions
export function showError(error: unknown, context?: string): void {
  ErrorHandler.handleError(error, context);
}

export function showSuccess(message: string): void {
  ErrorHandler.handleSuccess(message);
}

export function showWarning(message: string): void {
  ErrorHandler.handleWarning(message);
}
