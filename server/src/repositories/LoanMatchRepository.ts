import { BaseRepository } from './BaseRepository';
import LoanMatch, { ILoanMatch } from '../models/LoanMatch';

export class LoanMatchRepository extends BaseRepository<ILoanMatch> {
  constructor() {
    super(LoanMatch);
  }

  async findByUserId(userId: string): Promise<ILoanMatch[]> {
    return this.find({ userId });
  }
}

export const loanMatchRepository = new LoanMatchRepository();
