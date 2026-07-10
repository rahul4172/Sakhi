# Handoff — Explorer 1 (Milestone M2)

## 1. Observation
- **User Schema (`server/src/models/User.ts:4-15`)**:
  ```typescript
  export interface IUser extends Document {
    email: string;
    password?: string;
    googleId?: string;
    isVerified: boolean;
    verificationToken?: string;
    resetToken?: string;
    resetTokenExpires?: Date;
    ...
  }
  ```
- **Profile Schema & Service (`server/src/models/Profile.ts:26-59` & `server/src/services/ProfileService.ts:6-29`)**:
  - `Profile` schema contains `name`, `occupation`, and zero-initialized fields: `currentScore` (default 0), `tokenBalance` (default 0), `tokenHistory` ([]), `scoreHistory` ([]).
  - `profileService.createOrUpdateProfile(sessionId, { name, occupation })` creates or updates a profile and initializes custodial blockchain wallets and settings.
- **AuditLog Schema (`server/src/models/AuditLog.ts:3-10`)**:
  - Contains `action`, `details` (Mixed), `userId`, `timestamp`, `ip`, `session`.
- **JWT Helpers (`server/src/utils/jwt.ts:17-29`)**:
  - Exposes `generateToken` and `verifyToken` using `userId`, `email`, and `sessionId`.
- **Dependencies (`server/package.json:13-38`)**:
  - Already contains `"nodemailer": "^9.0.3"`, `"bcryptjs": "^3.0.3"`, `"cookie-parser": "^1.4.7"`, and `"zod": "^4.4.3"`.
- **Express App Configuration (`server/src/app.ts:9-18`)**:
  - Currently does not mount `cookie-parser` or `auth.routes.ts`.

## 2. Logic Chain
1. The User request specifies Email/Password Authentication supporting Sign Up, Email Verification, Login, Logout, Forgot & Reset Password, using Http-Only JWT cookies.
2. In `User.ts`, password hashing is automated via a pre-save hook, and a password comparison method is available.
3. During signup, the request body includes `name`, `occupation`, and `isSHG`. A corresponding `Profile` must be created and linked to the user.
4. Using the User's MongoDB `_id` as the `sessionId` links the `User` and `Profile` models perfectly, as verified in `auth.test.ts` where `profileService.createOrUpdateProfile` is called with `user._id.toString()`.
5. Since JWT needs to support cookie authentication, the backend must write the signed token string to an Http-Only, Secure, SameSite=Strict cookie.
6. Reading this cookie in future protected API calls (M4) requires `cookie-parser` middleware. Therefore, `app.ts` must be updated to use `cookieParser()`.
7. For email delivery: if `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` exist in env, use `nodemailer`. If not, we must fall back to printing the link to the console and storing it in MongoDB. The `AuditLog` model has suitable fields for storing the logged link details (`action`, `details`, `userId`).

## 3. Caveats
- No token expiration details are defined for the verification token in the schema.
- Assumed standard production cookie settings (Secure flag conditional on `process.env.NODE_ENV === 'production'`).
- The Google OAuth 2.0 flow (Milestone M3) and Auth Middleware protection implementation (Milestone M4) are outside the scope of this milestone.

## 4. Conclusion
To implement the Signup and Email Verification flow for Milestone M2:
1. Create `server/src/services/MailService.ts` to manage email dispatching and local DB/console logging fallback using `AuditLog`.
2. Create `server/src/controllers/AuthController.ts` with Zod validation schemas and auth actions.
3. Create `server/src/routes/auth.routes.ts` with endpoint mappings.
4. Mount auth routes inside `server/src/routes/api.routes.ts`.
5. Register `cookie-parser` in `server/src/app.ts`.

Detailed designs and code skeletons are written in the `analysis.md` report.

## 5. Verification Method
- **Test execution**: Run `npx tsx --test src/tests/auth.test.ts` inside the `server/` directory to verify basic schema & base integrations.
- **Integration verification**:
  1. Verify `/api/auth/signup` creates both the `User` and the `Profile` in the database, sends/logs the verification link, and initializes wallets/balances to zero.
  2. Verify `/api/auth/verify-email?token=...` updates `isVerified` to `true` on the user document.
  3. Verify `/api/auth/login` checks the verification status and sets a secure HTTP-Only `token` cookie.
  4. Verify `/api/auth/logout` clears the `token` cookie.
