/**
 * Notification Deduplication Utility
 *
 * Prevents showing duplicate notifications within a time window.
 * This is especially useful for socket events that might be received
 * multiple times due to multiple handlers or room memberships.
 */

const recentNotifications = new Map<string, number>();
const NOTIFICATION_DEDUP_WINDOW = 2000; // 2 seconds

/**
 * Check if a notification should be shown (not a duplicate)
 * @param message - The notification message
 * @returns true if the notification should be shown, false if it's a duplicate
 */
export function shouldShowNotification(message: string): boolean {
  const now = Date.now();
  const messageKey = message;

  // Check if we've shown this message recently
  const lastShown = recentNotifications.get(messageKey);
  if (lastShown && now - lastShown < NOTIFICATION_DEDUP_WINDOW) {
    return false; // Skip duplicate
  }

  // Record timestamp
  recentNotifications.set(messageKey, now);

  // Clean up old entries periodically
  if (recentNotifications.size > 100) {
    const cutoff = now - NOTIFICATION_DEDUP_WINDOW * 10;
    for (const [key, timestamp] of recentNotifications.entries()) {
      if (timestamp < cutoff) {
        recentNotifications.delete(key);
      }
    }
  }

  return true;
}
