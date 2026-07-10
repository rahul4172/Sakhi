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

      profile = await profileRepository.create({ 
        sessionId: sessionId.toString(), 
        ...data,
        walletAddress: wallet.address,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        blockchainNetwork: blockchainService.getMode(),
        tokenBalance: 0,
        tokenHistory: [],
        currentScore: 0,
        scoreHistory: []
      });
      // Create default settings
      await settingsRepository.create({ userId: sessionId.toString() });
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
