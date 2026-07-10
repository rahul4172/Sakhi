import { Request, Response } from 'express';
import { profileRepository } from '../repositories/ProfileRepository';
import { calculateSakhiScore } from '../utils/scoringEngine';
import { explainScore } from '../utils/aiExplanation';

export class ScoreController {
  async simulateScore(req: Request, res: Response) {
    try {
      const { sessionId, score, factors } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const profile = await profileRepository.findBySessionId(sessionId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      const isShgMember = profile.occupation === 'SHG member';
      
      // Calculate using the scoring engine utility
      const scoreData = calculateSakhiScore({
        savingsFreq: factors?.savingsFreq ?? 50,
        billPunctuality: factors?.billPunctuality ?? 50,
        incomeStability: factors?.incomeStability ?? 50,
        shgStreak: factors?.shgStreak ?? 50,
        trend: factors?.trend ?? 50,
        isShgMember
      });

      // Explain using AI explanation utility
      const explanation = await explainScore(scoreData, profile);

      // Return breakdown and explanation without mutating database score
      res.json({
        score: scoreData.score,
        breakdown: scoreData.breakdown,
        explanation
      });
    } catch (error: any) {
      console.error('Error simulating score:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const scoreController = new ScoreController();
