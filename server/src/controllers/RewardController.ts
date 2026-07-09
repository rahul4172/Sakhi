import { Request, Response } from 'express';
import { profileRepository } from '../repositories/ProfileRepository';
import { blockchainService } from '../services/blockchainService';

export class RewardController {
  async getRewardBalance(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId as string;
      const profile = await profileRepository.findBySessionId(sessionId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Self-heal: Generate wallet if legacy user
      if (!profile.walletAddress) {
        const wallet = blockchainService.generateUserWallet();
        profile.walletAddress = wallet.address;
        profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
        profile.blockchainNetwork = blockchainService.getMode();
        await profile.save();
      }

      // Sync balance with blockchain
      const chainBalance = await blockchainService.getSakhiBalance(profile.walletAddress);
      if (profile.tokenBalance !== chainBalance) {
        profile.tokenBalance = chainBalance;
        await profile.save();
      }

      res.json({
        tokenBalance: profile.tokenBalance,
        tokenHistory: profile.tokenHistory ?? [],
        walletAddress: profile.walletAddress,
        blockchainNetwork: profile.blockchainNetwork
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async earnTokens(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId as string;
      const { amount, description } = req.body;

      if (!sessionId || amount === undefined || !description) {
        return res.status(400).json({ error: 'sessionId, amount, and description are required' });
      }

      const profile = await profileRepository.findBySessionId(sessionId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Self-heal: Generate wallet if legacy user
      if (!profile.walletAddress) {
        const wallet = blockchainService.generateUserWallet();
        profile.walletAddress = wallet.address;
        profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
        profile.blockchainNetwork = blockchainService.getMode();
        await profile.save();
      }

      // Execute on-chain minting
      const txResult = await blockchainService.earnTokens(
        profile.walletAddress,
        Number(amount),
        description
      );

      // Log transaction history
      if (!profile.tokenHistory) profile.tokenHistory = [];
      profile.tokenHistory.push({
        amount: Number(amount),
        type: 'earn',
        description,
        date: new Date(),
        transactionHash: txResult.transactionHash,
        status: txResult.status,
        error: txResult.error
      });

      // Update cached balance if successful
      if (txResult.status === 'success') {
        profile.tokenBalance = (profile.tokenBalance ?? 0) + Number(amount);
      }

      await profile.save();

      res.json({
        success: txResult.status === 'success',
        tokenBalance: profile.tokenBalance,
        tokenHistory: profile.tokenHistory,
        transactionHash: txResult.transactionHash,
        error: txResult.error
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async redeemReward(req: Request, res: Response) {
    try {
      const sessionId = req.params.sessionId as string;
      const { rewardId, cost, label } = req.body;

      if (!sessionId || !rewardId || cost === undefined || !label) {
        return res.status(400).json({ error: 'sessionId, rewardId, cost, and label are required' });
      }

      const profile = await profileRepository.findBySessionId(sessionId);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Self-heal: Generate wallet if legacy user
      if (!profile.walletAddress) {
        const wallet = blockchainService.generateUserWallet();
        profile.walletAddress = wallet.address;
        profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
        profile.blockchainNetwork = blockchainService.getMode();
        await profile.save();
      }

      const balance = profile.tokenBalance ?? 0;
      if (balance < cost) {
        return res.status(400).json({ error: 'Insufficient token balance' });
      }

      // Execute on-chain burn
      const txResult = await blockchainService.redeemTokens(
        profile.walletAddress,
        Number(cost),
        label
      );

      if (txResult.status === 'failed') {
        return res.status(500).json({
          error: 'On-chain redemption failed',
          transactionHash: txResult.transactionHash,
          details: txResult.error
        });
      }

      // Update balance & log history
      profile.tokenBalance = balance - cost;
      if (!profile.tokenHistory) profile.tokenHistory = [];
      profile.tokenHistory.push({
        amount: cost,
        type: 'redeem',
        description: `Redeemed: ${label}`,
        date: new Date(),
        transactionHash: txResult.transactionHash,
        status: 'success'
      });

      // Special action: if the reward is a "Trust Score Boost" (rewardId: 'trust_boost'), increase profile's currentScore by 5
      if (rewardId === 'trust_boost') {
        profile.currentScore = (profile.currentScore ?? 0) + 5;
        if (!profile.scoreHistory) profile.scoreHistory = [];
        profile.scoreHistory.push({
          score: profile.currentScore,
          date: new Date()
        });
      }

      await profile.save();

      res.json({
        success: true,
        tokenBalance: profile.tokenBalance,
        tokenHistory: profile.tokenHistory,
        newScore: profile.currentScore,
        transactionHash: txResult.transactionHash
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const rewardController = new RewardController();
