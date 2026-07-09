import { BaseRepository } from './BaseRepository';
import Profile, { IProfile } from '../models/Profile';

export class ProfileRepository extends BaseRepository<IProfile> {
  constructor() {
    super(Profile);
  }

  async findBySessionId(sessionId: string): Promise<IProfile | null> {
    return this.findOne({ sessionId });
  }
}

export const profileRepository = new ProfileRepository();
