import { Request, Response } from 'express';
import { dashboardService } from '../services/DashboardService';

export class DashboardController {
  async getDashboard(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });

      // Enforce session ownership: authenticated user may only access their own dashboard
      const authUser = (req as any).user;
      if (authUser && authUser.sessionId !== sessionId) {
        return res.status(403).json({ error: 'Access forbidden: session mismatch' });
      }

      const data = await dashboardService.getDashboardData(sessionId as string);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const dashboardController = new DashboardController();
