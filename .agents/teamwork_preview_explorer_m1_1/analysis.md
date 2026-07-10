# Milestone M1 Analysis: User/Profile Schema & Auth Base

## Executive Summary
This analysis details the required schema changes and dependency additions for **Milestone M1 (User Schema & Auth Base)**. We recommend creating a separate `User.ts` schema for authentication details, leaving `Profile.ts` for profile and wallet metadata. This provides clean security boundaries (preventing sensitive credentials from leaking to the frontend during normal profile fetches). We also outline how to update profile/wallet registration to satisfy the zero-initialization requirement (no welcome rewards or mock scores) and identify the missing dependencies needed for password hashing, JWT operations, cookies, OAuth, email sending, and rate limiting.

---

## 1. Schema Architecture Options

### Option A: Separate `User.ts` Schema & `Profile.ts` Reference (Recommended)
This approach keeps user credentials and session-related tokens in a separate `User` collection. The existing `Profile` collection references `User` or continues using a unique string identifier (such as the `User._id` value mapped to `sessionId`).

*   **Pros:**
    *   **Security:** Keeps sensitive credentials (`password`, `resetToken`, `verificationToken`) completely out of the `Profile` model, which is serialized and returned to the client in multiple endpoints (e.g. `/api/profile/:sessionId`).
    *   **Separation of Concerns:** Distinct separation between authorization/credentials management and business logic (rewards, wallet metadata, credit score).
    *   **Extensibility:** Simplifies adding multiple auth methods (e.g. phone, multiple OAuth providers) under a single user account.
*   **Cons:**
    *   Requires linking the `User` and `Profile` collections. Since the existing database schema relies heavily on `sessionId` (a string) as the primary user key in `Profile`, `Settings`, `Transaction`, `Income`, `Expense`, etc., we can simply store the `User._id` as the `sessionId` in the Profile document, keeping the relation clean and avoiding complex join refactoring.

### Option B: Extend `Profile.ts` Directly
This approach adds all authentication-specific properties directly to the existing `ProfileSchema` in `Profile.ts`.

*   **Pros:**
    *   **Simplicity:** No secondary collection or joins; only one `profiles` collection to query.
    *   **Minimal Refactoring:** The application's existing controller/repository logic remains unchanged as everything is centered around `Profile`.
*   **Cons:**
    *   **Security Risk:** Sensitive fields (like bcrypt password hashes or verification/reset tokens) are stored in the same model that is frequently fetched and sent directly to the client (e.g., via `ProfileController.getProfile`). This creates an accidental exposure risk unless developers are extremely careful to filter out these fields on every query using `.select('-password -verificationToken -resetToken')`.

---

## 2. Proposed Schema Implementations

### Recommended: New `User.ts` Schema
We propose creating `server/src/models/User.ts` with the following structure:

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional for Google OAuth users
  googleId?: string; // Optional, present only for Google OAuth users
  verificationStatus: 'pending' | 'verified';
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    // Required only for email/password signup; optional for Google OAuth
    required: function(this: any) {
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple documents to have no googleId
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified'],
    default: 'pending'
  },
  verificationToken: {
    type: String
  },
  verificationTokenExpires: {
    type: Date
  },
  resetToken: {
    type: String
  },
  resetTokenExpires: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
```

### Companion Modifications for `Profile.ts`
The existing `Profile` model (and the associated logic in `ProfileService.ts`) should remain focused on credit scores and token details. If a separate `User` model is created:
1.  **Relation Mapping:** The `sessionId` field in `Profile` will store the `User._id` (as a string) so all other models referencing `sessionId` (e.g., `Transaction`, `Income`, `Expense`) do not break and can still link correctly.
2.  **Schema Properties:** The `Profile` schema does not need to store authentication credentials.

---

## 3. Profile & Wallet Initialization (Requirements R1 & R2)

Per the **R1 (Profile Initialization)** requirement in `ORIGINAL_REQUEST.md`:
> *"Fresh user registrations must initialize wallet and reward balances to zero. No mock scores or tokens should be created."*

The current profile creation logic in `server/src/services/ProfileService.ts` automatically generates a blockchain wallet and mints a `100 SAKHI` welcome reward:
```typescript
// Current ProfileService.ts snippet (Lines 12-40)
const wallet = blockchainService.generateUserWallet();
const txResult = await blockchainService.earnTokens(wallet.address, 100, 'Profile Setup Bonus');
profile = await profileRepository.create({
  sessionId,
  ...data,
  walletAddress: wallet.address,
  encryptedPrivateKey: wallet.encryptedPrivateKey,
  blockchainNetwork: blockchainService.getMode(),
  tokenBalance: txResult.status === 'success' ? 100 : 0,
  tokenHistory: [historyItem]
});
```

### Required Modifications:
To comply with the requirements, the initialization logic must be modified as follows:
1.  **Skip Welcome Minting:** Do not call `blockchainService.earnTokens` during new profile creation.
2.  **Initialize to Zero:** Set `tokenBalance` to `0` and initialize `tokenHistory` as an empty array `[]`.
3.  **Credit Score:** Set `currentScore` to `0` and initialize `scoreHistory` as an empty array `[]`.
4.  **Wallet Address:** The user should still receive a custodial wallet generated by `blockchainService.generateUserWallet()`, but its initial balance on-chain and off-chain will be strictly `0`.

---

## 4. Package Dependency Audit (server/package.json)

To implement secure password hashing, JWT helpers, cookie parsing, OAuth token verification, rate limiting, and email sending, the following dependencies must be added to `server/package.json`:

| Package Name | Category | Purpose |
| :--- | :--- | :--- |
| **`bcrypt`** | Security | Hashing user passwords securely using salt rounds (typically 10-12). |
| **`@types/bcrypt`** | Types (Dev) | TypeScript type definitions for `bcrypt`. |
| **`jsonwebtoken`** | Session / JWT | Signing and verifying JSON Web Tokens (JWT) for session management. |
| **`@types/jsonwebtoken`** | Types (Dev) | TypeScript type definitions for `jsonwebtoken`. |
| **`cookie-parser`** | Middleware | Express middleware to parse incoming cookie headers, enabling extraction of JWTs from HttpOnly cookies. |
| **`@types/cookie-parser`** | Types (Dev) | TypeScript type definitions for `cookie-parser`. |
| **`google-auth-library`** | OAuth 2.0 | Google-official library to verify the authenticity of Google ID tokens received from the frontend client. |
| **`nodemailer`** | Mailing | Library to send registration verification emails and password reset links when SMTP is configured. |
| **`@types/nodemailer`** | Types (Dev) | TypeScript type definitions for `nodemailer`. |
| **`express-rate-limit`** | Security | Express middleware for rate limiting, protecting `/api/auth/signup`, `/api/auth/login`, and `/api/auth/forgot-password` from brute-force attacks. |

---

## 5. Next Steps for Implementer

1.  Add the package dependencies list to `server/package.json` and run `npm install`.
2.  Create the `server/src/models/User.ts` model.
3.  Modify `server/src/services/ProfileService.ts` to:
    *   Map `sessionId` to the corresponding authenticated `User._id`.
    *   Set `tokenBalance = 0` and `tokenHistory = []`.
    *   Set `currentScore = 0` and `scoreHistory = []`.
    *   Omit the welcome reward mint transaction.
4.  Implement authentication utilities:
    *   Password hashing / comparison helper functions using `bcrypt`.
    *   JWT creation and verification helper functions using `jsonwebtoken`.
5.  Set up Express application changes:
    *   Add `cookie-parser` middleware to `server/src/app.ts`.
