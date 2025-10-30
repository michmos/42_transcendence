import type { User } from 'db/generated/client/index.js';

// Provide functions to GET, POST, DELETE users from /api/user
const UserAPI = {
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

      const res = await response.json();
      return res;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

  async getUserById(uuid: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/user/${uuid}`);
      if (response.status === 404) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  },

  async generateUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `user${Math.floor(Math.random() * 1000)}@example.com`,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  },

  // TODO: @mlubber can you add your fancy code here who checks everthing for delete before deleting?
  async deleteUser(uuid: string): Promise<boolean> {
    try {
      const response = await fetch('/api/user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
      });
      await response.json();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  },
};

export default UserAPI;
