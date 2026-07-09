import { Request, Response } from 'express';
import { dashboardService } from '../services/DashboardService';

export class DashboardController {
  async getDashboard(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });
      
      const data = await dashboardService.getDashboardData(sessionId);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const dashboardController = new DashboardController();
