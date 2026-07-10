# Review Report — Milestone M1: User Schema & Auth Base

**Verdict**: PASS (APPROVE)

---

## Review Summary
Milestone M1 has been successfully implemented and passes all code quality, correctness, and security foundation checks. The required changes to `server/src/models/User.ts`, `server/src/utils/jwt.ts`, and `server/src/services/ProfileService.ts` have been written cleanly, conform to TypeScript standards, and successfully pass the integration tests.

---

## Verified Claims

- **Password Hashing & Matching** &rarr; verified via `src/tests/auth.test.ts` (Test 1) &rarr; **PASS**
  - High-security hashing via `bcryptjs` with salt round factor of 10.
  - The pre-save hook correctly hashes only when the password field is modified or created.
  - The `comparePassword` method successfully matches the raw password against the hashed string, and handles missing passwords gracefully (e.g., returning `false` for OAuth-only users).

- **Profile Initialization & Mapping** &rarr; verified via `src/tests/auth.test.ts` (Test 2) &rarr; **PASS**
  - Mapped `Profile.sessionId` to the stringified Mongoose `User._id`.
  - Zero-balanced initialization: `tokenBalance: 0`, `currentScore: 0`, and empty history arrays.
  - Generates custodial blockchain wallet securely with zero initial balances (ensuring no mock scores/balances).

- **JWT Session Utilities** &rarr; verified via `src/tests/auth.test.ts` (Test 3) &rarr; **PASS**
  - `generateToken` and `verifyToken` helpers successfully sign and decode the session payload containing `userId`, `email`, and `sessionId`.
  - Signature verification throws errors correctly on token tampering or expiration.

---

## Findings & Critical Review

### [Minor] Finding 1: JWT Secret Fallback Risk
- **What**: Fallback key `'dev_secret_jwt_sign'` is used when `process.env.JWT_SECRET` is not set.
- **Where**: `server/src/utils/jwt.ts` line 3-4.
- **Why**: Allows execution locally without configuration, but creates a security risk if the environment is deployed to production without defining `JWT_SECRET`.
- **Suggestion**: Add a check in `server/src/utils/jwt.ts` or during backend startup that throws an error if `process.env.NODE_ENV === 'production'` and `process.env.JWT_SECRET` is not defined or is equal to the fallback string.

### [Minor] Finding 2: Safe Bypassing of Password Hashing
- **What**: Mongoose pre-save hook checks `!user.password` to bypass hashing.
- **Where**: `server/src/models/User.ts` line 53.
- **Why**: This is required for Google OAuth users who do not have passwords. However, we must ensure the controller validation (Zod/express-validator) in M2 strictly blocks empty strings `""` for regular signup.
- **Suggestion**: Confirm request validation is configured in Milestone M2 to avoid storing empty passwords.

---

## Coverage Gaps
- **Endpoint Route Validation** &mdash; risk level: **Low** &mdash; recommendation: **Accept risk** (out of scope for M1, to be covered in Milestone M2/M6).
- **Session Cookie Storage** &mdash; risk level: **Low** &mdash; recommendation: **Accept risk** (out of scope for M1, token storage and Cookie configuration to be implemented in M2/M4).

---

## Unverified Items
- **Actual SMTP email dispatch** &mdash; SMTP transport logic is not yet implemented or tested in M1 (planned for M2).
