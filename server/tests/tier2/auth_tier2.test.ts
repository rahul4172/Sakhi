import { describe, before, beforeEach, after, afterEach, test } from 'node:test';
import assert from 'node:assert';
import { connectTestDb, clearTestDb, closeTestDb } from '../infra/testDb';
import { startTestServer, stopTestServer, getTestServerUrl } from '../infra/testServer';
import { TestClient } from '../infra/testClient';
import User from '../../src/models/User';
import Profile from '../../src/models/Profile';

describe('Tier 2: Boundary & Corner Cases (M3)', () => {
  before(async () => {
    await connectTestDb();
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('Feature 1: Email Signup Boundaries', () => {
    test('should reject invalid email format with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/signup', {
        email: 'invalid-email-format',
        password: 'Password123',
        name: 'Test User',
        occupation: 'tailoring',
        isSHG: false
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject short password with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/signup', {
        email: 'short_pwd@example.com',
        password: '123',
        name: 'Test User',
        occupation: 'tailoring',
        isSHG: false
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject duplicate email registration with 400 or 409', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'duplicate@example.com', password: 'Password123' });

      const response = await client.post('/api/auth/signup', {
        email: 'duplicate@example.com',
        password: 'Password123',
        name: 'Test User',
        occupation: 'tailoring',
        isSHG: false
      });
      assert.ok(response.status === 400 || response.status === 409);
    });

    test('should reject request missing required fields with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/signup', {
        email: 'missing_fields@example.com',
        password: 'Password123'
        // name and occupation are missing
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject invalid occupation enum with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/signup', {
        email: 'invalid_enum@example.com',
        password: 'Password123',
        name: 'Test User',
        occupation: 'astronaut', // invalid enum
        isSHG: false
      });
      assert.strictEqual(response.status, 400);
    });
  });

  describe('Feature 2: Email Verification Boundaries', () => {
    test('should reject empty/missing verification token with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.get('/api/auth/verify-email');
      assert.strictEqual(response.status, 400);
    });

    test('should reject expired verification token with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      // In this setup, we simulate an expired token (e.g. mock token config or jwt expiration)
      const response = await client.get('/api/auth/verify-email?token=expired-verification-token');
      assert.strictEqual(response.status, 400);
    });

    test('should reject malformed verification token format with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.get('/api/auth/verify-email?token=malformed_token_123!!');
      assert.strictEqual(response.status, 400);
    });

    test('should reject non-existent verification token with 400 or 404', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.get('/api/auth/verify-email?token=nonexistenttokenuuid');
      assert.ok(response.status === 400 || response.status === 404);
    });

    test('should reject double verification attempts with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'double_verify@example.com',
        password: 'Password123',
        isVerified: true
      });

      const response = await client.get('/api/auth/verify-email?token=already-verified-token');
      assert.strictEqual(response.status, 400);
    });
  });

  describe('Feature 3: Email Login Boundaries', () => {
    test('should reject login with invalid password with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'login_badpass@example.com', password: 'Password123', isVerified: true });

      const response = await client.post('/api/auth/login', {
        email: 'login_badpass@example.com',
        password: 'WrongPassword'
      });
      assert.strictEqual(response.status, 401);
    });

    test('should reject login with non-existent email with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/login', {
        email: 'nonexistent@example.com',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 401);
    });

    test('should reject empty login inputs with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/login', {
        email: '',
        password: ''
      });
      assert.strictEqual(response.status, 400);
    });

    test('should trigger rate limiter and block excessive logins with 429', async () => {
      const client = new TestClient(getTestServerUrl());
      
      // Perform 25 rapid login attempts to trigger rate limiter
      let lastStatus = 200;
      for (let i = 0; i < 25; i++) {
        const response = await client.post('/api/auth/login', {
          email: 'ratelimit@example.com',
          password: 'Password123'
        });
        lastStatus = response.status;
        if (lastStatus === 429) {
          break;
        }
      }
      assert.strictEqual(lastStatus, 429);
    });

    test('should prevent NoSQL injection in login fields', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/login', {
        email: { $ne: null },
        password: 'Password123'
      });
      assert.ok(response.status === 400 || response.status === 401);
    });
  });

  describe('Feature 4: Google OAuth Boundaries', () => {
    test('should reject empty/missing Google credential with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {});
      assert.strictEqual(response.status, 400);
    });

    test('should reject invalid/expired Google token with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'expired-google-token'
      });
      assert.strictEqual(response.status, 401);
    });

    test('should reject malformed Google token with 400 or 401', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'not.a.valid.jwt.token'
      });
      assert.ok(response.status === 400 || response.status === 401);
    });

    test('should reject Google token with missing email claim with 400 or 401', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-noemail'
      });
      assert.ok(response.status === 400 || response.status === 401);
    });

    test('should reject Google token with missing name claim with 400 or 401', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-noname'
      });
      assert.ok(response.status === 400 || response.status === 401);
    });
  });

  describe('Feature 5: Session Boundaries', () => {
    test('should reject expired JWT session cookie with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('token', 'expired-jwt-token-value');
      
      const response = await client.get('/api/dashboard/sessionBoundaries');
      assert.strictEqual(response.status, 401);
    });

    test('should reject malformed JWT session cookie with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('token', 'malformed.jwt.cookie');

      const response = await client.get('/api/dashboard/sessionBoundaries');
      assert.strictEqual(response.status, 401);
    });

    test('should reject JWT cookie signed with wrong secret with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('token', 'wrong-secret-signed-jwt');

      const response = await client.get('/api/dashboard/sessionBoundaries');
      assert.strictEqual(response.status, 401);
    });

    test('should reject empty session cookie value with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('token', '');

      const response = await client.get('/api/dashboard/sessionBoundaries');
      assert.strictEqual(response.status, 401);
    });

    test('should reject wrong session cookie name with 401', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('session', 'valid-jwt-token'); // wrong cookie name

      const response = await client.get('/api/dashboard/sessionBoundaries');
      assert.strictEqual(response.status, 401);
    });
  });

  describe('Feature 6: Forgot Password Boundaries', () => {
    test('should reject malformed email format for forgot password with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/forgot-password', {
        email: 'not-a-valid-email'
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject empty email field for forgot password with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/forgot-password', {
        email: ''
      });
      assert.strictEqual(response.status, 400);
    });

    test('should rate limit forgot password requests with 429', async () => {
      const client = new TestClient(getTestServerUrl());
      
      let lastStatus = 200;
      for (let i = 0; i < 20; i++) {
        const response = await client.post('/api/auth/forgot-password', {
          email: 'forgotlimit@example.com'
        });
        lastStatus = response.status;
        if (lastStatus === 429) {
          break;
        }
      }
      assert.strictEqual(lastStatus, 429);
    });

    test('should prevent NoSQL injection in forgot password email field', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/forgot-password', {
        email: { $gt: '' }
      });
      assert.ok(response.status === 400 || response.status === 401);
    });

    test('should lookup email in mixed case case-insensitively', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'mixedcase_forgot@example.com', password: 'Password123' });

      const response = await client.post('/api/auth/forgot-password', {
        email: 'MiXeDcAsE_fOrGoT@eXaMpLe.CoM'
      });
      assert.strictEqual(response.status, 200);

      const user = await User.findOne({ email: 'mixedcase_forgot@example.com' });
      assert.ok(user);
      assert.ok(user.resetToken);
    });
  });

  describe('Feature 7: Reset Password Boundaries', () => {
    test('should reject empty/missing reset token with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/reset-password', {
        token: '',
        newPassword: 'NewPassword123'
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject empty newPassword with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/reset-password', {
        token: 'valid-token',
        newPassword: ''
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject expired reset token with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'reset_expired@example.com',
        password: 'Password123',
        resetToken: 'expired-reset-token',
        resetTokenExpires: new Date(Date.now() - 60000) // expired 1 minute ago
      });

      const response = await client.post('/api/auth/reset-password', {
        token: 'expired-reset-token',
        newPassword: 'NewPassword123'
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject weak password format with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/reset-password', {
        token: 'valid-token',
        newPassword: '123' // too weak
      });
      assert.strictEqual(response.status, 400);
    });

    test('should reject malformed reset token with 400', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/reset-password', {
        token: 'malformed_reset_token!!!',
        newPassword: 'NewPassword123'
      });
      assert.strictEqual(response.status, 400);
    });
  });

  describe('Feature 8: Logout Boundaries', () => {
    test('should respond 200 OK for custom/malformed cookie header on logout', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('token', 'malformed-cookie-content');
      
      const response = await client.post('/api/auth/logout', {});
      assert.strictEqual(response.status, 200);
    });

    test('should allow multiple rapid logouts without rate limit blocking', async () => {
      const client = new TestClient(getTestServerUrl());
      
      let lastStatus = 200;
      for (let i = 0; i < 5; i++) {
        const response = await client.post('/api/auth/logout', {});
        lastStatus = response.status;
      }
      assert.strictEqual(lastStatus, 200);
    });

    test('should strictly set HttpOnly, Secure, and SameSite=Strict flags on logout cookie clear', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/logout', {});
      
      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /Secure/i);
      assert.match(setCookie, /SameSite=Strict/i);
    });

    test('should return 200 for expired session logout', async () => {
      const client = new TestClient(getTestServerUrl());
      client.setCookie('token', 'expired-token-value');

      const response = await client.post('/api/auth/logout', {});
      assert.strictEqual(response.status, 200);
    });

    test('should reject GET request to logout endpoint with 404 or 405', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.get('/api/auth/logout');
      assert.ok(response.status === 404 || response.status === 405);
    });
  });
});
