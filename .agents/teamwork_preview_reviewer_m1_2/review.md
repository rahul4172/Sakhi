# Milestone M1 Review Report: User Schema & Auth Base

**Verdict**: PASS

---

## Part 1: Quality Review

### Review Summary
The implementation for Milestone M1 (User Schema & Auth Base) is clean, complete, and conforms to the project specification outlined in `PROJECT.md` and `SCOPE.md`. Password hashing via `bcryptjs` is secure, JWT token signing/verification utils work correctly, and user profiles are initialized to zero balances upon registration without mock credit scores or tokens.

### Findings

#### [Minor] Finding 1: Lack of Schema-level Email Format Validation
- **What**: The `UserSchema` validates uniqueness, lowercase conversion, and trimming for the email property, but does not use a regex or validator for email format compliance.
- **Where**: `server/src/models/User.ts`, lines 18-24
- **Why**: Even though controller-level validation is planned for subsequent milestones (M2), adding schema-level email validation prevents invalid email formats from entering the database via direct database operations or other services.
- **Suggestion**: Add a basic regex or validator to the Mongoose `email` property config:
  ```typescript
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: (v: string) => /^\S+@\S+\.\S+$/.test(v),
      message: 'Invalid email format'
    }
  }
  ```

#### [Minor] Finding 2: Missing Application Startup Check for JWT_SECRET in Production
- **What**: `JWT_SECRET` defaults to `'dev_secret_jwt_sign'` when the environment variable is not defined.
- **Where**: `server/src/utils/jwt.ts`, lines 3-4
- **Why**: Using a fallback secret is convenient for development but insecure in production. If the environment variable is accidentally omitted in production, the application will silently fall back to the insecure default.
- **Suggestion**: Throw an error or warn loudly if `NODE_ENV === 'production'` and `JWT_SECRET` is using the fallback.

---

### Verified Claims

| Claim | Verification Method | Result |
|---|---|---|
| User passwords are encrypted with bcryptjs | Verified via `node:test` suite asserting password starts with `$2a$` or `$2b$` and doesn't match plain text | PASS |
| User password verification (`comparePassword`) works correctly | Verified via `node:test` suite testing correct and incorrect raw password inputs | PASS |
| User Profile `sessionId` maps to `User._id` | Verified via integration test asserting `profile.sessionId === user._id.toString()` | PASS |
| Fresh user profile is initialized to zero/empty values | Verified via integration test asserting `tokenBalance: 0`, `tokenHistory: []`, `currentScore: 0`, `scoreHistory: []` | PASS |
| JWT token generation and verification utility works correctly | Verified via token generation followed by decoding/verification checks | PASS |

---

### Coverage Gaps

- **Schema-level Email Validation** — risk level: low — recommendation: accept risk or implement validation in schema/controller level.
- **Production environment JWT safety check** — risk level: low — recommendation: implement checks during server bootstrap/startup in subsequent milestones.

---

### Unverified Items

- **Real Google OAuth verification flow** — reason not verified: out of scope for M1 (scheduled for M3).

---

## Part 2: Adversarial Review

### Challenge Summary
The overall risk assessment of the implemented base authentication modules is **LOW**. There are minor edge cases related to environment configuration values and error handling in JWT decryption, but nothing that compromises the design.

### Challenges

#### [Low] Challenge 1: Invalid Token Expiration Value
- **Assumption challenged**: The system assumes `JWT_EXPIRES_IN` will always contain a valid time duration string (e.g. `'24h'`, `'1d'`).
- **Attack scenario**: If `JWT_EXPIRES_IN` is set to an invalid value (e.g., `'invalid'`) in `.env`, calls to `generateToken` will crash the server or throw an unhandled exception because `jwt.sign` will fail.
- **Blast radius**: Authentication endpoints (Signup/Login) will return 500 server errors.
- **Mitigation**: Add a startup validator or fallback mechanism to ensure `JWT_EXPIRES_IN` is valid.

#### [Low] Challenge 2: Email Case Invariance
- **Assumption challenged**: The email comparison and unique check rely on the database schema converting emails to lowercase.
- **Attack scenario**: If a user signs up with `Test@Example.com` and then logs in with `test@example.com`, Mongoose correctly uses `lowercase: true` to save the lowercase representation. However, any manual raw MongoDB queries bypassing Mongoose model hooks or schema definitions could cause duplicate/inconsistent entries if not careful.
- **Blast radius**: Low, as Mongoose is used everywhere in the application.
- **Mitigation**: Ensure all query paths use the Mongoose model or transform inputs to lowercase.

---

### Stress Test Results

- **Invalid Password Verification** → Expected to fail authentication → Actual behavior: returns `false` safely → PASS
- **Google OAuth User Password Comparison** → Expected to return `false` without throwing → Actual behavior: returns `false` since `user.password` is not defined → PASS
- **Invalid JWT Token Verification** → Expected to throw an error → Actual behavior: `jwt.verify` throws a `JsonWebTokenError`, which must be caught by middleware → PASS

---

### Unchallenged Areas

- **Middleware JWT interception** — reason not challenged: Middleware protection is scheduled for M4.
