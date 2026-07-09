import { schemeRepository } from '../repositories/SchemeRepository';
import { profileRepository } from '../repositories/ProfileRepository';

const DEFAULT_SCHEMES = [
  {
    title: 'Pradhan Mantri Mudra Yojana - Shishu',
    provider: 'Government of India / Banks',
    type: 'Micro-loan',
    description: 'Collateral-free loans for starting a small business (e.g. tailor, salon, retail, beauty).',
    eligibility: ['beauty', 'tailoring', 'retail'],
    maxAmount: 50000,
    minScore: 0,
    interestRate: 8.5
  },
  {
    title: 'Pradhan Mantri Mudra Yojana - Kishore',
    provider: 'Government of India / Banks',
    type: 'Business Loan',
    description: 'Working capital and machinery loans for expanding established women-led micro-enterprises.',
    eligibility: ['beauty', 'tailoring', 'retail', 'services'],
    maxAmount: 500000,
    minScore: 30,
    interestRate: 9.2
  },
  {
    title: 'Lakhpati Didi Scheme Support',
    provider: 'National Rural Livelihoods Mission',
    type: 'SHG Loan',
    description: 'Special financial assistance and training for rural women in Self-Help Groups (SHGs) to earn sustainable livelihoods.',
    eligibility: ['shg_member', 'farming', 'crafts'],
    maxAmount: 100000,
    minScore: 40,
    interestRate: 7.0
  },
  {
    title: 'Mahila Udyam Nidhi Scheme',
    provider: 'SIDBI',
    type: 'Equity Assistance',
    description: 'Soft loans for women entrepreneurs setting up new tiny and micro-enterprises in services or manufacturing sectors.',
    eligibility: ['retail', 'services', 'beauty', 'tailoring'],
    maxAmount: 1000000,
    minScore: 50,
    interestRate: 8.0
  },
  {
    title: 'Stand-Up India Scheme',
    provider: 'SIDBI / Scheduled Commercial Banks',
    type: 'Business Expansion',
    description: 'Loans between ₹10 Lakhs and ₹1 Crore for setting up greenfield enterprises by women or SC/ST entrepreneurs.',
    eligibility: ['manufacturing', 'retail', 'services'],
    maxAmount: 10000000,
    minScore: 60,
    interestRate: 9.5
  }
];

export class SchemeService {
  async getSchemes() {
    const list = await schemeRepository.find();
    if (list.length === 0) {
      for (const scheme of DEFAULT_SCHEMES) {
        await schemeRepository.create(scheme as any);
      }
      return schemeRepository.find();
    }
    return list;
  }

  async getLoanMatches(userId: string) {
    const profile = await profileRepository.findBySessionId(userId);
    if (!profile) throw new Error('Profile not found');

    const list = await schemeRepository.find();
    if (list.length === 0) {
      for (const scheme of DEFAULT_SCHEMES) {
        await schemeRepository.create(scheme as any);
      }
    }

    const schemes = await schemeRepository.find();
    const currentScore = profile.currentScore || 0;

    const eligible = [];
    const ineligible = [];

    for (const s of schemes) {
      const formatted = {
        id: s._id.toString(),
        name: s.title,
        provider: s.provider,
        type: s.type,
        description: s.description,
        amount: `₹${s.maxAmount.toLocaleString('en-IN')}`,
        minScore: s.minScore || 0
      };

      if (currentScore >= formatted.minScore) {
        eligible.push(formatted);
      } else {
        ineligible.push(formatted);
      }
    }

    return {
      eligible,
      ineligible
    };
  }
}

export const schemeService = new SchemeService();
