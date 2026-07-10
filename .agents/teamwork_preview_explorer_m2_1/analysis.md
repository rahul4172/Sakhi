# Analysis — Signup and Email Verification Flow (Milestone M2)

## 1. Executive Summary
Milestone M2 implements the Email/Password authentication endpoints, including signup, email verification, login, logout, forgot password, and reset password. This analysis reviews the existing M1 database schemas and JWT utilities, details the required route and controller designs, specifies verification token mechanics, and outlines the SMTP email dispatching with a robust console and database fallback for local testing environments.

---

## 2. Review of Milestone M1 Base
- **User Schema (`server/src/models/User.ts`)**:
  - Contains fields: `email` (unique, trimmed, lowercase), `password` (hashed with bcryptjs via a pre-save hook), `isVerified` (boolean, default false), `verificationToken` (string), `resetToken` (string), and `resetTokenExpires` (Date).
  - Exposes instance method: `comparePassword(password: string): Promise<boolean>` using `bcryptjs`.
- **Profile Schema & Service (`server/src/models/Profile.ts` & `server/src/services/ProfileService.ts`)**:
  - The `Profile` schema contains `name`, `occupation` (enum), and zero-initialized fields: `currentScore` (0), `scoreHistory` ([]), `tokenBalance` (0), `tokenHistory` ([]).
  - Also contains custodial wallet address, encrypted private key, and blockchain network.
  - Profile is linked to the user via the `sessionId` field. During signup, the User's database `_id` string will be used as `sessionId`.
- **JWT Helpers (`server/src/utils/jwt.ts`)**:
  - `generateToken(payload)`: signs JWT token with `userId`, `email`, and `sessionId` (both `userId` and `sessionId` mapped to user `_id`).
  - `verifyToken(token)`: decodes and returns the payload.

---

## 3. Endpoints & Route Definitions
The backend authentication endpoints will be aggregated under a new route file `server/src/routes/auth.routes.ts` and mounted on the main API router `server/src/routes/api.routes.ts` via `router.use('/auth', authRoutes)`.

### Endpoint Specs:
1. **`POST /api/auth/signup`**
   - **Request Body**: `{ "email": "...", "password": "...", "name": "...", "occupation": "...", "isSHG": true/false }`
   - **Response (201 Created)**: `{ "message": "Signup successful. Please verify your email." }`
2. **`GET /api/auth/verify-email`**
   - **Query Params**: `token=...`
   - **Response (200 OK)**: `{ "message": "Email verified successfully." }`
3. **`POST /api/auth/login`**
   - **Request Body**: `{ "email": "...", "password": "..." }`
   - **Response (200 OK)**: `{ "message": "Login successful", "user": { "id": "...", "email": "...", "name": "..." } }`
   - **Headers**: `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict`
4. **`POST /api/auth/logout`**
   - **Request Body**: `{}`
   - **Response (200 OK)**: `{ "message": "Logged out successfully" }`
   - **Headers**: `Set-Cookie: token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`
5. **`POST /api/auth/forgot-password`**
   - **Request Body**: `{ "email": "..." }`
   - **Response (200 OK)**: `{ "message": "Password reset email sent if account exists." }`
6. **`POST /api/auth/reset-password`**
   - **Request Body**: `{ "token": "...", "newPassword": "..." }`
   - **Response (200 OK)**: `{ "message": "Password reset successful." }`

---

## 4. Token & Email Dispatch Mechanics

### Verification Token Generation, Saving & Matching:
- **Generation**: Created during signup using Node's standard `crypto.randomBytes(32).toString('hex')` to generate a secure, high-entropy token.
- **Saving**: Saved to the new User document inside the `verificationToken` field with `isVerified` explicitly set to `false`.
- **Matching**: On `/api/auth/verify-email?token=...`, query MongoDB for the user with `findOne({ verificationToken: token })`. If found, set `isVerified: true`, set `verificationToken: undefined` (or delete field), and run `save()`.

### Email Dispatch & Fallback (MailService):
A centralized `MailService` will inspect `.env` for SMTP configuration:
- Required environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
- **SMTP Mode**: If all variables are set, instantiate a `nodemailer` transport and send the email with verification/reset link.
- **Development/Fallback Mode**: If any SMTP variable is missing:
  1. Print the verification link / reset link clearly in the server console (wrapped in visible borders).
  2. Create a document in the database using the **`AuditLog`** model with `action: 'EMAIL_VERIFICATION_LINK'` (or `'PASSWORD_RESET_LINK'`), `userId: user._id`, and the link details.

