import { BaseRepository } from './BaseRepository';
import Income, { IIncome } from '../models/Income';

export class IncomeRepository extends BaseRepository<IIncome> {
  constructor() {
    super(Income);
  }

  async findByUserId(userId: string): Promise<IIncome[]> {
    return this.find({ userId });
  }
}

export const incomeRepository = new IncomeRepository();
