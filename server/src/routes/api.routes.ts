import { Router } from 'express';
import { dashboardController } from '../controllers/DashboardController';
import { profileController } from '../controllers/ProfileController';
import { financialController } from '../controllers/FinancialController';
import { scoreController } from '../controllers/ScoreController';
import { rewardController } from '../controllers/RewardController';
import { literacyController } from '../controllers/LiteracyController';
import authRoutes from './auth.routes';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Auth (Unprotected)
router.use('/auth', authRoutes);

// Protect all subsequent API endpoints
router.use(requireAuth);

// Profile
router.post('/profile', profileController.createProfile.bind(profileController));
router.get('/profile/:sessionId', profileController.getProfile.bind(profileController));

// Dashboard
router.get('/dashboard/:sessionId', dashboardController.getDashboard.bind(dashboardController));

// Financials
router.get('/income/:sessionId', financialController.getIncome.bind(financialController));
router.post('/income/:sessionId', financialController.addIncome.bind(financialController));

router.get('/expenses/:sessionId', financialController.getExpenses.bind(financialController));
router.post('/expenses/:sessionId', financialController.addExpense.bind(financialController));

router.get('/schemes', financialController.getSchemes.bind(financialController));
router.get('/loan-matches/:sessionId', financialController.getLoanMatches.bind(financialController));

// Score Simulator
router.post('/score/simulate', scoreController.simulateScore.bind(scoreController));

// Rewards
router.get('/rewards/:sessionId', rewardController.getRewardBalance.bind(rewardController));
router.post('/rewards/earn/:sessionId', rewardController.earnTokens.bind(rewardController));
router.post('/rewards/redeem/:sessionId', rewardController.redeemReward.bind(rewardController));

// Literacy AI Assistant
router.post('/literacy/chat', literacyController.handleChat.bind(literacyController));

export default router;
