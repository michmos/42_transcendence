import type { Group } from 'db/generated/client/index.js';
import Database from 'db';

export const GroupDatabase = {
  getAllGroups(): Promise<Group[]> {
    return Database.group.findMany();
  },

  getGroup(uuid: string): Promise<Group | null> {
    return Database.group.findUnique({ where: { uuid } });
  },

  getGroupByOwner(ownerId: string): Promise<Group[]> {
    return Database.group.findMany({ where: { ownerId } });
  },

  getGroupByParticipant(uuid: string): Promise<Group[]> {
    return Database.group.findMany({
      where: { users: { some: { uuid } } },
    });
  },

  async removeGroup(uuid: string): Promise<Group> {
    const group = await Database.group.findUnique({
      where: { uuid },
    });
    if (!group) {
      throw new Error('Group not found');
    }
    await Database.group.delete({ where: { uuid } });
    return group;
  },
};
