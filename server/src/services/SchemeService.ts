import { schemeRepository } from '../repositories/SchemeRepository';
import { loanMatchRepository } from '../repositories/LoanMatchRepository';
import { profileRepository } from '../repositories/ProfileRepository';
import mongoose from 'mongoose';

export class SchemeService {
  async getSchemes() {
    return schemeRepository.find();
  }

  async getLoanMatches(userId: string) {
    const profile = await profileRepository.findBySessionId(userId);
    if (!profile) throw new Error('Profile not found');

    let matches = await loanMatchRepository.findByUserId(userId);
    
    // If no matches exist, seed some logic based matches
    if (matches.length === 0) {
      const schemes = await schemeRepository.find();
      for (const scheme of schemes) {
        // Simple logic for matching score
        let score = 50 + (profile.currentScore / 10);
        if (scheme.eligibility.includes(profile.occupation)) score += 20;
        
        await loanMatchRepository.create({
          userId,
          schemeId: scheme._id as mongoose.Types.ObjectId,
          matchScore: Math.min(100, score),
          status: score > 70 ? 'ELIGIBLE' : 'NOT_ELIGIBLE'
        });
      }
      matches = await loanMatchRepository.findByUserId(userId);
    }

    // Populate schemes
    return Promise.all(matches.map(async m => {
      const scheme = await schemeRepository.findById(m.schemeId.toString());
      return { ...m.toObject(), scheme };
    }));
  }
}

export const schemeService = new SchemeService();
