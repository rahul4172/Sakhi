import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User';
import { profileService } from '../services/ProfileService';
import { generateToken, verifyToken } from '../utils/jwt';

test('Authentication Base and User Profile Integration Test Suite', async (t) => {
  let mongoServer: MongoMemoryServer;

  // Setup: start MongoMemoryServer and connect mongoose
  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  // Teardown: disconnect mongoose and stop server
  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  await t.test('1. User Schema Hashing & Password Verification', async () => {
    const rawPassword = 'SecurePassword123!';
    const user = new User({
      email: 'test@example.com',
      password: rawPassword,
      isVerified: false
    });

    await user.save();

    // Verify user password was hashed and is not plain text
    assert.ok(user.password);
    assert.notStrictEqual(user.password, rawPassword);
    assert.strictEqual(user.password.startsWith('$2a$') || user.password.startsWith('$2b$'), true);

    // Verify comparePassword works
    const isMatch = await user.comparePassword(rawPassword);
    assert.strictEqual(isMatch, true);

    const isWrongMatch = await user.comparePassword('WrongPassword');
    assert.strictEqual(isWrongMatch, false);

    // Verify default verification status is false
    assert.strictEqual(user.isVerified, false);
  });

  await t.test('2. Profile Creation Integration (Zero Initialization & ID mapping)', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    assert.ok(user);

    const userIdStr = user._id.toString();

    // Create profile linked to the User._id
    const profile = await profileService.createOrUpdateProfile(userIdStr, {
      name: 'Anjali Sharma',
      occupation: 'tailoring'
    });

    assert.ok(profile);
    assert.strictEqual(profile.sessionId, userIdStr);
    assert.strictEqual(profile.name, 'Anjali Sharma');
    assert.strictEqual(profile.occupation, 'tailoring');

    // Verify zero initialization requirements
    assert.strictEqual(profile.tokenBalance, 0);
    assert.deepStrictEqual(profile.tokenHistory, []);
    assert.strictEqual(profile.currentScore, 0);
    assert.deepStrictEqual(profile.scoreHistory, []);

    // Verify custodial wallet was generated but balance is zero
    assert.ok(profile.walletAddress);
    assert.ok(profile.encryptedPrivateKey);
  });

  await t.test('3. JWT Helpers (generateToken & verifyToken)', async () => {
    const user = await User.findOne({ email: 'test@example.com' });
    assert.ok(user);

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      sessionId: user._id.toString()
    };

    const token = generateToken(payload);
    assert.ok(token);

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.userId, payload.userId);
    assert.strictEqual(decoded.email, payload.email);
    assert.strictEqual(decoded.sessionId, payload.sessionId);
  });
});
