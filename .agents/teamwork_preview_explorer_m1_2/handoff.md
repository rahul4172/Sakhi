# Handoff Report - Explorer 2

## 1. Observation

During our investigation of the codebase, we observed the following:

- **Database and Models Location**: The database configurations and schemas reside in `server/src/models/`.
  - In `server/src/models/Profile.ts` (lines 61):
    ```typescript
    export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);
    ```
    This model guard avoids `OverwriteModelError` during hot-reloads and test runs.
  - In `server/src/models/Transaction.ts` (line 19):
    ```typescript
    userId: { type: String, required: true }, // referencing Profile sessionId for now since auth isn't present
    ```
    This shows that `sessionId`/`userId` is the primary foreign key across all transaction, income, and settings models, and auth is not currently implemented.
  
- **Profile Initialization and Welcome Bonus**:
  - In `server/src/services/ProfileService.ts` (lines 32-40):
    ```typescript
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
    This generates a custodial wallet and automatically mints 100 SAKHI tokens during registration.
  
- **Wallet Self-Healing**:
  - In `server/src/controllers/RewardController.ts` (lines 14-21):
    ```typescript
    // Self-heal: Generate wallet if legacy user
    if (!profile.walletAddress) {
      const wallet = blockchainService.generateUserWallet();
      profile.walletAddress = wallet.address;
      profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
      profile.blockchainNetwork = blockchainService.getMode();
      await profile.save();
    }
    ```
    This verifies that if a user has no pre-generated `walletAddress`, the application automatically self-heals by creating one on demand when retrieving their rewards balance.

- **Missing Cryptography/Auth Dependencies**:
  - In `server/package.json`, there are no dependencies for `bcrypt`, `bcryptjs`, `jsonwebtoken`, or `cookie-parser`.

---

## 2. Logic Chain

1. **User and Profile Separation**: Since `Profile` holds non-sensitive data and is returned by public-facing APIs (like `profileController.getProfile`), putting credentials directly in `Profile` is a security risk. A separate `User` schema (`User.ts`) is logical.
2. **Backward Compatibility**: Since all other models (e.g. `Transaction.ts`, `Settings.ts`) use `userId` or `sessionId` as a string reference, setting `Profile.sessionId = User._id.toString()` allows us to map users to profiles and other models cleanly without refactoring existing schemas.
3. **Password Security**: Standard pre-save hooks on Mongoose (using `bcryptjs`) are the industry standard for automatic hashing. However, Mongoose update queries (like `findOneAndUpdate`) do not trigger hooks. Therefore, we must document that password modifications should retrieve the user object and call `.save()`.
4. **Zero-Balance Requirements**: The requirements state that wallet and token balances must start at zero. 
   - By removing the welcome-bonus token minting (`blockchainService.earnTokens`) from the registration flow, the user's initial wallet starts with a balance of `0`.
   - By deferring the custodial wallet generation entirely (Option B), we avoid key generation overhead at registration. This is safe because `RewardController.ts` handles missing wallets dynamically via its self-healing logic.

---

## 3. Caveats

- We assumed that `isSHG` in the registration request can be mapped directly to the profile's occupation enum `'SHG member'` or saved as a new boolean flag `isSHG` by extending the `Profile` model schema.
- We did not investigate frontend form validation in detail since the task focuses on the backend schema, password hashing, and user creation flow.

---

## 4. Conclusion

- We recommend creating a separate `server/src/models/User.ts` model. The `Profile` schema should link to the user by setting `sessionId = User._id.toString()`.
- Password hashing should be implemented using a Mongoose pre-save hook with `bcryptjs`. We recommend using `bcryptjs` over standard `bcrypt` to prevent installation/compilation issues on Windows systems.
- To initialize all balances to zero with no mock tokens or scores:
  - Eliminate the `100 SAKHI` token minting block during user registration in `ProfileService.ts`.
  - Set `currentScore` to `0` and initialize history arrays to empty `[]`.
  - Use **Option B** (Deferred Wallet Generation), setting wallet details to `undefined` during registration and letting `RewardController.ts` self-heal the wallet on first request.

---

## 5. Verification Method

To verify these changes after implementation:
1. Compile typescript files: `npm run start` or running `tsc` to verify no syntax errors.
2. Inspect the created user and profile documents in MongoDB (or local memory server log output):
   - Verify `User` has `password` field hashed and `googleId`/`isVerified` populated correctly.
   - Verify `Profile` has `tokenBalance` set to `0` and `tokenHistory` is empty (`[]`).
   - Verify `Profile` has `currentScore` set to `0` and `scoreHistory` is empty (`[]`).
3. Run the E2E test suite (once implemented) to verify that an unauthenticated user registering via `/api/auth/signup` is saved with empty balances and a hashed password.
