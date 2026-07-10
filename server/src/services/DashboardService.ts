import { profileRepository } from '../repositories/ProfileRepository';
import { incomeRepository } from '../repositories/IncomeRepository';
import { expenseRepository } from '../repositories/ExpenseRepository';
import { billRepository } from '../repositories/BillRepository';
import { transactionRepository } from '../repositories/TransactionRepository';
import { blockchainService } from './blockchainService';
const { calculateSakhiScore } = require('../utils/scoringEngine');

export class DashboardService {
  async getDashboardData(userId: string) {
    const profile = await profileRepository.findBySessionId(userId);
    if (!profile) throw new Error('Profile not found');

    // Self-heal: Sync successful BBPS bill payments into the Expense ledger
    try {
      const Expense = require('../models/Expense').default;
      const Biller = require('../models/Biller').default;
      const userTransactions = await transactionRepository.findByUserId(userId);
      const successfulTxs = userTransactions.filter((tx: any) => tx.status === 'SUCCESS');

      for (const tx of successfulTxs) {
        const existingExpense = await Expense.findOne({
          userId,
          description: new RegExp(tx.transactionId)
        });

        if (!existingExpense) {
          const biller = await Biller.findOne({ billerId: tx.billerId });
          const category = biller ? biller.category : 'utility';
          const billerName = biller ? biller.name : 'Bill Payment';

          await Expense.create({
            userId,
            amount: tx.amount,
            category: category.toLowerCase(),
            description: `${billerName} (${tx.transactionId})`,
            date: tx.date || new Date()
          });
        }
      }
    } catch (err) {
      console.error('Error syncing successful transactions to expense ledger:', err);
    }

    const [incomes, expenses, bills, transactions] = await Promise.all([
      incomeRepository.findByUserId(userId),
      expenseRepository.findByUserId(userId),
      billRepository.findByUserId(userId),
      transactionRepository.findByUserId(userId)
    ]);

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalSavings = totalIncome - totalExpense;

    // Dynamically calculate real credit score from database records
    const isShgMember = profile.occupation === 'SHG member';
    
    // 1. Savings Consistency: based on number of income logs
    const savingsFreq = Math.min(100, incomes.length * 20);

    // 2. Bill Punctuality: based on payment history of bills
    let billPunctuality = 0; // default baseline if no bills exist
    if (bills && bills.length > 0) {
      let totalPayments = 0;
      let onTimePayments = 0;
      bills.forEach((b: any) => {
        if (b.paymentHistory) {
          b.paymentHistory.forEach((ph: any) => {
            totalPayments++;
            if (ph.wasOnTime) onTimePayments++;
          });
        }
      });
      if (totalPayments > 0) {
        billPunctuality = Math.round((onTimePayments / totalPayments) * 100);
      }
    }

    // 3. Income Stability: based on logging frequency
    const incomeStability = Math.min(100, incomes.length * 25);

    // 4. SHG Streak: group accountability streak (starts at 0)
    const shgStreak = 0;

    // 5. Savings Growth Trend: savings ratio
    const trend = totalIncome > totalExpense 
      ? Math.min(100, Math.round(((totalIncome - totalExpense) / (totalIncome || 1)) * 100))
      : 0; // Default to 0 instead of 30

    const scoreResult = calculateSakhiScore({
      savingsFreq,
      billPunctuality,
      incomeStability,
      shgStreak,
      trend,
      isShgMember
    });

    // Update profile score in database if it changed
    if (profile.currentScore !== scoreResult.score) {
      profile.currentScore = scoreResult.score;
      if (!profile.scoreHistory) profile.scoreHistory = [];
      profile.scoreHistory.push({ score: scoreResult.score, date: new Date() });
      await profile.save();
    }

    const categoryMap: Record<string, number> = {};
    expenses.forEach((exp: any) => {
      const cat = exp.category || 'Others';
      categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
    });
    const expenseBreakdown = Object.keys(categoryMap).map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: categoryMap[cat]
    }));




    // Merge incomes and expenses into a unified recent activity log, sorted by date descending
    const mergedActivity = [
      ...incomes.map(inc => ({
        type: 'INCOME',
        description: inc.source,
        amount: inc.amount,
        date: inc.date
      })),
      ...expenses.map(exp => ({
        type: 'EXPENSE',
        description: exp.description || exp.category,
        amount: exp.amount,
        date: exp.date
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return {
      profile,
      financials: {
        totalIncome,
        totalExpense,
        totalExpenses: totalExpense,
        totalSavings,
        expenseBreakdown
      },
      scoreFactors: {
        savingsFreq,
        billPunctuality,
        incomeStability,
        shgStreak,
        trend
      },
      recentActivity: mergedActivity
    };
  }
}

export const dashboardService = new DashboardService();
