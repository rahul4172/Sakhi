import { describe, before, beforeEach, after, afterEach, test } from 'node:test';
import assert from 'node:assert';
import { connectTestDb, clearTestDb, closeTestDb } from '../infra/testDb';
import { startTestServer, stopTestServer, getTestServerUrl } from '../infra/testServer';
import { TestClient } from '../infra/testClient';
import User from '../../src/models/User';
import Profile from '../../src/models/Profile';

describe('Tier 1: Feature Coverage (M2)', () => {
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

  describe('Feature 1: Email Signup', () => {
    test('should successfully signup a valid user and create a profile', async () => {
      const client = new TestClient(getTestServerUrl());
      const payload = {
        email: 'signup_valid@example.com',
        password: 'Password123',
        name: 'Valid User',
        occupation: 'tailoring',
        isSHG: false
      };
      
      const response = await client.post('/api/auth/signup', payload);
      assert.strictEqual(response.status, 201);
      
      const resBody = await response.json();
      assert.strictEqual(resBody.message, 'Signup successful. Please verify your email.');

      // Query DB directly
      const user = await User.findOne({ email: 'signup_valid@example.com' });
      assert.ok(user);
      assert.strictEqual(user.isVerified, false);
      assert.ok(user.verificationToken);

      const profile = await Profile.findOne({ name: 'Valid User' });
      assert.ok(profile);
      assert.strictEqual(profile.sessionId, user._id.toString());
      assert.strictEqual(profile.occupation, 'tailoring');
    });

    test('should handle isSHG=true correctly and set profile occupation as SHG member', async () => {
      const client = new TestClient(getTestServerUrl());
      const payload = {
        email: 'shg_true@example.com',
        password: 'Password123',
        name: 'SHG Member User',
        occupation: 'tailoring',
        isSHG: true
      };

      const response = await client.post('/api/auth/signup', payload);
      assert.strictEqual(response.status, 201);

      const user = await User.findOne({ email: 'shg_true@example.com' });
      assert.ok(user);

      const profile = await Profile.findOne({ sessionId: user._id.toString() });
      assert.ok(profile);
      assert.strictEqual(profile.occupation, 'SHG member');
    });

    test('should handle isSHG=false correctly and keep specified occupation', async () => {
      const client = new TestClient(getTestServerUrl());
      const payload = {
        email: 'shg_false@example.com',
        password: 'Password123',
        name: 'Non SHG User',
        occupation: 'tailoring',
        isSHG: false
      };

      const response = await client.post('/api/auth/signup', payload);
      assert.strictEqual(response.status, 201);

      const user = await User.findOne({ email: 'shg_false@example.com' });
      assert.ok(user);

      const profile = await Profile.findOne({ sessionId: user._id.toString() });
      assert.ok(profile);
      assert.strictEqual(profile.occupation, 'tailoring');
    });

    test('should allow different occupation enums during signup', async () => {
      const client = new TestClient(getTestServerUrl());
      const occupations = ['beauty', 'tiffin service', 'handicrafts', 'other'] as const;

      for (const [idx, occ] of occupations.entries()) {
        const payload = {
          email: `occ_${idx}@example.com`,
          password: 'Password123',
          name: `User ${occ}`,
          occupation: occ,
          isSHG: false
        };

        const response = await client.post('/api/auth/signup', payload);
        assert.strictEqual(response.status, 201);

        const user = await User.findOne({ email: `occ_${idx}@example.com` });
        assert.ok(user);
        const profile = await Profile.findOne({ sessionId: user._id.toString() });
        assert.ok(profile);
        assert.strictEqual(profile.occupation, occ);
      }
    });

    test('should validate zero-balance profile initialization', async () => {
      const client = new TestClient(getTestServerUrl());
      const payload = {
        email: 'zero_balance@example.com',
        password: 'Password123',
        name: 'Zero Balance User',
        occupation: 'beauty',
        isSHG: false
      };

      const response = await client.post('/api/auth/signup', payload);
      assert.strictEqual(response.status, 201);

      const user = await User.findOne({ email: 'zero_balance@example.com' });
      assert.ok(user);

      const profile = await Profile.findOne({ sessionId: user._id.toString() });
      assert.ok(profile);
      assert.strictEqual(profile.tokenBalance, 0);
      assert.strictEqual(profile.currentScore, 0);
      assert.deepStrictEqual(profile.scoreHistory, []);
      assert.deepStrictEqual(profile.tokenHistory, []);
    });
  });

  describe('Feature 2: Email Verification', () => {
    test('should change user verification status on valid token verify', async () => {
      const client = new TestClient(getTestServerUrl());
      const user = await User.create({
        email: 'verify_test@example.com',
        password: 'Password123',
        isVerified: false,
        verificationToken: 'valid-token-123'
      });

      const response = await client.get('/api/auth/verify-email?token=valid-token-123');
      assert.strictEqual(response.status, 200);

      const updatedUser = await User.findById(user._id);
      assert.ok(updatedUser);
      assert.strictEqual(updatedUser.isVerified, true);
    });

    test('should clear verificationToken in database after successful verification', async () => {
      const client = new TestClient(getTestServerUrl());
      const user = await User.create({
        email: 'verify_clear@example.com',
        password: 'Password123',
        isVerified: false,
        verificationToken: 'valid-token-clear'
      });

      const response = await client.get('/api/auth/verify-email?token=valid-token-clear');
      assert.strictEqual(response.status, 200);

      const updatedUser = await User.findById(user._id);
      assert.ok(updatedUser);
      assert.ok(!updatedUser.verificationToken);
    });

    test('should handle multiple verification attempts gracefully', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'verify_multiple@example.com',
        password: 'Password123',
        isVerified: true
      });

      const response = await client.get('/api/auth/verify-email?token=valid-token-clear');
      assert.strictEqual(response.status, 400);
    });

    test('should ensure verification status is correctly stored as boolean in DB', async () => {
      const client = new TestClient(getTestServerUrl());
      const user = await User.create({
        email: 'verify_db@example.com',
        password: 'Password123',
        isVerified: false,
        verificationToken: 'db-token'
      });

      await client.get('/api/auth/verify-email?token=db-token');
      
      const dbUser = await User.findById(user._id);
      assert.ok(dbUser);
      assert.strictEqual(typeof dbUser.isVerified, 'boolean');
      assert.strictEqual(dbUser.isVerified, true);
    });

    test('should allow user login after email has been verified', async () => {
      const client = new TestClient(getTestServerUrl());
      const user = await User.create({
        email: 'verify_login@example.com',
        password: 'Password123',
        isVerified: false,
        verificationToken: 'login-token'
      });

      // Try login before verify
      const loginBefore = await client.post('/api/auth/login', {
        email: 'verify_login@example.com',
        password: 'Password123'
      });
      assert.strictEqual(loginBefore.status, 401);

      // Verify
      const verifyRes = await client.get('/api/auth/verify-email?token=login-token');
      assert.strictEqual(verifyRes.status, 200);

      // Try login after verify
      const loginAfter = await client.post('/api/auth/login', {
        email: 'verify_login@example.com',
        password: 'Password123'
      });
      assert.strictEqual(loginAfter.status, 200);
    });
  });

  describe('Feature 3: Email Login', () => {
    test('should log in successfully and set HttpOnly session cookie', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'login_success@example.com',
        password: 'Password123',
        isVerified: true
      });

      const response = await client.post('/api/auth/login', {
        email: 'login_success@example.com',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 200);

      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /token=/);
      assert.match(setCookie, /HttpOnly/i);
    });

    test('should perform case-insensitive lookup for email address', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'case_sensitive@example.com',
        password: 'Password123',
        isVerified: true
      });

      const response = await client.post('/api/auth/login', {
        email: 'CASE_SENSITIVE@EXAMPLE.COM',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 200);
    });

    test('should return correct user keys in response body', async () => {
      const client = new TestClient(getTestServerUrl());
      const user = await User.create({
        email: 'user_keys@example.com',
        password: 'Password123',
        isVerified: true
      });
      await Profile.create({
        sessionId: user._id.toString(),
        name: 'Keys User',
        occupation: 'beauty'
      });

      const response = await client.post('/api/auth/login', {
        email: 'user_keys@example.com',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 200);
      
      const body = await response.json();
      assert.ok(body.user);
      assert.strictEqual(body.user.id, user._id.toString());
      assert.strictEqual(body.user.email, 'user_keys@example.com');
      assert.strictEqual(body.user.name, 'Keys User');
    });

    test('should use Secure and SameSite=Strict cookie attributes', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'cookie_attrs@example.com',
        password: 'Password123',
        isVerified: true
      });

      const response = await client.post('/api/auth/login', {
        email: 'cookie_attrs@example.com',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 200);

      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /Secure/i);
      assert.match(setCookie, /SameSite=Strict/i);
    });

    test('should prevent login before verification is completed', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'prevent_login@example.com',
        password: 'Password123',
        isVerified: false
      });

      const response = await client.post('/api/auth/login', {
        email: 'prevent_login@example.com',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 401);
    });
  });

  describe('Feature 4: Google OAuth 2.0', () => {
    test('should auto-register a new user on first Google login', async () => {
      const client = new TestClient(getTestServerUrl());
      
      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-newgoogleuser@example.com'
      });
      assert.strictEqual(response.status, 200);

      const user = await User.findOne({ email: 'newgoogleuser@example.com' });
      assert.ok(user);
      assert.strictEqual(user.isVerified, true);
      assert.ok(user.googleId);

      const profile = await Profile.findOne({ sessionId: user._id.toString() });
      assert.ok(profile);
      assert.strictEqual(profile.name, 'newgoogleuser');
    });

    test('should successfully authenticate subsequent Google logins for existing user', async () => {
      const client = new TestClient(getTestServerUrl());
      
      await client.post('/api/auth/google', {
        credential: 'mock-google-token-subsequent@example.com'
      });

      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-subsequent@example.com'
      });
      assert.strictEqual(response.status, 200);

      const usersCount = await User.countDocuments({ email: 'subsequent@example.com' });
      assert.strictEqual(usersCount, 1);
    });

    test('should return session cookie on Google login', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-cookie@example.com'
      });
      assert.strictEqual(response.status, 200);

      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /token=/);
    });

    test('should bypass verification using mock-google-token- prefix', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-bypass@example.com'
      });
      assert.strictEqual(response.status, 200);
      
      const user = await User.findOne({ email: 'bypass@example.com' });
      assert.ok(user);
    });

    test('should return correct user keys in Google login response body', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/google', {
        credential: 'mock-google-token-keys@example.com'
      });
      assert.strictEqual(response.status, 200);

      const body = await response.json();
      assert.ok(body.user);
      assert.ok(body.user.id);
      assert.strictEqual(body.user.email, 'keys@example.com');
      assert.strictEqual(body.user.name, 'keys');
    });
  });

  describe('Feature 5: Session Management / Route Protection', () => {
    test('should block access to dashboard and return 401 when no session', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.get('/api/dashboard/testSessionId');
      assert.strictEqual(response.status, 401);
    });

    test('should block access to BBPS pay route and return 401 when no session', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/bbps/pay', {
        userId: 'testSessionId',
        billId: '123',
        billerId: 'biller1',
        amount: 100
      });
      assert.strictEqual(response.status, 401);
    });

    test('should block access to rewards and return 401 when no session', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.get('/api/rewards/testSessionId');
      assert.strictEqual(response.status, 401);
    });

    test('should allow access to dashboard when valid session cookie is present', async () => {
      const client = new TestClient(getTestServerUrl());
      
      const user = await User.create({ email: 'session_dash@example.com', password: 'Password123', isVerified: true });
      const profile = await Profile.create({ sessionId: user._id.toString(), name: 'Session User', occupation: 'beauty' });

      await client.post('/api/auth/login', {
        email: 'session_dash@example.com',
        password: 'Password123'
      });

      const response = await client.get(`/api/dashboard/${profile.sessionId}`);
      assert.strictEqual(response.status, 200);
    });

    test('should allow access to bbps/rewards when valid session cookie is present', async () => {
      const client = new TestClient(getTestServerUrl());
      
      const user = await User.create({ email: 'session_bbps@example.com', password: 'Password123', isVerified: true });
      const profile = await Profile.create({ sessionId: user._id.toString(), name: 'Session User', occupation: 'beauty' });

      await client.post('/api/auth/login', {
        email: 'session_bbps@example.com',
        password: 'Password123'
      });

      const response = await client.get(`/api/rewards/${profile.sessionId}`);
      assert.strictEqual(response.status, 200);
    });
  });

  describe('Feature 6: Forgot Password', () => {
    test('should return 200 when forgot password is requested for existing email', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'forgot_exist@example.com', password: 'Password123' });

      const response = await client.post('/api/auth/forgot-password', { email: 'forgot_exist@example.com' });
      assert.strictEqual(response.status, 200);
    });

    test('should return 200 when forgot password is requested for non-existing email', async () => {
      const client = new TestClient(getTestServerUrl());

      const response = await client.post('/api/auth/forgot-password', { email: 'forgot_nonexist@example.com' });
      assert.strictEqual(response.status, 200);
    });

    test('should save resetToken and resetTokenExpires in database', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'forgot_save@example.com', password: 'Password123' });

      await client.post('/api/auth/forgot-password', { email: 'forgot_save@example.com' });

      const user = await User.findOne({ email: 'forgot_save@example.com' });
      assert.ok(user);
      assert.ok(user.resetToken);
      assert.ok(user.resetTokenExpires);
      assert.ok(user.resetTokenExpires.getTime() > Date.now());
    });

    test('should capture and retrieve the token correctly from database', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'forgot_capture@example.com', password: 'Password123' });

      await client.post('/api/auth/forgot-password', { email: 'forgot_capture@example.com' });

      const user = await User.findOne({ email: 'forgot_capture@example.com' });
      assert.ok(user);
      assert.strictEqual(typeof user.resetToken, 'string');
      assert.ok(user.resetToken.length > 0);
    });

    test('should update resetToken and resetTokenExpires on subsequent forgot password requests', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'forgot_subsequent@example.com', password: 'Password123' });

      await client.post('/api/auth/forgot-password', { email: 'forgot_subsequent@example.com' });
      const user1 = await User.findOne({ email: 'forgot_subsequent@example.com' });
      assert.ok(user1);
      const token1 = user1.resetToken;

      await client.post('/api/auth/forgot-password', { email: 'forgot_subsequent@example.com' });
      const user2 = await User.findOne({ email: 'forgot_subsequent@example.com' });
      assert.ok(user2);
      
      assert.notStrictEqual(user2.resetToken, token1);
    });
  });

  describe('Feature 7: Reset Password', () => {
    test('should reset password successfully with valid token', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'reset_success@example.com',
        password: 'Password123',
        resetToken: 'valid-reset-token',
        resetTokenExpires: new Date(Date.now() + 3600000)
      });

      const response = await client.post('/api/auth/reset-password', {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123'
      });
      assert.strictEqual(response.status, 200);
    });

    test('should fail to login with old password after reset', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'reset_old@example.com',
        password: 'Password123',
        resetToken: 'valid-reset-old-token',
        resetTokenExpires: new Date(Date.now() + 3600000),
        isVerified: true
      });

      await client.post('/api/auth/reset-password', {
        token: 'valid-reset-old-token',
        newPassword: 'NewPassword123'
      });

      const response = await client.post('/api/auth/login', {
        email: 'reset_old@example.com',
        password: 'Password123'
      });
      assert.strictEqual(response.status, 401);
    });

    test('should succeed to login with new password after reset', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'reset_new@example.com',
        password: 'Password123',
        resetToken: 'valid-reset-new-token',
        resetTokenExpires: new Date(Date.now() + 3600000),
        isVerified: true
      });

      await client.post('/api/auth/reset-password', {
        token: 'valid-reset-new-token',
        newPassword: 'NewPassword123'
      });

      const response = await client.post('/api/auth/login', {
        email: 'reset_new@example.com',
        password: 'NewPassword123'
      });
      assert.strictEqual(response.status, 200);
    });

    test('should ensure resetToken is one-time use only', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({
        email: 'reset_onetime@example.com',
        password: 'Password123',
        resetToken: 'valid-reset-onetime-token',
        resetTokenExpires: new Date(Date.now() + 3600000)
      });

      const firstReset = await client.post('/api/auth/reset-password', {
        token: 'valid-reset-onetime-token',
        newPassword: 'NewPassword123'
      });
      assert.strictEqual(firstReset.status, 200);

      const secondReset = await client.post('/api/auth/reset-password', {
        token: 'valid-reset-onetime-token',
        newPassword: 'AnotherPassword123'
      });
      assert.strictEqual(secondReset.status, 400);
    });

    test('should update database bcrypt hash after password reset', async () => {
      const client = new TestClient(getTestServerUrl());
      const originalUser = await User.create({
        email: 'reset_hash@example.com',
        password: 'Password123',
        resetToken: 'valid-reset-hash-token',
        resetTokenExpires: new Date(Date.now() + 3600000)
      });
      const originalHash = originalUser.password;

      await client.post('/api/auth/reset-password', {
        token: 'valid-reset-hash-token',
        newPassword: 'NewPassword123'
      });

      const updatedUser = await User.findOne({ email: 'reset_hash@example.com' });
      assert.ok(updatedUser);
      assert.notStrictEqual(updatedUser.password, originalHash);
      assert.match(updatedUser.password!, /^\$2[aby]\$/);
    });
  });

  describe('Feature 8: Logout', () => {
    test('should clear JWT session cookie on logout', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'logout_clear@example.com', password: 'Password123', isVerified: true });
      await client.post('/api/auth/login', { email: 'logout_clear@example.com', password: 'Password123' });

      const response = await client.post('/api/auth/logout', {});
      assert.strictEqual(response.status, 200);

      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /token=;?/);
      assert.match(setCookie, /Max-Age=0/i);
    });

    test('should return 200 status code on successful logout', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'logout_200@example.com', password: 'Password123', isVerified: true });
      await client.post('/api/auth/login', { email: 'logout_200@example.com', password: 'Password123' });

      const response = await client.post('/api/auth/logout', {});
      assert.strictEqual(response.status, 200);
    });

    test('should handle logout gracefully even if session does not exist', async () => {
      const client = new TestClient(getTestServerUrl());
      const response = await client.post('/api/auth/logout', {});
      assert.strictEqual(response.status, 200);
    });

    test('should fail with 401 when accessing protected routes after logout', async () => {
      const client = new TestClient(getTestServerUrl());
      const user = await User.create({ email: 'logout_route@example.com', password: 'Password123', isVerified: true });
      const profile = await Profile.create({ sessionId: user._id.toString(), name: 'Logout User', occupation: 'beauty' });

      await client.post('/api/auth/login', { email: 'logout_route@example.com', password: 'Password123' });
      
      const accessBefore = await client.get(`/api/dashboard/${profile.sessionId}`);
      assert.strictEqual(accessBefore.status, 200);

      await client.post('/api/auth/logout', {});

      const accessAfter = await client.get(`/api/dashboard/${profile.sessionId}`);
      assert.strictEqual(accessAfter.status, 401);
    });

    test('should ensure cleared cookie has Secure, SameSite=Strict and HttpOnly attributes', async () => {
      const client = new TestClient(getTestServerUrl());
      await User.create({ email: 'logout_cookie@example.com', password: 'Password123', isVerified: true });
      await client.post('/api/auth/login', { email: 'logout_cookie@example.com', password: 'Password123' });

      const response = await client.post('/api/auth/logout', {});
      const setCookie = response.headers.get('set-cookie');
      assert.ok(setCookie);
      assert.match(setCookie, /HttpOnly/i);
      assert.match(setCookie, /Secure/i);
      assert.match(setCookie, /SameSite=Strict/i);
    });
  });
});
