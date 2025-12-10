import { navigateTo } from './navigation.js';
import { createToast } from './toast.js';

/**
 * API Error Response Structure
 */
export interface ApiError {
  message: string;
  status: number;
  shouldRedirect?: boolean;
  redirectPath?: string;
}

/**
 * Handles API errors consistently across the application
 *
 * @param response - Fetch Response object
 * @returns Promise<ApiError> - Structured error object
 */
export async function handleApiError(response: Response): Promise<ApiError> {
  const status = response.status;
  let errorMessage = 'An error occurred';
  let shouldRedirect = false;
  let redirectPath: string | undefined;

  // Try to extract error message from response body
  try {
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (errorData.error && typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    }
  } catch {
    // If parsing fails, use default message
  }

  // Map status codes to user-friendly messages and actions
  switch (status) {
    case 401:
      errorMessage = 'Please log in to continue';
      shouldRedirect = true;
      redirectPath = '/login';
      break;

    case 403:
      errorMessage =
        errorMessage !== 'An error occurred'
          ? errorMessage
          : "You don't have access to this resource";
      shouldRedirect = false;
      break;

    case 404:
      errorMessage =
        errorMessage !== 'An error occurred'
          ? errorMessage
          : 'Resource not found';
      shouldRedirect = false;
      break;

    case 422:
      // Validation error - use message from response
      errorMessage =
        errorMessage !== 'An error occurred'
          ? errorMessage
          : 'Validation error - Please check your input';
      shouldRedirect = false;
      break;

    case 500:
      errorMessage = 'Server error. Please try again later';
      shouldRedirect = false;
      break;

    default:
      errorMessage = `Error ${status}: ${errorMessage}`;
      shouldRedirect = false;
  }

  const error: ApiError = {
    message: errorMessage,
    status,
    shouldRedirect,
    ...(redirectPath && { redirectPath }),
  };

  // Auto-redirect if needed
  if (shouldRedirect && redirectPath) {
    navigateTo(redirectPath);
  }

  return error;
}

/**
 * Handles network errors (no response from server)
 *
 * @returns ApiError - Structured error object for network errors
 */
export function handleNetworkError(): ApiError {
  return {
    message: 'Network error. Please check your connection.',
    status: 0,
    shouldRedirect: false,
  };
}

/**
 * Shows an error message to the user using toast notifications
 *
 * @param error - ApiError object
 */
export function showApiError(error: ApiError): void {
  console.error(`API Error [${error.status}]:`, error.message);
  createToast(error.message, 'error');
}

/**
 * Helper function to handle fetch errors (both network and API errors)
 *
 * @param response - Fetch Response object (may be undefined for network errors)
 * @returns Promise<ApiError> - Structured error object
 */
export async function handleFetchError(response?: Response): Promise<ApiError> {
  if (!response) {
    return handleNetworkError();
  }
  return handleApiError(response);
}
