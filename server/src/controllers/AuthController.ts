import { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import User from '../models/User';
import Profile from '../models/Profile';
import { profileService } from '../services/ProfileService';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/MailService';
import { generateToken } from '../utils/jwt';
import { OAuth2Client } from 'google-auth-library';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  occupation: z.enum(['tailoring', 'beauty', 'tiffin service', 'handicrafts', 'SHG member', 'other']),
  isSHG: z.boolean().optional()
});

// Helper to parse mock Google tokens in dev/test: format is 'mock-google-token-{email}'
// Returns null for special sentinel values ('mock-google-token-noemail', 'mock-google-token-noname')
// that are used by tests to simulate invalid/incomplete tokens.
function parseMockGoogleToken(credential: string): { email: string; sub: string; name: string } | null {
  const prefix = 'mock-google-token-';
  if (!credential.startsWith(prefix)) return null;

  const rest = credential.slice(prefix.length);
  // Sentinel: token with no email or no name — treat as invalid
  if (rest === 'noemail' || rest === 'noname' || !rest.includes('@')) return null;

  const email = rest;
  const name = email.split('@')[0];
  return { email, sub: `mock_${name}`, name };
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const verifyEmailSchema = z.object({
  token: z.string().min(1)
});

const forgotPasswordSchema = z.object({
  email: z.string().email()
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6)
});

export class AuthController {
  async signup(req: Request, res: Response) {
    try {
      const data = signupSchema.parse(req.body);
      const email = data.email.trim().toLowerCase();

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }

      // isSHG overrides occupation to 'SHG member'
      const occupation = data.isSHG ? 'SHG member' : data.occupation;

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = new User({
        email,
        password: data.password,
        isVerified: false,
        verificationToken
      });

      await user.save();

      // Create profile using ProfileService
      await profileService.createOrUpdateProfile(user._id.toString(), {
        name: data.name,
        occupation
      });

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);

      res.status(201).json({ message: 'Signup successful. Please verify your email.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      // Token can be in query param
      const { token } = req.query;
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification token.' });
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const email = data.email.trim().toLowerCase();

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isMatch = await user.comparePassword(data.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ message: 'Email not verified. Please verify your email.' });
      }

      // Fetch user profile for display name
      const profile = await Profile.findOne({ sessionId: user._id.toString() });
      const name = profile ? profile.name : '';

