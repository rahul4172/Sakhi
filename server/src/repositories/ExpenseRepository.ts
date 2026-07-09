import { BaseRepository } from './BaseRepository';
import Expense, { IExpense } from '../models/Expense';

export class ExpenseRepository extends BaseRepository<IExpense> {
  constructor() {
    super(Expense);
  }

  async findByUserId(userId: string): Promise<IExpense[]> {
    return this.find({ userId });
  }
}

export const expenseRepository = new ExpenseRepository();
