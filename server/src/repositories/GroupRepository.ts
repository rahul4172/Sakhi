import { BaseRepository } from './BaseRepository';
import Group, { IGroup } from '../models/Group';
import mongoose from 'mongoose';

export class GroupRepository extends BaseRepository<IGroup> {
  constructor() {
    super(Group);
  }

  async findByMemberId(profileId: string | mongoose.Types.ObjectId): Promise<IGroup | null> {
    return this.findOne({ 'members.profileId': profileId });
  }
}

export const groupRepository = new GroupRepository();
