import { describe, before, beforeEach, after, test } from 'node:test';
import assert from 'node:assert';
import { connectTestDb, clearTestDb, closeTestDb } from '../infra/testDb';
import { startTestServer, stopTestServer, getTestServerUrl } from '../infra/testServer';
import { TestClient } from '../infra/testClient';
import User from '../../src/models/User';
import Profile from '../../src/models/Profile';

describe('Tier 4: Real-World Application Workflows (M4)', () => {
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

  test('Test 1: Complete User Lifecycle', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'lifecycle@example.com';
    const password = 'Password123';
    const name = 'Lifecycle User';

    // 1. Unauthenticated guest blocked from dashboard
    const blockRes = await client.get('/api/dashboard/dummy_session_id');
    assert.strictEqual(blockRes.status, 401);

    // 2. Sign up
    const signupRes = await client.post('/api/auth/signup', {
      email,
      password,
      name,
      occupation: 'tailoring',
      isSHG: false
    });
    assert.strictEqual(signupRes.status, 201);

    // 3. Receive mock verification link (Retrieve token directly from DB)
    const userInDb = await User.findOne({ email });
    assert.ok(userInDb);
    assert.ok(userInDb.verificationToken);

    // 4. Verify email
    const verifyRes = await client.get(`/api/auth/verify-email?token=${userInDb.verificationToken}`);
    assert.strictEqual(verifyRes.status, 200);

    // 5. Login
    const loginRes = await client.post('/api/auth/login', { email, password });
    assert.strictEqual(loginRes.status, 200);

    const loginBody = await loginRes.json();
    assert.ok(loginBody.user);
    const userId = loginBody.user.id;

    // 6. Access dashboard
    const dashRes = await client.get(`/api/dashboard/${userId}`);
    assert.strictEqual(dashRes.status, 200);

    // 7. Access BBPS (make a payment request)
    const bbpsRes = await client.post('/api/bbps/pay', {
      userId,
      billId: 'bill_lifecycle_123',
      billerId: 'biller_elect',
      amount: 250
    });
    // Expected to succeed (either 200 or 201) when backend routes are functional
    assert.ok(bbpsRes.status === 200 || bbpsRes.status === 201);

    // 8. Access Rewards
    const rewardsRes = await client.get(`/api/rewards/${userId}`);
    assert.strictEqual(rewardsRes.status, 200);

    // 9. Logout
    const logoutRes = await client.post('/api/auth/logout', {});
    assert.strictEqual(logoutRes.status, 200);

    // 10. Dashboard access blocked again
    const blockAgainRes = await client.get(`/api/dashboard/${userId}`);
    assert.strictEqual(blockAgainRes.status, 401);
  });

  test('Test 2: Password Recovery Flow', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'recovery@example.com';
    const oldPassword = 'OldPassword123';
    const newPassword = 'NewPassword123';

    // Seed verified user
    const user = await User.create({
      email,
      password: oldPassword,
      isVerified: true
    });
    const profile = await Profile.create({
      sessionId: user._id.toString(),
      name: 'Recovery User',
      occupation: 'beauty'
    });

    // 1. Attacker fails to login
    const attackerRes = await client.post('/api/auth/login', {
      email,
      password: 'attackerpassword'
    });
    assert.strictEqual(attackerRes.status, 401);

    // 2. User requests password reset
    const forgotRes = await client.post('/api/auth/forgot-password', { email });
    assert.strictEqual(forgotRes.status, 200);

    // 3. Captures reset token from DB
    const updatedUser = await User.findOne({ email });
    assert.ok(updatedUser);
    assert.ok(updatedUser.resetToken);

    // 4. Resets password
    const resetRes = await client.post('/api/auth/reset-password', {
      token: updatedUser.resetToken,
      newPassword
    });
    assert.strictEqual(resetRes.status, 200);

    // 5. Old password fails to login
    const loginOldRes = await client.post('/api/auth/login', {
      email,
      password: oldPassword
    });
    assert.strictEqual(loginOldRes.status, 401);

    // 6. New password logs in successfully
    const loginNewRes = await client.post('/api/auth/login', {
      email,
      password: newPassword
    });
    assert.strictEqual(loginNewRes.status, 200);

    // 7. Accesses dashboard
    const dashRes = await client.get(`/api/dashboard/${profile.sessionId}`);
    assert.strictEqual(dashRes.status, 200);
  });

  test('Test 3: Multi-User Isolation', async () => {
    const emailA = 'usera@example.com';
    const emailB = 'userb@example.com';
    
    // Seed User A and User B
    const userA = await User.create({ email: emailA, password: 'Password123', isVerified: true });
    const profileA = await Profile.create({
      sessionId: userA._id.toString(),
      name: 'User A Profile',
      occupation: 'tailoring'
    });

    const userB = await User.create({ email: emailB, password: 'Password123', isVerified: true });
    const profileB = await Profile.create({
      sessionId: userB._id.toString(),
      name: 'User B Profile',
      occupation: 'handicrafts'
    });

    const clientA = new TestClient(getTestServerUrl());
    const clientB = new TestClient(getTestServerUrl());

    // 1. User A logs in
    const loginARes = await clientA.post('/api/auth/login', { email: emailA, password: 'Password123' });
    assert.strictEqual(loginARes.status, 200);

    // 2. Access dashboard for User A (matches Profile A)
    const dashARes = await clientA.get(`/api/dashboard/${profileA.sessionId}`);
    assert.strictEqual(dashARes.status, 200);
    const dashABody = await dashARes.json();
    assert.ok(dashABody.profile);
    assert.strictEqual(dashABody.profile.name, 'User A Profile');

    // 3. User B logs in
    const loginBRes = await clientB.post('/api/auth/login', { email: emailB, password: 'Password123' });
    assert.strictEqual(loginBRes.status, 200);

    // 4. Access dashboard for User B (matches Profile B)
    const dashBRes = await clientB.get(`/api/dashboard/${profileB.sessionId}`);
    assert.strictEqual(dashBRes.status, 200);
    const dashBBody = await dashBRes.json();
    assert.ok(dashBBody.profile);
    assert.strictEqual(dashBBody.profile.name, 'User B Profile');

    // 5. Verify session isolation: User A's session cookies cannot be used to fetch User B's profile
    const crossResA = await clientA.get(`/api/dashboard/${profileB.sessionId}`);
    assert.ok(crossResA.status === 401 || crossResA.status === 403);

    // And User B's session cookies cannot be used to fetch User A's profile
    const crossResB = await clientB.get(`/api/dashboard/${profileA.sessionId}`);
    assert.ok(crossResB.status === 401 || crossResB.status === 403);
  });

  test('Test 4: Google OAuth Lifecycle', async () => {
    const client = new TestClient(getTestServerUrl());
    const email = 'google_lifecycle@example.com';

    // 1. Google OAuth login first time (auto-creates user)
    const googleLogin1 = await client.post('/api/auth/google', {
      credential: `mock-google-token-${email}`
    });
    assert.strictEqual(googleLogin1.status, 200);

    // Verify user & profile in database directly
    const user = await User.findOne({ email });
    assert.ok(user);
    const profile = await Profile.findOne({ sessionId: user._id.toString() });
    assert.ok(profile);

    // Initializes wallet/rewards to zero
    assert.strictEqual(profile.tokenBalance, 0);
    assert.strictEqual(profile.currentScore, 0);

    // 2. Access dashboard
    const dashRes = await client.get(`/api/dashboard/${profile.sessionId}`);
    assert.strictEqual(dashRes.status, 200);

    // Ensure wallet is initialized by hitting rewards
    const rewardsRes1 = await client.get(`/api/rewards/${profile.sessionId}`);
    assert.strictEqual(rewardsRes1.status, 200);
    const rewardsBody1 = await rewardsRes1.json();
    assert.ok(rewardsBody1.walletAddress);
    const firstWalletAddress = rewardsBody1.walletAddress;

    // 3. Logout
    const logoutRes = await client.post('/api/auth/logout', {});
    assert.strictEqual(logoutRes.status, 200);

    // 4. Google OAuth login second time
    client.clearCookies();
    const googleLogin2 = await client.post('/api/auth/google', {
      credential: `mock-google-token-${email}`
    });
    assert.strictEqual(googleLogin2.status, 200);

    // Access rewards again and check walletAddress and balance
    const rewardsRes2 = await client.get(`/api/rewards/${profile.sessionId}`);
    assert.strictEqual(rewardsRes2.status, 200);
    const rewardsBody2 = await rewardsRes2.json();

    // Returns existing walletAddress and keeps zero balances without recreating profile
    assert.strictEqual(rewardsBody2.walletAddress, firstWalletAddress);
    assert.strictEqual(rewardsBody2.tokenBalance, 0);

    // Verify only 1 profile exists in DB
    const profileCount = await Profile.countDocuments({ sessionId: user._id.toString() });
    assert.strictEqual(profileCount, 1);
  });

  test('Test 5: Rate Limiter Recovery', async () => {
    const client = new TestClient(getTestServerUrl());
    let rateLimited = false;

    // Brute-force requests to login endpoints to trigger rate limits (returns 429)
    for (let i = 0; i < 100; i++) {
      const response = await client.post('/api/auth/login', {
        email: 'bruteforce@example.com',
        password: 'wrongpassword'
      });
      if (response.status === 429) {
        rateLimited = true;
        break;
      }
    }

    assert.strictEqual(rateLimited, true);
  });
});
