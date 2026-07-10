import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../models/User';
import Profile from '../models/Profile';
import { profileService } from '../services/ProfileService';
import { generateToken, verifyToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

test('Adversarial Test Suite for Milestone M1', async (t) => {
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

  await t.test('1. Password Hashing: double-save hashing check & unique salt verification', async () => {
    const rawPassword = 'AdversarialPassword123!';
    const user = new User({
      email: 'test_hash_double@example.com',
      password: rawPassword,
      isVerified: false
    });

    await user.save();
    const firstHash = user.password;
    assert.ok(firstHash);

    // Save twice without changing the password (e.g. changing isVerified)
    user.isVerified = true;
    await user.save();
    const secondHash = user.password;
    
    // Check that saving again (with password unmodified) did NOT double-hash
    assert.strictEqual(firstHash, secondHash, 'Password should not double-hash when other fields are modified');

    // Create a second user with the exact same password and check if salts are unique (hashes should be different)
    const user2 = new User({
      email: 'test_hash_unique@example.com',
      password: rawPassword,
      isVerified: false
    });
    await user2.save();
    const hash2 = user2.password;
    assert.ok(hash2);
    assert.notStrictEqual(firstHash, hash2, 'Salts must be unique per user resulting in different hashes');
  });

  await t.test('2. Profile Mapping: validation of sessionId constraints & duplicates', async () => {
    // 2a. Duplicate check: Trying to create profiles with duplicate userIds/sessionIds fails
    const sessionId = new mongoose.Types.ObjectId().toString();
    const p1 = await profileService.createOrUpdateProfile(sessionId, {
      name: 'User One',
      occupation: 'beauty'
    });
    assert.ok(p1);

    // Now try to directly save/create another profile with duplicate sessionId in DB (should fail unique constraint)
    const duplicateProfile = new Profile({
      sessionId: sessionId,
      name: 'User Two',
      occupation: 'tailoring'
    });

    await assert.rejects(
      async () => {
        await duplicateProfile.save();
      },
      (err: any) => {
        return err && (err.code === 11000 || err.message.includes('duplicate key'));
      },
      'Should throw duplicate key error on duplicate sessionId'
    );

    // 2b. Validity of sessionId matching a User._id
    // Test if a Profile can be created with a sessionId that does not exist in the User collection.
    // If it succeeds, we note that the DB/application level does not enforce foreign key referential integrity on profile creation.
    const nonExistentUserId = new mongoose.Types.ObjectId().toString();
    const profileWithoutUser = await profileService.createOrUpdateProfile(nonExistentUserId, {
      name: 'No User Profile',
      occupation: 'handicrafts'
    });
    assert.ok(profileWithoutUser, 'Profile created without a matching User should succeed at database level but indicates lack of referential integrity check');
    assert.strictEqual(profileWithoutUser.sessionId, nonExistentUserId);
  });

  await t.test('3. Balance Initialization: zero/empty verification & default balance override prevention', async () => {
    const user = new User({
      email: 'test_balance@example.com',
      password: 'SomePassword123!',
      isVerified: true
    });
    await user.save();
    const userIdStr = user._id.toString();

    // Call profile creation attempting to pass initial balance/score to verify it is overridden/ignored
    const payloadWithBalances = {
      name: 'Anjali Sharma',
      occupation: 'tailoring',
      tokenBalance: 500,
      currentScore: 80,
      tokenHistory: [{ amount: 100, type: 'earn', description: 'bonus' }],
      scoreHistory: [{ score: 80 }]
    } as any;

    const profile = await profileService.createOrUpdateProfile(userIdStr, payloadWithBalances);
    assert.ok(profile);
    assert.strictEqual(profile.tokenBalance, 0, 'Passed tokenBalance should be ignored and overridden to 0');
    assert.strictEqual(profile.currentScore, 0, 'Passed currentScore should be ignored and overridden to 0');
    assert.deepStrictEqual(profile.tokenHistory, [], 'Passed tokenHistory should be ignored and overridden to empty array');
    assert.deepStrictEqual(profile.scoreHistory, [], 'Passed scoreHistory should be ignored and overridden to empty array');
  });

  await t.test('4. JWT Helpers: expired, invalid, and tampered token verification', async () => {
    const payload = {
      userId: new mongoose.Types.ObjectId().toString(),
      email: 'jwt_test@example.com',
      sessionId: new mongoose.Types.ObjectId().toString()
    };

    // 4a. Verify token is generated correctly and parsed correctly under happy path
    const validToken = generateToken(payload);
    const decoded = verifyToken(validToken);
    assert.strictEqual(decoded.userId, payload.userId);

    // 4b. Invalid tokens
    assert.throws(() => {
      verifyToken('not-a-valid-jwt-token-at-all');
    }, /jwt malformed/i);

    // 4c. Expired tokens
    const secret = process.env.JWT_SECRET || 'dev_secret_jwt_sign';
    const expiredToken = jwt.sign(payload, secret, { expiresIn: '-1s' });
    assert.throws(() => {
      verifyToken(expiredToken);
    }, /jwt expired/i);

    // 4d. Tampered signature
    const parts = validToken.split('.');
    assert.strictEqual(parts.length, 3);
    const tamperedSignatureStr = parts[2].slice(0, -1) + (parts[2].slice(-1) === 'a' ? 'b' : 'a');
    const tamperedToken = `${parts[0]}.${parts[1]}.${tamperedSignatureStr}`;
    assert.throws(() => {
      verifyToken(tamperedToken);
    }, /invalid signature/i);

    // 4e. Incorrect secret
    const badSecretToken = jwt.sign(payload, 'incorrect_secret_key');
    assert.throws(() => {
      verifyToken(badSecretToken);
    }, /invalid signature/i);
  });
});
