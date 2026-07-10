# Milestone M1 Analysis: User Schema, Password Hashing, & User Creation Flow

## 1. Mongoose Model Design & Integration

### Current DB Setup & Relationships
- Database connection is initialized in `server/src/server.ts` via `mongoose.connect()`. It uses `mongodb-memory-server` as a local fallback if `MONGO_URI` is not defined.
- Existing models (e.g., `Settings`, `Income`, `Expense`, `Transaction`) use a `userId` field to link records to a profile.
- The `Profile` schema uses `sessionId` as the unique user identifier.
- Currently, there is no authentication model (`User.ts`).

### Recommendation: Separate `User` Model
To separate sensitive authentication data (credentials, verification tokens, reset tokens) from public/operational profile data, we recommend creating a dedicated `User` model at `server/src/models/User.ts`. 

The `_id` of the `User` document should be cast to a string and stored as the `sessionId` in the `Profile` model (and the `userId` in other models). This maintains backward compatibility without requiring any modifications to the other schemas.

#### Proposed `User` Schema (`server/src/models/User.ts`)
```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string; // Optional for Google OAuth users
  googleId?: string; // Optional for Google OAuth users
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null/undefined values for email-only users
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { 
  timestamps: true 
});

// Guard: mongoose.models.User || mongoose.model(...) to prevent compilation overwrite errors during test runs
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
```

---

## 2. Password Hashing & Verification Flow

### Hashing on Pre-Save Hooks
Mongoose pre-save hooks are ideal for hashing because they centralize hashing logic in the model, preventing accidental plain-text storage when creating or saving a user.

```typescript
UserSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password') || !user.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});
```

### Password Verification Method
Add a helper method to the model to compare candidate passwords safely using `bcrypt.compare()`:
```typescript
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};
```

### Critical Caveat: Mongoose Hook Bypass
Mongoose pre-save hooks **do not** trigger on query-based updates (e.g. `findOneAndUpdate`, `updateOne`, or `updateMany`). If a password reset is performed via `findOneAndUpdate`, the hook is bypassed, which can result in storing a plain-text password.
- **Remedy**: Always retrieve the user document instance using `findById`, modify the `password` field directly, and call `.save()`. This ensures the hook runs properly. Alternatively, hash the password manually in the controller/service prior to updating if using query-based updates.

### Package Recommendations
Since `bcrypt` contains native binary components that frequently cause compilation failures on Windows environments (which is the user's OS), we strongly recommend installing **`bcryptjs`** and its types instead:
```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## 3. Zero-Balance Wallet and Reward Initialization

Currently, `ProfileService.ts` generates a custodial wallet and calls `blockchainService.earnTokens()` to mint a welcome bonus of `100` SAKHI tokens:
```typescript
// ProfileService.ts (Existing logic)
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
To satisfy the requirement that **"Token balances, wallet configurations, and credit scores are initialized to zero upon new user registration"**:

### Recommended Options:

#### Option A: Immediate Custodial Wallet (0 Balance)
Create the user's blockchain wallet address, but **do not** mint or award any initial tokens.
- **Implementation**:
  ```typescript
  const wallet = blockchainService.generateUserWallet();
  profile = await profileRepository.create({ 
    sessionId, 
    name: data.name,
    occupation: data.occupation,
    walletAddress: wallet.address,
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    blockchainNetwork: blockchainService.getMode(),
    currentScore: 0,
    scoreHistory: [],
    tokenBalance: 0,
    tokenHistory: []
  });
  ```
- **Pros**: The wallet is immediately configured for the user, making it ready to query or view on their dashboard profile from day one.
- **Cons**: Requires executing crypto-key generation on every signup, even for users who do not interact with the rewards feature.

#### Option B: Deferred Wallet Generation (0 Balance)
Do not generate a wallet or private key on registration. Leave all wallet configurations null/undefined.
- **Implementation**:
  ```typescript
  profile = await profileRepository.create({ 
    sessionId, 
    name: data.name,
    occupation: data.occupation,
    walletAddress: undefined,
    encryptedPrivateKey: undefined,
    blockchainNetwork: undefined,
    currentScore: 0,
    scoreHistory: [],
    tokenBalance: 0,
    tokenHistory: []
  });
  ```
- **Pros**: Reduces overhead during registration.
- **Cons/Resolutions**: `RewardController.ts` contains a self-healing block:
  ```typescript
  if (!profile.walletAddress) {
    const wallet = blockchainService.generateUserWallet();
    profile.walletAddress = wallet.address;
    profile.encryptedPrivateKey = wallet.encryptedPrivateKey;
    profile.blockchainNetwork = blockchainService.getMode();
    await profile.save();
  }
  ```
  Since the controller automatically self-heals by generating a wallet on the first reward or balance query, Option B is **fully safe** and doesn't break the application.

### Recommended Choice
We recommend **Option B** (Deferred Wallet Generation) as it initializes the user registration flow to absolute zero (no tokens, no scores, no pre-generated keys). The controller's self-healing logic handles wallet generation on-demand seamlessly.

---

## 4. Necessary Project Configurations

To support the authentication flow, the following packages should be added to the server:
- `bcryptjs` and `@types/bcryptjs` (password hashing)
- `jsonwebtoken` and `@types/jsonwebtoken` (session generation/verification)
- `cookie-parser` and `@types/cookie-parser` (reading HttpOnly cookies)
- `express-rate-limit` (brute-force rate limiting)

A `.env.example` file should be created in the root or server directory containing:
```env
# Database & Server
PORT=5000
MONGO_URI=
JWT_SECRET=
JWT_EXPIRES_IN=7d

# Cryptography / Security
ENCRYPTION_KEY=

# Blockchain Configuration
RPC_URL=https://sepolia.base.org
TOKEN_CONTRACT_ADDRESS=
DISTRIBUTOR_PRIVATE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Mail Configurations (Optional fallback logs to console if empty)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```
