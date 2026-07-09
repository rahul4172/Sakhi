import { BaseRepository } from './BaseRepository';
import Transaction, { ITransaction } from '../models/Transaction';

export class TransactionRepository extends BaseRepository<ITransaction> {
  constructor() {
    super(Transaction);
  }

  async findByUserId(userId: string): Promise<ITransaction[]> {
    return this.find({ userId });
  }
}

export const transactionRepository = new TransactionRepository();
