import { incomeRepository } from '../repositories/IncomeRepository';
import { expenseRepository } from '../repositories/ExpenseRepository';

export class FinancialService {
  async addIncome(userId: string, data: any) {
    return incomeRepository.create({ userId, ...data });
  }

  async getIncome(userId: string) {
    return incomeRepository.findByUserId(userId);
  }

  async addExpense(userId: string, data: any) {
    return expenseRepository.create({ userId, ...data });
  }

  async getExpenses(userId: string) {
    return expenseRepository.findByUserId(userId);
  }
}

export const financialService = new FinancialService();
