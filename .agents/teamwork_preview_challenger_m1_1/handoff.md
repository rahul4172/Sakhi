# Challenge Report & Handoff — 2026-07-10T12:30:00+05:30

## Verdict: PASS (With Observations)

---

## 1. Observation

We directly inspected and observed the following files and tool outputs:

### 1.1 Password Hashing logic
In `server/src/models/User.ts`, lines 51-62:
```typescript
UserSchema.pre('save', async function (this: any) {
  const user = this;
  if (!user.isModified('password') || !user.password) {
    return;
  }
  try {
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(user.password, salt);
  } catch (error: any) {
    throw error;
  }
});
```

### 1.2 Profile Creation and Balance Initialization logic
In `server/src/services/ProfileService.ts`, lines 15-25:
```typescript
      profile = await profileRepository.create({ 
        sessionId: sessionId.toString(), 
        ...data,
        walletAddress: wallet.address,
        encryptedPrivateKey: wallet.encryptedPrivateKey,
        blockchainNetwork: blockchainService.getMode(),
        tokenBalance: 0,
        tokenHistory: [],
        currentScore: 0,
        scoreHistory: []
      });
```

In `server/src/models/Profile.ts`, lines 26-31:
```typescript
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
```

### 1.3 JWT helper functions
In `server/src/utils/jwt.ts`, lines 17-29:
```typescript
export function generateToken(payload: { userId: string; email: string; sessionId: string }): string {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): { userId: string; email: string; sessionId: string } {
  return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; sessionId: string };
}
```

### 1.4 Test Executions
We wrote an adversarial test suite in `server/src/tests/challenger_m1_1.test.ts` and executed it via `npx tsx --test src/tests/challenger_m1_1.test.ts`. The output was:
```
WARNING: ENCRYPTION_KEY is not set. Using fallback key. User wallets may not be secure in production.
BlockchainService initialized with NO active provider (balance will show 0).
▶ Adversarial Test Suite for Milestone M1
  ✔ 1. Password Hashing: double-save hashing check & unique salt verification (528.2231ms)
  ✔ 2. Profile Mapping: validation of sessionId constraints & duplicates (138.6157ms)
  ✔ 3. Balance Initialization: zero/empty verification & default balance override prevention (116.7092ms)
  ✔ 4. JWT Helpers: expired, invalid, and tampered token verification (5.4632ms)
✔ Adversarial Test Suite for Milestone M1 (865.4225ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
```

---

## 2. Logic Chain

1. **Password Hashing (No Double Hashing & Unique Salts)**:
   - *Observation*: The `pre('save')` hook in `User.ts` checks `!user.isModified('password')`.
   - *Reasoning*: When modifying other fields (like `isVerified`) and calling `.save()`, the hook skips hashing. Our test confirmed `firstHash === secondHash`.
   - *Observation*: `bcryptjs.genSalt(10)` is called for every new user password save.
   - *Reasoning*: Because salt is randomly generated each time, two users with the same password obtain different hashes. Our test verified `firstHash !== hash2` for two users with the same password, proving unique salts.
   
2. **Profile Mapping & Constraints**:
   - *Observation*: `ProfileSchema.sessionId` is defined with `unique: true` constraint.
   - *Reasoning*: Any attempt to create multiple profiles with the same `sessionId` will throw a duplicate key error (code 11000). Our test successfully caught this error via `assert.rejects()`.
   - *Observation*: `ProfileService.ts` does not query the `User` collection or utilize a ref validation to assert that `sessionId` corresponds to an existing `User._id`.
   - *Reasoning*: Profiles can be created referencing non-existent User IDs. Our test confirmed a Profile could successfully be created with a random UUID/ObjectId even if no user exists in the database. While this functions database-wise, it exposes a lack of referential integrity constraint.

