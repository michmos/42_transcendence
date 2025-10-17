import type { Group } from 'db/generated/client/index.js';
import Database from 'db';

export function getAllGroups(): Promise<Group[]> {
  return Database.group.findMany();
}

export function getGroup(uuid: string): Promise<Group | null> {
  return Database.group.findUnique({ where: { uuid } });
}

export function getGroupByOwner(ownerId: string): Promise<Group[]> {
  return Database.group.findMany({ where: { ownerId } });
}

export function getGroupByParticipant(uuid: string): Promise<Group[]> {
  return Database.group.findMany({
    where: { users: { some: { uuid } } },
  });
}

export async function removeGroup(uuid: string): Promise<Group> {
  return await Database.group.delete({ where: { uuid } });
}
