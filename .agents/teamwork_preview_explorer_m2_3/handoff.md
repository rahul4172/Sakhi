# Handoff Report: Forgot Password & Reset Password Flow (Milestone M2)

## 1. Observation
*   **User Schema (`server/src/models/User.ts`):**
    *   Lines 10-11 define reset token properties:
        ```typescript
        resetToken?: string;
        resetTokenExpires?: Date;
        ```
    *   Lines 40-45 define the schema fields:
        ```typescript
        resetToken: {
          type: String
        },
        resetTokenExpires: {
          type: Date
        }
        ```
    *   Lines 51-62 define a pre-save hook that automatically hashes the `password` field if it has been modified:
        ```typescript
        UserSchema.pre('save', async function (this: any) {
          const user = this;
          if (!user.isModified('password') || !user.password) {
            return;
          }
          ...
        ```
*   **Server Packages (`server/package.json`):**
    *   Lines 27 and 30 confirm standard security and communication libraries are available:
        ```json
        "jsonwebtoken": "^9.0.3",
        "nodemailer": "^9.0.3",
        ```
*   **Baseline Test Suite Execution:**
    *   Running the command `npx tsx --test src/tests/auth.test.ts` inside `server/` succeeds:
        ```
        ▶ Authentication Base and User Profile Integration Test Suite
          ✔ 1. User Schema Hashing & Password Verification (623.4137ms)
          ✔ 2. Profile Creation Integration (Zero Initialization & ID mapping) (81.9918ms)
          ✔ 3. JWT Helpers (generateToken & verifyToken) (4.1243ms)
        ✔ Authentication Base and User Profile Integration Test Suite (773.4209ms)
        ```

---

## 2. Logic Chain
1.  **Schema Readiness:** The existing `User` model is fully configured to persist `resetToken` and `resetTokenExpires` fields out-of-the-box, meaning no database migration or schema modification is required.
2.  **Password Hashing Integration:** Because the `UserSchema.pre('save', ...)` hook handles bcrypt password hashing automatically whenever the `password` field is modified, the implementation in `/api/auth/reset-password` only needs to assign the plain text password to `user.password` and save.
3.  **Token Security and Protection against DB Compromise:**
    *   If raw tokens are stored in the database, a database breach enables an attacker to immediately compromise accounts.
    *   Therefore, the system must generate a cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`) for the email body, but store only the SHA-256 hash of that token in the database.
4.  **Anti-Enumeration Design:** Returning a uniform success message (`200 OK` with `"Password reset email sent if account exists."`) regardless of user existence prevents malicious clients from enumerating registered emails.
5.  **Token Reuse Prevention:** Once `/api/auth/reset-password` matches the token hash and updates the password, setting `user.resetToken = undefined` and `user.resetTokenExpires = undefined` guarantees the token cannot be reused.

---

## 3. Caveats
*   **SMTP Configuration:** The backend must fallback to logging reset links to the console if SMTP environment variables are missing in `.env`.
*   **Client Base URL:** The reset link depends on `process.env.FRONTEND_URL` (typically `http://localhost:5173` in development) to construct the path correctly.
*   **Rate Limiting:** IP-based rate limiting on `/forgot-password` and `/reset-password` endpoints is highly recommended but should be integrated as part of Milestone M6 security hardening.

---

## 4. Conclusion
The Forgot Password and Reset Password endpoints `/api/auth/forgot-password` and `/api/auth/reset-password` can be implemented safely by using Node's native `crypto` module, the existing `User` model, and `nodemailer`. By storing tokens in SHA-256 hashed form, implementing single-use constraints, and using automated Mongoose pre-save hashing, the flow will remain robust and secure.

---

## 5. Verification Method
To independently verify the implementation:
1.  **Check No Regressions:**
    Run `npx tsx --test src/tests/auth.test.ts` within the `server/` folder to ensure existing tests pass.
2.  **Endpoint Tests:**
    Create a new test file (e.g., `server/src/tests/password-reset.test.ts`) that:
    *   Mocks a forgot-password request and verifies a `200 OK` is returned and a URL is logged to the console/transporter.
    *   Retrieves the token from the logged URL, attempts to reset the password, and confirms password change.
    *   Attempts to reuse the same token and verifies that the second request fails with `400 Bad Request`.
    *   Attempts to reset using an expired token (by manually altering the `resetTokenExpires` in the DB to the past) and verifies it fails with `400 Bad Request`.