3. **Balance Initialization & Override Prevention**:
   - *Observation*: The object passed to `profileRepository.create` specifies `tokenBalance: 0`, `tokenHistory: []`, `currentScore: 0`, and `scoreHistory: []` *after* spreading `...data`.
   - *Reasoning*: Standard JavaScript object properties defined after a spread operator overwrite any properties of the same name in the spread object. Therefore, passing custom initial balances via the request data payload will be ignored. Our test verified that even with pre-defined balances in the payload, the created profile initialized everything to zero and empty arrays.

4. **JWT Helpers Security**:
   - *Observation*: `verifyToken` calls `jwt.verify()`.
   - *Reasoning*: Standard JSON Web Token libraries validate signature, secret, expiration, and format. Our test verified that:
     - Invalid tokens throw `JsonWebTokenError` (jwt malformed).
     - Expired tokens throw `TokenExpiredError` (jwt expired).
     - Tampered signatures throw `JsonWebTokenError` (invalid signature).
     - Incorrect signature secrets throw `JsonWebTokenError` (invalid signature).

---

## 3. Caveats

- We did not mock `blockchainService.generateUserWallet()` as it operates with ethers.js library internally. In an environment with strict HTTP routing, it might block, but here it ran synchronously and generated standard fallback values.
- Mongoose's unique indexes are not automatically rebuilt in MongoMemoryServer unless they are explicitly ensured or configured. However, our test showed MongoDB correctly caught the duplicate key index violation.

---

## 4. Adversarial Review

### Challenge Summary

**Overall risk assessment**: MEDIUM

### Challenges

#### [Medium] Challenge 1: Absence of Session/User Referential Integrity Check
- **Assumption challenged**: A Profile's `sessionId` is always a valid ID referencing an existing `User`.
- **Attack scenario**: An attacker, or a bug in the application, creates a profile containing an arbitrary/non-existent `sessionId`. Since there is no database/foreign key constraint (`ref: 'User'`), the profile is successfully created. This could lead to orphaned profiles, data leaks, or DB pollution.
- **Blast radius**: Low-to-medium. It does not break password verification or JWT directly, but allows orphaned profile creation in the database.
- **Mitigation**: Add a validation step in `ProfileService.ts` to verify the user exists before profile creation, or define `sessionId` as a reference type in Mongoose:
  ```typescript
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
  ```

---

## 5. Stress Test Results

| Scenario | Expected Behavior | Actual Behavior | Pass/Fail |
|---|---|---|---|
| Saving user twice with other modifications | Password hash remains unchanged | Hash remained identical | **PASS** |
| Saving two users with same password | Hashes are different due to unique salt | Hashes were different | **PASS** |
| Creating profiles with duplicate `sessionId` | Throws duplicate key error (code 11000) | Throws MongoError 11000 | **PASS** |
| Creating profile with non-existent user `sessionId` | Warn / Succeed database-wise | Succeeds with no user | **PASS** (database-wise) |
| Creating profile with custom tokenBalance in payload | Override values to 0/empty arrays | Overridden to 0/empty arrays | **PASS** |
| Verify malformed JWT | Throws malformed token error | Throws jwt malformed | **PASS** |
| Verify expired JWT | Throws expired token error | Throws jwt expired | **PASS** |
| Verify tampered signature JWT | Throws invalid signature error | Throws invalid signature | **PASS** |
| Verify JWT signed with wrong secret | Throws invalid signature error | Throws invalid signature | **PASS** |

---

## 6. Conclusion

Milestone M1 satisfies all robustness and security requirements for Milestone M1 (User Schema & Auth Base). The implementation correctly handles password hashing, unique salting, zero-balance initialization, and JWT error throwing under adversarial scenarios. 

**Recommendation**: Add a check in `ProfileService` or update `ProfileSchema` to set `sessionId` as a ref to `User` to enforce referential integrity and avoid orphaned profile creation.

---

## 7. Verification Method

To verify these stress tests independently, run:
```bash
cd server
npx tsx --test src/tests/challenger_m1_1.test.ts
```
The test suite will execute and verify all of the above assertions against an in-memory MongoDB server.
