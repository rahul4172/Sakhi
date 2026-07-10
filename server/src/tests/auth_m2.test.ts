import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import http from 'http';
import app from '../app';
import User from '../models/User';
import Profile from '../models/Profile';
import AuditLog from '../models/AuditLog';

test('M2: Email Auth Endpoints Integration Test Suite', async (t) => {
  let mongoServer: MongoMemoryServer;
  let server: http.Server;
  let baseUrl: string;

  // Setup: start MongoMemoryServer, connect mongoose, and start the HTTP server on a random port
  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}/api`;
        }
        resolve();
      });
    });
  });

  // Teardown: disconnect mongoose, stop MongoMemoryServer, and close HTTP server
  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  await t.test('1. POST /api/auth/signup - Successful registration', async () => {
    const response = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Anjali Sharma',
        occupation: 'tailoring',
        isSHG: true
      })
    });

    assert.strictEqual(response.status, 201);
    const body = await response.json();
    assert.strictEqual(body.message, 'Signup successful. Please verify your email.');

    // Verify DB state
    const user = await User.findOne({ email: 'test@example.com' });
    assert.ok(user);
    assert.strictEqual(user.isVerified, false);
    assert.ok(user.verificationToken);

    const profile = await Profile.findOne({ sessionId: user._id.toString() });
    assert.ok(profile);
    assert.strictEqual(profile.name, 'Anjali Sharma');
    assert.strictEqual(profile.occupation, 'tailoring');
    assert.strictEqual(profile.tokenBalance, 0);

    // Verify AuditLog creation (fallback since SMTP is not configured)
    const auditLogs = await AuditLog.find({ userId: user._id.toString(), action: 'EMAIL_VERIFICATION_LINK' });
    assert.strictEqual(auditLogs.length, 1);
    assert.strictEqual(auditLogs[0].details.token, user.verificationToken);
  });

  await t.test('2. POST /api/auth/signup - Duplicate email failure', async () => {
    const response = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'TEST@example.com', // test case-insensitivity
        password: 'AnotherPassword123!',
        name: 'Anjali Duplicate',
        occupation: 'beauty',
        isSHG: false
      })
    });

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.message, 'Email already in use');
  });

  await t.test('3. GET /api/auth/verify-email - Successful verification', async () => {
    const userBefore = await User.findOne({ email: 'test@example.com' });
    assert.ok(userBefore);
    const token = userBefore.verificationToken;
    assert.ok(token);

    const response = await fetch(`${baseUrl}/auth/verify-email?token=${token}`);
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.message, 'Email verified successfully.');

    // Verify DB state
    const userAfter = await User.findOne({ email: 'test@example.com' });
    assert.ok(userAfter);
    assert.strictEqual(userAfter.isVerified, true);
    assert.strictEqual(userAfter.verificationToken, undefined);
  });

  await t.test('4. GET /api/auth/verify-email - Invalid token failure', async () => {
    const response = await fetch(`${baseUrl}/auth/verify-email?token=non_existent_token_123`);
    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.message, 'Invalid or expired verification token.');
  });

  await t.test('5. POST /api/auth/login - Unverified user failure', async () => {
    // Register another user but do not verify
    const signupResponse = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unverified@example.com',
        password: 'Password123!',
        name: 'Unverified User',
        occupation: 'other',
        isSHG: false
      })
    });
    assert.strictEqual(signupResponse.status, 201);

    // Attempt login
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unverified@example.com',
        password: 'Password123!'
      })
    });

    assert.strictEqual(loginResponse.status, 401);
    const loginBody = await loginResponse.json();
    assert.strictEqual(loginBody.message, 'Email not verified. Please verify your email.');
  });

  await t.test('6. POST /api/auth/login - Invalid credentials', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'WrongPassword!'
      })
    });

    assert.strictEqual(response.status, 401);
    const body = await response.json();
    assert.strictEqual(body.message, 'Invalid credentials');
  });

  await t.test('7. POST /api/auth/login - Successful login & JWT Cookie', async () => {
    const response = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePassword123!'
      })
    });

    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.message, 'Login successful');
    assert.ok(body.user);
    assert.strictEqual(body.user.email, 'test@example.com');
    assert.strictEqual(body.user.name, 'Anjali Sharma');

    // Check Set-Cookie headers
    const cookieHeader = response.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.strictEqual(cookieHeader.includes('token='), true);
    assert.strictEqual(cookieHeader.includes('HttpOnly'), true);
    assert.strictEqual(cookieHeader.includes('Secure'), true);
    assert.strictEqual(cookieHeader.includes('SameSite=Strict'), true);
  });

  await t.test('8. POST /api/auth/logout - Clear Cookie', async () => {
    const response = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.message, 'Logged out successfully');

    // Check cookie clear headers
    const cookieHeader = response.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.strictEqual(cookieHeader.includes('token='), true);
    assert.strictEqual(cookieHeader.includes('Max-Age=0'), true);
  });

  await t.test('9. POST /api/auth/forgot-password - Successful request', async () => {
    const response = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' })
    });

    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.message, 'Password reset email sent if account exists.');

    // Verify DB states and AuditLog
    const user = await User.findOne({ email: 'test@example.com' });
    assert.ok(user);
    assert.ok(user.resetToken);
    assert.ok(user.resetTokenExpires);

    const auditLogs = await AuditLog.find({ userId: user._id.toString(), action: 'PASSWORD_RESET_LINK' });
    assert.strictEqual(auditLogs.length, 1);
    assert.ok(auditLogs[0].details.token);
  });

  await t.test('10. POST /api/auth/forgot-password - User enumeration protection', async () => {
    const response = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent_user@example.com' })
    });

    // Should return 200 success message to protect privacy
    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.message, 'Password reset email sent if account exists.');
  });

  await t.test('11. POST /api/auth/reset-password - Invalid token failure', async () => {
    const response = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid_reset_token_456',
        newPassword: 'MyNewSecurePassword1!'
      })
    });

    assert.strictEqual(response.status, 400);
    const body = await response.json();
    assert.strictEqual(body.message, 'Password reset token is invalid or has expired.');
  });

  await t.test('12. POST /api/auth/reset-password - Successful reset', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    assert.ok(user);

    const auditLogs = await AuditLog.find({ userId: user._id.toString(), action: 'PASSWORD_RESET_LINK' });
    assert.strictEqual(auditLogs.length, 1);
    const rawToken = auditLogs[0].details.token;

    const response = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        newPassword: 'MyNewSecurePassword1!'
      })
    });

    assert.strictEqual(response.status, 200);
    const body = await response.json();
    assert.strictEqual(body.message, 'Password reset successful.');

    // Verify DB is cleared
    const updatedUser = await User.findOne({ email: 'test@example.com' });
    assert.ok(updatedUser);
    assert.strictEqual(updatedUser.resetToken, undefined);
    assert.strictEqual(updatedUser.resetTokenExpires, undefined);

    // Verify login with new password
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'MyNewSecurePassword1!'
      })
    });
    assert.strictEqual(loginResponse.status, 200);
  });
});
