import { profileRepository } from '../repositories/ProfileRepository';
import { settingsRepository } from '../repositories/SettingsRepository';
import { blockchainService } from './blockchainService';

export class ProfileService {
  async createOrUpdateProfile(sessionId: string, data: { name: string, occupation: any }) {
    let profile = await profileRepository.findBySessionId(sessionId);
    if (profile) {
      await profileRepository.update({ sessionId }, data);
      return profileRepository.findBySessionId(sessionId);
    } else {
      // Generate custodial blockchain wallet
      const wallet = blockchainService.generateUserWallet();

      // Execute real on-chain minting for welcome reward
      const txResult = await blockchainService.earnTokens(
        wallet.address,
        100,
        'Profile Setup Bonus'
      );

      const historyItem = {
        amount: 100,
        type: 'earn' as const,
        description: 'Profile Setup Bonus',
        date: new Date(),
        transactionHash: txResult.transactionHash || undefined,
        status: txResult.status,
        error: txResult.error
      };

      profile = await profileRepository.create({ 
        sessionId, 
        ...data,
        walletAddress: wallet.address,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        blockchainNetwork: blockchainService.getMode(),
        tokenBalance: txResult.status === 'success' ? 100 : 0,
        tokenHistory: [historyItem]
      });
      // Create default settings
      await settingsRepository.create({ userId: sessionId });
      return profile;
    }
  }

  async getProfile(sessionId: string) {
    const profile = await profileRepository.findBySessionId(sessionId);
    if (!profile) throw new Error('Profile not found');
    
    const settings = await settingsRepository.findByUserId(sessionId);
    
    return { profile, settings };
  }
}

export const profileService = new ProfileService();
