import { BaseRepository } from './BaseRepository';
import Bill, { IBill } from '../models/Bill';

export class BillRepository extends BaseRepository<IBill> {
  constructor() {
    super(Bill);
  }

  async findByUserId(userId: string): Promise<IBill[]> {
    return this.find({ userId });
  }
}

export const billRepository = new BillRepository();
