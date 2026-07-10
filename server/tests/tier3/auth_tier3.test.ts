import { describe, before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert';
import { connectTestDb, clearTestDb, closeTestDb } from '../infra/testDb';
import { startTestServer, stopTestServer, getTestServerUrl } from '../infra/testServer';
import { TestClient } from '../infra/testClient';
import User from '../../src/models/User';
import Profile from '../../src/models/Profile';

describe('Tier 3: Pairwise coverage (M4)', () => {
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

  test('Test 1: Signup -> Login without verification', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'tier3_t1@example.com';
    const password = 'Password123';

    // 1. Signup
    const signupRes = await client.post('/api/auth/signup', {
      email,
      password,
      name: 'Unverified User',
      occupation: 'beauty',
      isSHG: false
    });
    assert.strictEqual(signupRes.status, 201);

    // 2. Login without verification
    const loginRes = await client.post('/api/auth/login', { email, password });

    if (loginRes.status === 200) {
      // If login succeeds, isVerified flag in user payload must be false
      const body = await loginRes.json();
      assert.ok(body.user);
      assert.strictEqual(body.user.isVerified, false);

      // And dashboard access must fail until verification is complete
      const dashRes = await client.get(`/api/dashboard/${body.user.id}`);
      assert.notStrictEqual(dashRes.status, 200);
    } else {
      // Or login is blocked (returns 401 or other non-200 error code)
      assert.ok(loginRes.status === 401 || loginRes.status === 403 || loginRes.status === 400);
    }
  });

  test('Test 2: Google OAuth Login (auto-creates) -> Email Signup with the same email', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'tier3_t2@example.com';

    // 1. Google OAuth login (auto-creates account)
    const googleRes = await client.post('/api/auth/google', {
      credential: `mock-google-token-${email}`
    });
    assert.strictEqual(googleRes.status, 200);

    // Verify user exists in database
    const userInDb = await User.findOne({ email });
    assert.ok(userInDb);

    // 2. Email Signup with the same email
    const signupRes = await client.post('/api/auth/signup', {
      email,
      password: 'Password123',
      name: 'Email Signup Same',
      occupation: 'tailoring',
      isSHG: false
    });

    // Should fail/reject or handle gracefully, preventing duplicate accounts
    assert.ok(
      signupRes.status === 400 || 
      signupRes.status === 409 || 
      signupRes.status === 200 || 
      signupRes.status === 201
    );

    // Ensure database contains exactly one user for this email
    const count = await User.countDocuments({ email });
    assert.strictEqual(count, 1);
  });

  test('Test 3: Email Signup -> Google OAuth Login with the same email', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'tier3_t3@example.com';

    // 1. Email Signup
    const signupRes = await client.post('/api/auth/signup', {
      email,
      password: 'Password123',
      name: 'Signup First User',
      occupation: 'tiffin service',
      isSHG: false
    });
    assert.strictEqual(signupRes.status, 201);

    // 2. Google OAuth Login with the same email
    const googleRes = await client.post('/api/auth/google', {
      credential: `mock-google-token-${email}`
    });

    // Should succeed and authenticate user, mapping to the same account
    assert.strictEqual(googleRes.status, 200);

    const body = await googleRes.json();
    assert.ok(body.user);
    assert.strictEqual(body.user.email, email);

    // Ensure database contains exactly one user for this email
    const count = await User.countDocuments({ email });
    assert.strictEqual(count, 1);
  });

  test('Test 4: Forgot password -> Reset password -> Login with old password (fails) -> Login with new password (succeeds)', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'tier3_t4@example.com';
    const oldPassword = 'OldPassword123';
    const newPassword = 'NewPassword123';

    // Signup a user
    const signupRes = await client.post('/api/auth/signup', {
      email,
      password: oldPassword,
      name: 'Reset Pwd User',
      occupation: 'handicrafts',
      isSHG: false
    });
    assert.strictEqual(signupRes.status, 201);

    // Verify email using DB verification token to allow login
    const user = await User.findOne({ email });
    assert.ok(user);
    assert.ok(user.verificationToken);

    const verifyRes = await client.get(`/api/auth/verify-email?token=${user.verificationToken}`);
    assert.strictEqual(verifyRes.status, 200);

    // 1. Forgot password request
    const forgotRes = await client.post('/api/auth/forgot-password', { email });
    assert.strictEqual(forgotRes.status, 200);

    // Capture the reset token from the DB
    const userAfterForgot = await User.findOne({ email });
    assert.ok(userAfterForgot);
    assert.ok(userAfterForgot.resetToken);

    // 2. Reset password
    const resetRes = await client.post('/api/auth/reset-password', {
      token: userAfterForgot.resetToken,
      newPassword
    });
    assert.strictEqual(resetRes.status, 200);

    // 3. Login with old password (fails)
    const loginOldRes = await client.post('/api/auth/login', {
      email,
      password: oldPassword
    });
    assert.strictEqual(loginOldRes.status, 401);

    // 4. Login with new password (succeeds)
    const loginNewRes = await client.post('/api/auth/login', {
      email,
      password: newPassword
    });
    assert.strictEqual(loginNewRes.status, 200);
  });

  test('Test 5: Login -> Forgot password request while logged in -> Verify DB updates and reset password works', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'tier3_t5@example.com';
    const oldPassword = 'OldPassword123';
    const newPassword = 'NewPassword123';

    // Signup user
    const signupRes = await client.post('/api/auth/signup', {
      email,
      password: oldPassword,
      name: 'LoggedIn Forgot User',
      occupation: 'other',
      isSHG: false
    });
    assert.strictEqual(signupRes.status, 201);

    // Verify email
    const user = await User.findOne({ email });
    assert.ok(user);
    assert.ok(user.verificationToken);
    const verifyRes = await client.get(`/api/auth/verify-email?token=${user.verificationToken}`);
    assert.strictEqual(verifyRes.status, 200);

    // 1. Login
    const loginRes = await client.post('/api/auth/login', {
      email,
      password: oldPassword
    });
    assert.strictEqual(loginRes.status, 200);

    // 2. Forgot password request while logged in (cookie is attached)
    const forgotRes = await client.post('/api/auth/forgot-password', { email });
    assert.strictEqual(forgotRes.status, 200);

    // Verify DB updates reset token
    const userAfterForgot = await User.findOne({ email });
    assert.ok(userAfterForgot);
    assert.ok(userAfterForgot.resetToken);
    assert.ok(userAfterForgot.resetTokenExpires);
    assert.ok(userAfterForgot.resetTokenExpires.getTime() > Date.now());

    // 3. Reset password works
    const resetRes = await client.post('/api/auth/reset-password', {
      token: userAfterForgot.resetToken,
      newPassword
    });
    assert.strictEqual(resetRes.status, 200);

    // Verify login with new password works (clear cookies first)
    client.clearCookies();
    const loginNewRes = await client.post('/api/auth/login', {
      email,
      password: newPassword
    });
    assert.strictEqual(loginNewRes.status, 200);
  });
});
