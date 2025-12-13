import type { User } from 'db/generated/client/index.js';
import { handleApiError } from '../../utils/api-helpers.js';

// Profile API response types
export interface ProfileMatch {
  date: string;
  score1: number;
  score2: number;
  player1: string;
  player2: string;
  result: 'WON' | 'LOST';
  gameType: string;
}

export interface ProfileFriend {
  otherUser: string;
  avatar: string | null;
  state: 'REQUESTED' | 'ACCEPTED' | 'REJECTED';
  isRequester: boolean;
  isOnline: boolean;
}

export interface UserProfileData {
  cleanedUserData: Partial<User>;
  cleanedUserFriends: ProfileFriend[];
  userMatches: ProfileMatch[];
}

// Provide functions to GET, POST, DELETE users from /api/user
const UserAPI = {
  async getMe(): Promise<Partial<User> | null> {
    try {
      const response = await fetch('/api/user/me', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        console.error(
          `[getMe] Error ${response.status}: Failed to fetch user data`
        );
        throw new Error('Failed to fetch user data');
      }

      const res = (await response.json()) as Partial<User>;

      // Check if response has required fields
      if (!res['nickname'] || !res.uuid) {
        return null;
      }

      return res;
    } catch (error) {
      console.error('[getMe] ❌ Network/parse error:', error);
      return null;
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      if (response.status === 401) {
        throw new Error('Unauthorized');
      }

      const res = (await response.json()) as User[];
      return res;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  /**
   * Get user by nickname (exact match)
   * @param nickname - The nickname to search for
   * @returns Promise<User | null> - User data or null if not found
   */
  async getUserByNickname(nickname: string): Promise<Partial<User> | null> {
    try {
      const response = await fetch(
        `/api/user/${encodeURIComponent(nickname)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        await handleApiError(response);
        return null;
      }

      return (await response.json()) as Partial<User>;
    } catch (error) {
      console.error('Error fetching user by nickname:', error);
      return null;
    }
  },

  async getUserById(uuid: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/user/${uuid}`);
      if (response.status === 404) {
        return null;
      }
      return (await response.json()) as User;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  /**
   * Get current user's profile data including user info, friends, and match history
   * @returns Promise<UserProfileData | null> - Profile data or null if error/unauthorized
   */
  async getUserProfile(): Promise<UserProfileData | null> {
    // Wait a bit for cookies to be available after OAuth redirect
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const response = await fetch('/api/user/me/dashboard', {
        method: 'GET',
        credentials: 'include',
      });

      // Handle 401 gracefully without redirecting (let route handle it)
      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        // Extract error message for logging
        let errorMessage = 'Failed to fetch user profile';
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
        console.error(
          `[getUserProfile] Error ${response.status}:`,
          errorMessage
        );
        return null;
      }

      const data = (await response.json()) as UserProfileData;
      return data;
    } catch (error) {
      console.error('[getUserProfile] Network error:', error);
      return null;
    }
  },

  /**
   * Update user nickname
   * @param newNickname - New nickname (3-30 characters, alphanumeric, underscores, hyphens)
   * @returns Promise<Partial<User> | null>
   */
  async updateNickname(newNickname: string): Promise<Partial<User> | null> {
    try {
      const response = await fetch('/api/user/me/nickname', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newNickname }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          Error?: string;
        };
        throw new Error(
          errorData.Error || `Failed to update nickname: ${response.status}`
        );
      }

      return (await response.json()) as Partial<User>;
    } catch (error) {
      console.error('Error updating nickname:', error);
      throw error;
    }
  },

  /**
   * Upload user avatar
   * @param file - Image file (PNG/JPEG, max 2MB)
   * @returns Promise<string | null> - Avatar URL or null if error
   */
  async uploadAvatar(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/me/avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          Error?: string;
        };
        throw new Error(
          errorData.Error || `Failed to upload avatar: ${response.status}`
        );
      }

      const result = (await response.json()) as { avatar?: string | null };
      // API returns a cleaned user object with avatar property
      // Return the avatar path (which is the relative path like /userAvatars/xxx.png)
      return result?.avatar || null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },
};

export default UserAPI;
