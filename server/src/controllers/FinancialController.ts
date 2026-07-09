import { Request, Response } from 'express';
import { financialService } from '../services/FinancialService';
import { schemeService } from '../services/SchemeService';

export class FinancialController {
  async addIncome(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const income = await financialService.addIncome(sessionId, req.body);
      res.status(201).json(income);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getIncome(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const income = await financialService.getIncome(sessionId);
      res.json(income);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async addExpense(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const expense = await financialService.addExpense(sessionId, req.body);
      res.status(201).json(expense);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getExpenses(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const expenses = await financialService.getExpenses(sessionId);
      res.json(expenses);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getSchemes(req: Request, res: Response) {
    try {
      const schemes = await schemeService.getSchemes();
      res.json(schemes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getLoanMatches(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const matches = await schemeService.getLoanMatches(sessionId);
      res.json(matches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const financialController = new FinancialController();
