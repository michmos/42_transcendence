/**
 * Auth State Management
 * Manages current user session state
 */

import type { Session } from '../plugins/api/auth.js';

let currentSession: Session | null = null;

/**
 * Get current session from memory
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function getCurrentSession(): Promise<Session | null> {
  return currentSession;
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
  return currentSession !== null;
}

/**
 * Get current user UUID
 */
export function getCurrentUserId(): string | null {
  return currentSession?.uuid || null;
}

/**
 * Set current session
 */
export function setSession(session: Session | null): void {
  currentSession = session;
}

/**
 * Clear current session
 */
export function clearSession(): void {
  currentSession = null;
}
