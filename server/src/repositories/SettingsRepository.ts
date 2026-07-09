import { BaseRepository } from './BaseRepository';
import Settings, { ISettings } from '../models/Settings';

export class SettingsRepository extends BaseRepository<ISettings> {
  constructor() {
    super(Settings);
  }

  async findByUserId(userId: string): Promise<ISettings | null> {
    return this.findOne({ userId });
  }
}

export const settingsRepository = new SettingsRepository();
