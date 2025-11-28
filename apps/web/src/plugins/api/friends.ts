import { handleApiError } from '../../utils/api-helpers.js';
import type { ProfileFriend } from './user.js';

/**
 * Response type for friend request actions
 */
export interface FriendRequestResponse {
  cleanedFriendshipRecord: ProfileFriend;
  message: string;
}

/**
 * Response type for delete/unblock actions
 */
export interface FriendDeleteResponse {
  message: string;
}

/**
 * Friends API Client
 *
 * Provides functions to interact with friendship endpoints.
 * All functions use credentials: 'include' for authentication.
 */
const FriendsAPI = {
  /**
   * Send a friend request to another user
   * @param nickname - The nickname of the user to send a friend request to
   * @returns Promise<FriendRequestResponse | null> - Response with friendship record and message
   */
  async sendFriendRequest(
    nickname: string
  ): Promise<FriendRequestResponse | null> {
    try {
      const response = await fetch(
        `/api/friends/${encodeURIComponent(nickname)}`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        await handleApiError(response);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  },

  /**
   * Accept a friend request from another user
   * @param nickname - The nickname of the user whose request to accept
   * @returns Promise<FriendRequestResponse | null> - Response with friendship record and message
   */
  async acceptFriendRequest(
    nickname: string
  ): Promise<FriendRequestResponse | null> {
    try {
      const response = await fetch(
        `/api/friends/${encodeURIComponent(nickname)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ accept: true }),
        }
      );

      if (!response.ok) {
        await handleApiError(response);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  /**
   * Reject a friend request from another user (blocks them)
   * @param nickname - The nickname of the user whose request to reject
   * @returns Promise<FriendRequestResponse | null> - Response with friendship record and message
   */
  async rejectFriendRequest(
    nickname: string
  ): Promise<FriendRequestResponse | null> {
    try {
      const response = await fetch(
        `/api/friends/${encodeURIComponent(nickname)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ accept: false }),
        }
      );

      if (!response.ok) {
        await handleApiError(response);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  },

  /**
   * Remove a friend or delete a friend request
   * Also used to unblock a user (removes REJECTED record)
   * @param nickname - The nickname of the user to remove/unblock
   * @returns Promise<FriendDeleteResponse | null> - Response with message
   */
  async removeFriend(nickname: string): Promise<FriendDeleteResponse | null> {
    try {
      const response = await fetch(
        `/api/friends/${encodeURIComponent(nickname)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        await handleApiError(response);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  /**
   * Unblock a user (alias for removeFriend - removes REJECTED record)
   * @param nickname - The nickname of the user to unblock
   * @returns Promise<FriendDeleteResponse | null> - Response with message
   */
  async unblockUser(nickname: string): Promise<FriendDeleteResponse | null> {
    // Unblocking uses the same DELETE endpoint
    return this.removeFriend(nickname);
  },
};

export default FriendsAPI;