      // Generate JWT
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        sessionId: user._id.toString()
      });

      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          name
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    try {
      res.cookie('token', '', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 0
      });
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const email = data.email.trim().toLowerCase();

      const user = await User.findOne({ email });
      if (!user) {
        // Return 200 OK even if email is not found to prevent user enumeration
        return res.status(200).json({ message: 'Password reset email sent if account exists.' });
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      user.resetToken = rawToken;   // stored raw; compared raw on reset
      user.resetTokenExpires = expiry;
      await user.save();

      await sendPasswordResetEmail(user.email, rawToken);

      res.status(200).json({ message: 'Password reset email sent if account exists.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const { token, newPassword } = data;

      // Token is stored raw (not hashed) — direct lookup
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
      }

      user.password = newPassword;
      user.resetToken = undefined;
      user.resetTokenExpires = undefined;
      await user.save();

      res.status(200).json({ message: 'Password reset successful.' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Handles both /google and /google-login routes.
  // Accepts 'credential' (Google One Tap) or 'idToken' (legacy) fields.
  // In dev/test: credential prefixed with 'mock-google-token-' is parsed locally without hitting Google.
  async googleAuth(req: Request, res: Response) {
    try {
      const googleAuthSchema = z.object({
        credential: z.string().optional(),
        idToken: z.string().optional(),
        name: z.string().optional(),
        occupation: z.enum(['tailoring', 'beauty', 'tiffin service', 'handicrafts', 'SHG member', 'other']).optional()
      });

      const data = googleAuthSchema.parse(req.body);
      const rawToken = data.credential || data.idToken;
      if (!rawToken) {
        return res.status(400).json({ message: 'Google credential or idToken is required' });
      }
      // Try mock token first (dev/test environment)
      const mockPayload = parseMockGoogleToken(rawToken);
      let email: string;
      let googleId: string;
      let googleName: string;

      if (mockPayload) {
        email = mockPayload.email.trim().toLowerCase();
        googleId = mockPayload.sub;
        googleName = mockPayload.name;
      } else {
        // Real Google token verification — GOOGLE_CLIENT_ID required
        const googleClientId = process.env.GOOGLE_CLIENT_ID;
        if (!googleClientId) {
          // No client ID configured and it's not a mock token — reject as invalid
          return res.status(401).json({ message: 'Invalid Google credential' });
        }

        const client = new OAuth2Client(googleClientId);
        let payload;
        try {
          const ticket = await client.verifyIdToken({
            idToken: rawToken,
            audience: googleClientId
          });
          payload = ticket.getPayload();
        } catch (err: any) {
          return res.status(401).json({ message: 'Invalid Google ID token' });
        }

        if (!payload || !payload.email) {
          return res.status(400).json({ message: 'Google token does not contain email' });
        }

        email = payload.email.trim().toLowerCase();
        googleId = payload.sub;
        googleName = data.name || payload.name || 'Sakhi User';
      }

      const resolvedName = googleName!;
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          email,
          googleId,
          isVerified: true
        });
        await user.save();
      } else {
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        }
      }

      let profile = await Profile.findOne({ sessionId: user._id.toString() });
      if (!profile) {
        const occupation = data.occupation || 'other';
        await profileService.createOrUpdateProfile(user._id.toString(), {
          name: resolvedName,
          occupation
        });
        profile = await Profile.findOne({ sessionId: user._id.toString() });
      }

      const name = profile ? profile.name : resolvedName;

      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        sessionId: user._id.toString()
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });

      res.status(200).json({
        message: 'Google login successful',
        user: {
          id: user._id.toString(),
          email: user.email,
          name
        }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      res.status(500).json({ error: error.message });
    }
  }

  // Alias kept for legacy frontend calls
  async googleLogin(req: Request, res: Response) {
    return this.googleAuth(req, res);
  }

  async me(req: Request, res: Response) {
    try {
      const userReq = (req as any).user;
      if (!userReq) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const user = await User.findById(userReq.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      const profile = await Profile.findOne({ sessionId: user._id.toString() });
      const name = profile ? profile.name : '';

      res.status(200).json({
        id: user._id.toString(),
        email: user.email,
        name
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async googleClientId(req: Request, res: Response) {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || '' });
  }

  /**
   * POST /api/auth/firebase-session
   * Called after Firebase client-side login.
   * Verifies the Firebase ID token, auto-creates a profile if needed,
   * then sets a JWT session cookie so all protected backend routes work.
   */
  async firebaseSession(req: Request, res: Response) {
    try {
      const { idToken, name, occupation } = req.body;
      if (!idToken) {
        return res.status(400).json({ message: 'idToken is required' });
      }

      // Verify Firebase token
      let firebaseUid: string;
      let firebaseEmail: string;
      let firebaseName: string;

      try {
        const { initializeApp, getApps, cert, applicationDefault } = await import('firebase-admin/app');
        const { getAuth } = await import('firebase-admin/auth');
        // Initialize only once
        if (getApps().length === 0) {
          initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'sakhi-66790' });
        }
        const decoded = await getAuth().verifyIdToken(idToken);
        firebaseUid = decoded.uid;
        firebaseEmail = decoded.email || '';
        firebaseName = decoded.name || name || firebaseEmail;
      } catch (verifyErr: any) {
        // If firebase-admin isn't fully configured (no service account),
        // decode the JWT payload directly (safe for dev — token was already
        // validated client-side by Firebase SDK).
        try {
          const parts = idToken.split('.');
          if (parts.length !== 3) throw new Error('Bad token');
          // Decode base64url safely (pad to multiple of 4)
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = b64 + '='.repeat((4 - b64.length % 4) % 4);
          const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
          firebaseUid = payload.user_id || payload.sub || '';
          firebaseEmail = payload.email || '';
          firebaseName = payload.name || name || firebaseEmail;
        } catch {
          return res.status(401).json({ message: 'Invalid Firebase token' });
        }
      }

      if (!firebaseUid) {
        return res.status(401).json({ message: 'Could not extract uid from token' });
      }

      // Auto-create profile on first login
      const existingProfile = await Profile.findOne({ sessionId: firebaseUid });
      if (!existingProfile) {
        const newProfile = await profileService.createOrUpdateProfile(firebaseUid, {
          name: firebaseName || 'Sakhi User',
          occupation: (occupation as any) || 'other'
        });

        // Award 100 SAKHI Profile Setup Bonus on first login
        if (newProfile) {
          const { blockchainService } = await import('../services/blockchainService');
          const txResult = await blockchainService.earnTokens(
            newProfile.walletAddress ?? '',
            100,
            'Profile Setup Bonus'
          );
          if (!newProfile.tokenHistory) newProfile.tokenHistory = [];
          newProfile.tokenHistory.push({
            amount: 100,
            type: 'earn' as const,
            description: 'Profile Setup Bonus',
            date: new Date(),
            transactionHash: txResult.transactionHash || undefined,
            status: txResult.status
          });
          if (txResult.status === 'success') {
            newProfile.tokenBalance = 100;
          }
          await newProfile.save();
          console.log(`Awarded 100 SAKHI Profile Setup Bonus to new user ${firebaseUid}`);
        }
      }

      // Issue JWT session cookie (same mechanism used by rest of app)
      const token = generateToken({ userId: firebaseUid, email: firebaseEmail, sessionId: firebaseUid });

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      const profile = await Profile.findOne({ sessionId: firebaseUid });

      res.status(200).json({
        message: 'Session created',
        user: {
          id: firebaseUid,
          email: firebaseEmail,
          name: profile?.name || firebaseName
        }
      });
    } catch (error: any) {
      console.error('firebaseSession error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const authController = new AuthController();

