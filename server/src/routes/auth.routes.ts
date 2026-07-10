import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from '../controllers/AuthController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

// Rate limiters
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // block after 10 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') {
      const email = req.body?.email;
      if (email === 'ratelimit@example.com' || email === 'bruteforce@example.com') {
        return false; // Do not skip rate limiting for these test cases
      }
      return true; // Skip for all other test cases to prevent interference
    }
    return false;
  }
});

const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // block after 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again later.' },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') {
      const email = req.body?.email;
      if (email === 'forgotlimit@example.com') {
        return false; // Do not skip rate limiting for this test case
      }
      return true; // Skip
    }
    return false;
  }
});

const signupRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many signups from this IP. Please try again later.' },
  skip: (req) => {
    if (process.env.NODE_ENV === 'test') {
      return true; // Skip signup rate limit entirely in test environment
    }
    return false;
  }
});

// Routes
router.post('/signup', signupRateLimiter, authController.signup.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/login', loginRateLimiter, authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/logout', (req, res) => res.status(405).json({ message: 'Method Not Allowed' }));
router.post('/google', authController.googleAuth.bind(authController));          // Google One Tap / tests
router.post('/google-login', authController.googleAuth.bind(authController));    // legacy alias
router.post('/forgot-password', forgotPasswordRateLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.get('/google-client-id', authController.googleClientId.bind(authController));
router.post('/firebase-session', authController.firebaseSession.bind(authController));
router.get('/me', requireAuth, authController.me.bind(authController));

export default router;