---

## 5. File Creation & Modification Plan

### Create Files:

#### 1. `server/src/services/MailService.ts`
Manages mail dispatching with SMTP and AuditLog fallback logic:
```typescript
import nodemailer from 'nodemailer';
import AuditLog from '../models/AuditLog';

export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private isSmtpConfigured: boolean = false;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        auth: { user, pass }
      });
      this.isSmtpConfigured = true;
    }
  }

  async sendVerificationEmail(email: string, token: string, userId: string): Promise<void> {
    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    if (this.isSmtpConfigured && this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"SakhiCredit" <no-reply@sakhicredit.com>',
        to: email,
        subject: 'Verify Your Email - SakhiCredit',
        html: `<p>Please verify your email by clicking the link below:</p><a href="${link}">${link}</a>`
      });
    } else {
      console.log(`\n==================================================\n[TESTING] Email Verification Link for ${email}:\n${link}\n==================================================\n`);
      await AuditLog.create({
        action: 'EMAIL_VERIFICATION_LINK',
        details: { email, token, verificationLink: link },
        userId
      });
    }
  }

  async sendPasswordResetEmail(email: string, token: string, userId: string): Promise<void> {
    const link = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    if (this.isSmtpConfigured && this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"SakhiCredit" <no-reply@sakhicredit.com>',
        to: email,
        subject: 'Reset Password - SakhiCredit',
        html: `<p>Reset your password by clicking the link below:</p><a href="${link}">${link}</a>`
      });
    } else {
      console.log(`\n==================================================\n[TESTING] Password Reset Link for ${email}:\n${link}\n==================================================\n`);
      await AuditLog.create({
        action: 'PASSWORD_RESET_LINK',
        details: { email, token, resetLink: link },
        userId
      });
    }
  }
}

export const mailService = new MailService();
```

#### 2. `server/src/controllers/AuthController.ts`
Implements request validation (using Zod) and controller actions for authentication:
- Import `User` model, `profileService`, `mailService`, and `generateToken`.
- Implement `signup`:
  - Validate: `email` (valid format), `password` (min 6), `name` (min 2), `occupation` (valid enum: tailings, beauty, tiffin service, handicrafts, SHG member, other).
  - Create user with verification token.
  - Create profile: `await profileService.createOrUpdateProfile(user._id.toString(), { name, occupation })`.
  - Dispatch verification email.
- Implement `verifyEmail`:
  - Find user by token.
  - Set `isVerified: true`, clear token, save.
- Implement `login`:
  - Find user, verify password, check `isVerified`.
  - Issue JWT token via HTTP-Only, Secure, SameSite=Strict cookie named `token`.
- Implement `logout`:
  - Clear `token` cookie.
- Implement `forgotPassword` & `resetPassword`:
  - Set/Verify `resetToken` and `resetTokenExpires` on User.

#### 3. `server/src/routes/auth.routes.ts`
Defines endpoint routing mappings:
```typescript
import { Router } from 'express';
import { authController } from '../controllers/AuthController';

const router = Router();

router.post('/signup', authController.signup.bind(authController));
router.get('/verify-email', authController.verifyEmail.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/forgot-password', authController.forgotPassword.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));

export default router;
```

### Modify Files:

#### 1. `server/src/routes/api.routes.ts`
- Import `authRoutes` from `./auth.routes` and mount it:
  `router.use('/auth', authRoutes);`

#### 2. `server/src/app.ts`
- Import and mount `cookie-parser` middleware:
  ```typescript
  import cookieParser from 'cookie-parser';
  ...
  app.use(cookieParser());
  ```
  *(Note: This is critical for parsing session JWTs in subsequent protect middleware).*

---

## 6. Integration and Testing Validation
- Node's test runner can be extended with integration tests inside `server/src/tests/auth.test.ts` (using `supertest` or equivalent) to request:
  - `POST /api/auth/signup` with valid payload, checking the DB for user creation, profile zero-initialization, and AuditLog creation.
  - `GET /api/auth/verify-email?token=...` checking transition of `isVerified` to `true`.
  - `POST /api/auth/login` ensuring validation errors on wrong password and verification check.
