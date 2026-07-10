import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Profile from '../models/Profile';
import { profileService } from '../services/ProfileService';
import { generateToken, verifyToken } from '../utils/jwt';

test('Challenger M1.2 Adversarial Verification Test Suite', async (t) => {
  let mongoServer: MongoMemoryServer;

  t.before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  t.after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  await t.test('1. Password Hashing: double-saving and salt uniqueness', async () => {
    const rawPassword = 'InitialSecurePassword123!';
    const user = new User({
      email: 'doublehash@example.com',
      password: rawPassword,
      isVerified: false
    });

    await user.save();

    const hash1 = user.password;
    assert.ok(hash1);
    assert.notStrictEqual(hash1, rawPassword);

    // Save twice without modifying password
    user.isVerified = true;
    await user.save();

    const hash2 = user.password;
    assert.strictEqual(hash2, hash1, 'Password hash should not change if not modified');

    // Save with modified password
    const newRawPassword = 'NewSecurePassword456!';
    user.password = newRawPassword;
    await user.save();

    const hash3 = user.password;
    assert.notStrictEqual(hash3, hash2, 'Password hash must change if password is modified');
    assert.strictEqual(await user.comparePassword(newRawPassword), true, 'comparePassword must return true for new password');
    assert.strictEqual(await user.comparePassword(rawPassword), false, 'comparePassword must return false for old password');

    // Salt uniqueness per user
    const samePassword = 'CommonPassword999!';
    const userA = new User({ email: 'usera@example.com', password: samePassword });
    const userB = new User({ email: 'userb@example.com', password: samePassword });

    await userA.save();
    await userB.save();

    assert.notStrictEqual(userA.password, userB.password, 'Hashes of two users with the same password must be different due to unique salts');
    assert.strictEqual(await userA.comparePassword(samePassword), true);
    assert.strictEqual(await userB.comparePassword(samePassword), true);
  });

  await t.test('2. Profile Mapping: sessionId verification and duplicate checks', async () => {
    const nonexistentSessionId = new mongoose.Types.ObjectId().toString();

    // 2.a: Verify if ProfileService allows creating a profile with a sessionId not matching any User
    const profileNoUser = await profileService.createOrUpdateProfile(nonexistentSessionId, {
      name: 'Ghost User',
      occupation: 'other'
    });

    assert.ok(profileNoUser);
    assert.strictEqual(profileNoUser.sessionId, nonexistentSessionId);
    console.log(`[Challenger Observation] Profile created successfully for a nonexistent user ID: ${nonexistentSessionId}`);

    // 2.b: Verify trying to save duplicate profiles with same sessionId at the model/database level fails
    const duplicateSessionId = new mongoose.Types.ObjectId().toString();

    await Profile.create({
      sessionId: duplicateSessionId,
      name: 'Original Profile',
      occupation: 'tailoring'
    });

    await assert.rejects(
      async () => {
        await Profile.create({
          sessionId: duplicateSessionId,
          name: 'Duplicate Profile',
          occupation: 'beauty'
        });
      },
      (err: any) => {
        // Unique index collision error is 11000
        return err.code === 11000 || err.message.includes('duplicate key') || err.name === 'MongoServerError';
      },
      'Should throw MongoServerError with duplicate key error code'
    );
  });

  await t.test('3. Balance Initialization: zero initialization and input overriding', async () => {
    const user = new User({ email: 'balance@example.com', password: 'password123' });
    await user.save();

    const badData = {
      name: 'Hacker User',
      occupation: 'SHG member',
      tokenBalance: 99999,
      currentScore: 99999,
      tokenHistory: [{ amount: 100, type: 'earn', description: 'injected bonus' }],
      scoreHistory: [{ score: 100, date: new Date() }]
    } as any;

    // 3.a: Check if creation overrides input default balances to 0/empty
    const profile = (await profileService.createOrUpdateProfile(user._id.toString(), badData))!;

    assert.strictEqual(profile.tokenBalance, 0, 'tokenBalance must be initialized to 0');
    assert.strictEqual(profile.currentScore, 0, 'currentScore must be initialized to 0');
    assert.deepStrictEqual(profile.tokenHistory, [], 'tokenHistory must be initialized to empty array');
    assert.deepStrictEqual(profile.scoreHistory, [], 'scoreHistory must be initialized to empty array');

    // 3.b: Check if update path in ProfileService allows overriding balances
    const updateDataWithBalances = {
      name: 'Hacker User Modified',
      occupation: 'beauty',
      tokenBalance: 8888, // adversarial injection
      currentScore: 888,  // adversarial injection
      tokenHistory: [{ amount: 50, type: 'redeem', description: 'injected redeem' }],
      scoreHistory: [{ score: 50, date: new Date() }]
    } as any;

    const updatedProfile = (await profileService.createOrUpdateProfile(user._id.toString(), updateDataWithBalances))!;
    
    // We observe the actual behavior of update
    console.log(`[Challenger Observation] Updated profile tokenBalance: ${updatedProfile.tokenBalance}, currentScore: ${updatedProfile.currentScore}`);
  });

  await t.test('4. JWT Helpers: invalid, expired, and tampered tokens', async () => {
    // 4.a: Invalid token
    assert.throws(
      () => verifyToken('invalid.token.string'),
      (err: any) => err.name === 'JsonWebTokenError' && (err.message.includes('jwt malformed') || err.message.includes('invalid token')),
      'Malformed token must throw JsonWebTokenError'
    );

    // 4.b: Expired token
    const secret = process.env.JWT_SECRET || 'dev_secret_jwt_sign';
    const expiredToken = jwt.sign(
      { userId: '123', email: 'test@example.com', sessionId: '123', exp: Math.floor(Date.now() / 1000) - 10 },
      secret
    );

    assert.throws(
      () => verifyToken(expiredToken),
      (err: any) => err.name === 'TokenExpiredError' && err.message.includes('jwt expired'),
      'Expired token must throw TokenExpiredError'
    );

    // 4.c: Tampered signature
    const tamperedToken = jwt.sign(
      { userId: '123', email: 'test@example.com', sessionId: '123' },
      'totally_different_secret'
    );

    assert.throws(
      () => verifyToken(tamperedToken),
      (err: any) => err.name === 'JsonWebTokenError' && err.message.includes('invalid signature'),
      'Tampered signature must throw JsonWebTokenError'
    );

    // 4.d: Tampered payload
    const validToken = generateToken({ userId: '123', email: 'test@example.com', sessionId: '123' });
    const parts = validToken.split('.');
    const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
    const payloadObj = JSON.parse(payloadStr);
    
    // Tamper with payload
    payloadObj.userId = 'attacker_id';
    
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(payloadObj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    
    const modifiedToken = `${parts[0]}.${tamperedPayloadB64}.${parts[2]}`;

    assert.throws(
      () => verifyToken(modifiedToken),
      (err: any) => err.name === 'JsonWebTokenError' && err.message.includes('invalid signature'),
      'Tampered payload content must invalidate the signature check and throw JsonWebTokenError'
    );
  });
});
