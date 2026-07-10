# Challenger Report: Milestone M1 Robustness Verification

## Challenge Summary

**Overall risk assessment**: MEDIUM

While the basic functionality (hashing, unique constraints, JWT parsing, and happy path zero-initialization) is correctly implemented and works as expected, we found two main design gaps that could lead to security or data integrity issues:
1. **Missing User Verification on Profile Creation**: Profiles can be created for any `sessionId` (user ID) even if no corresponding User document exists in the database.
2. **Mass Assignment Vulnerability in Profile Updates**: The `ProfileService.createOrUpdateProfile` method does not filter update fields, which allows updating read-only fields like `tokenBalance` and `currentScore` if called with an unsanitized payload.

---

## 1. Observation

- **User Password Hashing**: In `server/src/models/User.ts`:
  - Hook check (line 53): `if (!user.isModified('password') || !user.password) { return; }`
  - Hashing mechanism (lines 57-58):
    ```typescript
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(user.password, salt);
    ```
- **Profile Unique Constraint**: In `server/src/models/Profile.ts`:
  - SessionId definition (lines 27-31):
    ```typescript
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    ```
- **Profile Initialization & Update**: In `server/src/services/ProfileService.ts`:
  - Update logic (lines 7-10):
    ```typescript
    let profile = await profileRepository.findBySessionId(sessionId);
    if (profile) {
      await profileRepository.update({ sessionId }, data);
      return profileRepository.findBySessionId(sessionId);
    }
    ```
  - Create logic (lines 15-25):
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
- **JWT Helper Verification**: In `server/src/utils/jwt.ts`:
  - Token verification (line 28): `return jwt.verify(token, JWT_SECRET) as ...`

- **Adversarial Test Execution Output**:
  - Test command: `npx tsx --test src/tests/challenger_m1_2.test.ts`
  - Output snippet:
    ```
    ▶ Challenger M1.2 Adversarial Verification Test Suite
      ✔ 1. Password Hashing: double-saving and salt uniqueness (958.1792ms)
    [Challenger Observation] Profile created successfully for a nonexistent user ID: 6a509810fc1d9c830141c432
      ✔ 2. Profile Mapping: sessionId verification and duplicate checks (80.9918ms)
    [Challenger Observation] Updated profile tokenBalance: 8888, currentScore: 888
      ✔ 3. Balance Initialization: zero initialization and input overriding (110.9636ms)
      ✔ 4. JWT Helpers: invalid, expired, and tampered tokens (3.3062ms)
    ✔ Challenger M1.2 Adversarial Verification Test Suite (1227.8454ms)
    ```

---

## 2. Logic Chain

1. **Password Hashing**:
   - Because `user.isModified('password')` is checked prior to hashing, calling `save()` on a user with modified non-password fields (like `isVerified`) does not re-hash the existing password hash. This was verified as `hash2 === hash1` in test 1.
   - Because `bcryptjs.genSalt(10)` is invoked separately per save operation, two users registering with the exact same password receive different salt inputs, producing distinct hash strings. This was verified as `userA.password !== userB.password` in test 1.
2. **Profile Mapping**:
   - Because `ProfileSchema` specifies `sessionId` is `unique: true`, saving two separate documents with the identical `sessionId` directly to the collection fails with error code `11000`. This was verified in test 2.
   - However, since `ProfileService.createOrUpdateProfile` does not perform a database lookup for the user matching `sessionId` prior to profile creation, a profile can be created and stored successfully even if the `sessionId` is arbitrary and does not map to any actual User record in the database.
3. **Balance Initialization & Mass Assignment**:
   - During the creation branch of `createOrUpdateProfile`, the properties `tokenBalance`, `currentScore`, `tokenHistory`, and `scoreHistory` are explicitly written after spreading `...data`. Thus, any balances provided in the initial data payload are overwritten by the default values (`0` and `[]`).
   - However, during the update branch, the update payload `data` is forwarded directly to `profileRepository.update` without sanitizing read-only fields. Thus, if a caller passes `tokenBalance` or `currentScore` in the data argument to the service, the database will be updated with those values (observed as balance updating to `8888` and score to `888` in test 3). While the current controller handles sanitization via Zod, this represents a lack of defense-in-depth at the service layer.
4. **JWT Security**:
   - Because `verifyToken` relies directly on `jwt.verify`, any malformed, expired, or signature-tampered tokens throw corresponding JWT errors (`JsonWebTokenError` or `TokenExpiredError`), ensuring unauthenticated or tampered payloads are rejected. This was verified in test 4.

---

## 3. Challenges

### [Medium] Challenge 1: Mass Assignment Vulnerability in Profile Service Updates
- **Assumption challenged**: The service assumes that callers will only pass valid profile-updatable fields.
- **Attack scenario**: If a future developer updates the controller's Zod schema or adds a new route/service method that does not sanitize input, an attacker can modify their `tokenBalance` or `currentScore` directly.
- **Blast radius**: User scores and token balances could be manipulated directly via profile update calls.
- **Mitigation**: Sanitize `data` inside the `ProfileService.createOrUpdateProfile` update block to omit `tokenBalance`, `tokenHistory`, `currentScore`, `scoreHistory`, `walletAddress`, and `encryptedPrivateKey`.

### [Low] Challenge 2: Lack of Referential Integrity between User and Profile
- **Assumption challenged**: Every Profile belongs to a valid User.
- **Attack scenario**: A client could call the profile creation endpoint with a dummy `sessionId` and create orphan profiles.
- **Blast radius**: Accumulation of orphan profile and settings records in the database.
- **Mitigation**: Verify the user exists using `userRepository.findById(sessionId)` or a similar check before creating a profile in `ProfileService.createOrUpdateProfile`.

---

## 4. Caveats

- Tests were executed using an in-memory Mongo database (`mongodb-memory-server`). Real MongoDB behavior (e.g. replica sets, clustering) was not tested.
- Blockchain functions are mocked in the service due to the absence of the `DISTRIBUTOR_PRIVATE_KEY` in testing.

---

## 5. Conclusion

**Verdict**: PASS (with warnings on vulnerabilities)

The implementation meets the core requirements of Milestone M1. Basic password hashing, salt uniqueness, zero initialization on profile creation, and JWT helper token verification work as designed. However, the identified mass assignment vulnerability and the lack of referential integrity check should be fixed to ensure long-term robustness.

---

## 6. Verification Method

To verify the test suite yourself, run the following commands:

```bash
cd d:\Sakhi-main\Sakhi-main\server
npx tsx --test src/tests/challenger_m1_2.test.ts
```

Files to inspect:
- Test script: `server/src/tests/challenger_m1_2.test.ts`
- Briefing log: `.agents/teamwork_preview_challenger_m1_2/BRIEFING.md`
