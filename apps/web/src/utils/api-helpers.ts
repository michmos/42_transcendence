import { createToast } from './toast.js';

export interface ApiErrorOptions {
  message: string;
  status?: number;
  shouldRedirect?: boolean;
}

export function showApiError(options: ApiErrorOptions): void {
  console.error('API Error:', options);
  createToast(options.message, 'error');

  if (options.shouldRedirect) {
    // Handle redirect if needed
  }
}
