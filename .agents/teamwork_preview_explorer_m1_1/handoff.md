# Handoff Report: User/Profile Schema & Auth Base (Milestone M1)

This report details findings and recommendations for implementing the authentication schemas and dependencies required for Milestone M1.

## 1. Observation

### Existing Profile Schema
In `server/src/models/Profile.ts`:
*   `sessionId` is defined as a unique required string (line 27):
    ```typescript
    sessionId: {
      type: String,
      required: true,
      unique: true
    },
    ```
*   `tokenBalance` defaults to 0 (line 46):
    ```typescript
    tokenBalance: { type: Number, default: 0 },
    ```
*   `currentScore` defaults to 0 (line 41):
    ```typescript
    currentScore: { type: Number, default: 0 },
    ```

### Existing Profile Service Initialization
In `server/src/services/ProfileService.ts` (lines 12-20), a welcome reward is minted on profile setup:
```typescript
      // Generate custodial blockchain wallet
      const wallet = blockchainService.generateUserWallet();

      // Execute real on-chain minting for welcome reward
      const txResult = await blockchainService.earnTokens(
        wallet.address,
        100,
        'Profile Setup Bonus'
      );
```

### Global Authentication Requirements
In `.agents/ORIGINAL_REQUEST.md`:
*   **Profile Initialization:**
    ```markdown
    - **Profile Initialization:** Fresh user registrations must initialize wallet and reward balances to zero. No mock scores or tokens should be created.
    ```
*   **Security Control / Session Management:**
    ```markdown
    - **Google OAuth 2.0:** Secure authentication using real Google accounts. Backend verifies Google ID tokens. Accounts are created automatically for first-time users. Credentials must be loaded from `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
    - **Email Authentication:** standard Sign Up, Login, Forgot Password, Reset Password, and Email Verification. Passwords must be hashed using a secure algorithm (like bcrypt).
    - **JWT Session Management:** Sessions must be managed using JSON Web Tokens (JWT) stored in secure, Http-Only cookies. No sensitive session tokens should be exposed to client-side JavaScript.
    ```

### Dependencies Audit
In `server/package.json`, there are no references to authentication, hashing, token, or session management libraries:
```json
  "dependencies": {
    "@openrouter/sdk": "^0.13.33",
    "@types/express": "^5.0.6",
    "@types/node": "^26.1.1",
    "@types/uuid": "^10.0.0",
    "cors": "^2.8.6",
    "dotenv": "^17.4.2",
    "ethers": "^6.17.0",
    "express": "^5.2.1",
    "groq-sdk": "^1.3.0",
    "mongodb-memory-server": "^11.2.0",
    "mongoose": "^9.7.4",
    "pdf-lib": "^1.17.1",
    "razorpay": "^2.9.6",
    "socket.io": "^4.8.3",
    "ts-node": "^10.9.2",
    "typescript": "^7.0.2",
    "uuid": "^14.0.1",
    "zod": "^4.4.3"
  }
```

---

## 2. Logic Chain

1.  **Security boundaries dictate separating credentials from profile metadata.** Under the existing code, `/api/profile/:sessionId` returns the full Mongoose Profile document to the frontend. If password hashes, password reset tokens, and email verification tokens are added directly to the `Profile` model (Option B), they risk being leaked to the frontend via the API unless developers remember to strip them on every query. Therefore, creating a separate `User` model (Option A) containing credentials and token verification info is the most secure design.
2.  **Mapping user sessions to profiles is easily achievable.** Since other schema collections (`Transaction`, `Income`, `Expense`, `Settings`) identify a user via a string `sessionId`/`userId`, we can map the `User._id` generated upon registration to the Profile's `sessionId`. When a user authenticates, the backend can decode the JWT cookie to find the `userId` and use it as `sessionId` to fetch their corresponding profile.
3.  **Registration logic must be updated to comply with the zero-initialization requirement.** The original request specifically states that no mock scores or tokens should be created, and reward balances must initialize to zero. Currently, `ProfileService.ts` automatically mints `100 SAKHI` on profile setup. Disabling the `earnTokens` mint call and initializing `tokenHistory` and `scoreHistory` to empty arrays (`[]`) fully aligns the registration flow with this rule.
4.  **Implementing password hashing, session tokens, verification, and rate limiting requires new packages.** Since `server/package.json` contains no auth-related dependencies, the implementer must install packages for hashing (`bcrypt`), signing JWTs (`jsonwebtoken`), parsing cookies (`cookie-parser`), verifying OAuth tokens (`google-auth-library`), sending verification/reset emails (`nodemailer`), and preventing brute-force login attempts (`express-rate-limit`).

---

## 3. Caveats

*   **No Code Implementation:** Per agent identity constraints, no files were modified or created outside the agent's working directory (`.agents/teamwork_preview_explorer_m1_1`).
*   **Database Seeding:** Any existing seed scripts or mock profile generators that depend on the `Profile` schema or expect hardcoded `sessionId` strings will need to be updated to integrate with the new `User` model structure.
*   **Mock Verification Links:** In environments without SMTP configuration, verification/reset links will be printed to the server console and saved to the database. The implementer must ensure the backend auth controller supports this fallback behavior.

---

## 4. Conclusion

Milestone M1 should be completed by:
1.  Adding the identified packages (`bcrypt`, `jsonwebtoken`, `cookie-parser`, `google-auth-library`, `nodemailer`, `express-rate-limit` and their types) to `server/package.json`.
2.  Creating a new model `server/src/models/User.ts` for credentials, OAuth fields, and verification status.
3.  Updating the profile creation service to use the newly created `User._id` as `sessionId` in `Profile`.
4.  Disabling welcome rewards minting in `ProfileService.ts` to ensure fresh profiles start with zero tokens and empty history.

---

## 5. Verification Method

Once the implementer finishes the implementation, the following checks will verify success:
1.  **Schema Check:** Inspect that the database collections contain both `users` and `profiles` collections. Ensure that sensitive credentials do not exist in the `profiles` collection.
2.  **Registration Verification:** Create a new user account. Verify in the database that:
    *   `Profile.tokenBalance` is `0`.
    *   `Profile.tokenHistory` is empty (`[]`).
    *   `Profile.currentScore` is `0`.
    *   `Profile.scoreHistory` is empty (`[]`).
    *   `Profile.walletAddress` exists (custodial wallet) but on-chain balance is `0`.
3.  **Compile & Launch:** Run `npm run start` in the `server` directory and ensure that there are no compilation errors in TypeScript or Mongoose.
