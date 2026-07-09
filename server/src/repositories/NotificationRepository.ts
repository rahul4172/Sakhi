import { BaseRepository } from './BaseRepository';
import Notification, { INotification } from '../models/Notification';

export class NotificationRepository extends BaseRepository<INotification> {
  constructor() {
    super(Notification);
  }

  async findByUserId(userId: string): Promise<INotification[]> {
    return this.find({ userId });
  }
}

export const notificationRepository = new NotificationRepository();
