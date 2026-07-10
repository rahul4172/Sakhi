# Handoff Report — reviewer_m1_2

## 1. Observation

- **User Model (`server/src/models/User.ts`)**:
  - Implements the password-hashing pre-save hook at lines 51-62:
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
  - Implements password comparison at lines 65-70:
    ```typescript
    UserSchema.methods.comparePassword = async function (this: any, password: string): Promise<boolean> {
      if (!this.password) {
        return false;
      }
      return bcryptjs.compare(password, this.password);
    };
    ```
- **Profile Initialization (`server/src/services/ProfileService.ts`)**:
  - Sets balance/score fields to zero/empty at lines 15-25:
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
- **JWT Helpers (`server/src/utils/jwt.ts`)**:
  - Implements sign and verify operations at lines 17-29:
    ```typescript
    export function generateToken(payload: { userId: string; email: string; sessionId: string }): string {
      const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
      return jwt.sign(payload, JWT_SECRET, options);
    }

    export function verifyToken(token: string): { userId: string; email: string; sessionId: string } {
      return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; sessionId: string };
    }
    ```
- **Test Executions**:
  - Ran `npx tsx --test src/tests/auth.test.ts` in `d:\Sakhi-main\Sakhi-main\server` directory. The test suite successfully completed:
    ```
    ▶ Authentication Base and User Profile Integration Test Suite
      ✔ 1. User Schema Hashing & Password Verification (562.6599ms)
      ✔ 2. Profile Creation Integration (Zero Initialization & ID mapping) (115.9317ms)
      ✔ 3. JWT Helpers (generateToken & verifyToken) (4.6592ms)
    ✔ Authentication Base and User Profile Integration Test Suite (758.2994ms)
    ```

---

## 2. Logic Chain

- **Password Security**: The Mongoose pre-save hook dynamically hashes the password using `bcryptjs` before committing to the DB, ensuring raw passwords are never stored. The `comparePassword` instance method securely validates passwords, and fails gracefully for passwordless Google OAuth users (returning `false`).
- **Profile Zero Initialization & ID mapping**: Newly created user profiles have their `sessionId` set to the stringified version of the User model's `_id`. Balance and credit scores are initialized to `0` / empty arrays, which conforms to the zero mock balances requirement in `PROJECT.md` R1.
- **JWT Conformance**: The JWT signing and verification utilities use the standard library `jsonwebtoken` with configurable secrets and expiry durations, producing standard signed tokens that securely encapsulate `userId`, `email`, and `sessionId`.
- **Integrity**: Independent execution of the node unit/integration test suite validates all of the above behaviours against a fresh memory-backed database instance. All assertions passed.

---

## 3. Caveats

- **Out of Scope Code base Compiler Issues**: Pre-existing compiler warnings or typing mismatches present in other parts of the backend controller files (which were not created or edited in Milestone M1) were ignored during this review.
- **JWT Exceptions**: Invalid or expired tokens passed to `verifyToken` will raise synchronous runtime errors (`JsonWebTokenError` / `TokenExpiredError`). The route controllers or auth middleware in subsequent milestones must correctly wrap verify calls inside try-catch block handlers.

---

## 4. Conclusion

The implementation for Milestone M1 (User Schema & Auth Base) is verified as correct, clean, secure, and functionally complete. No integrity violations or dummy facades were detected. The verdict is **PASS**.

---

## 5. Verification Method

To verify the implementation independently, run the following test script inside the `server/` directory:
```powershell
npx tsx --test src/tests/auth.test.ts
```
Ensure all tests execute successfully and print the checkmarks for all three core components (User Schema, Profile Integration, JWT Helpers).
