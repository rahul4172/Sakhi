# Analysis: Forgot Password & Reset Password Flow (Milestone M2)

## 1. Overview and Objective
This document outlines the design and implementation details for the Forgot Password and Reset Password API endpoints for the SakhiCredit authentication system. These endpoints are key components of Milestone M2 (Email Auth Endpoints).

The implementation must provide a secure password recovery flow that minimizes token exposure, prevents token reuse, enforces expiration limits, avoids user enumeration, and integrates seamlessly with the existing MongoDB `User` schema.

---

## 2. Existing Database Model State
The `User` model is defined at `server/src/models/User.ts`. The schema and TypeScript interface already contain the necessary properties for password reset:
*   **Properties (lines 10-11):**
    ```typescript
    resetToken?: string;
    resetTokenExpires?: Date;
    ```
*   **Schema Definition (lines 40-45):**
    ```typescript
    resetToken: {
      type: String
    },
    resetTokenExpires: {
      type: Date
    }
    ```
*   **Pre-save Hashing Hook (lines 51-62):**
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
    *Insight:* The pre-save hook handles hashing passwords automatically when `user.password` is modified. Thus, in the reset password flow, assigning the plain text password to `user.password` and calling `await user.save()` is sufficient and ensures consistent hashing.

---

## 3. Forgot Password Flow (`/api/auth/forgot-password`)
### Endpoint Details
*   **Route:** `/api/auth/forgot-password` (POST)
*   **Request Body:**
    ```json
    {
      "email": "user@example.com"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Password reset email sent if account exists."
    }
    ```

### Step-by-Step Implementation Design
1.  **Input Validation:** Validate the email address using `zod` or standard regex.
2.  **Email Normalization:** Normalize the email by trimming whitespace and converting to lowercase to match the DB:
    ```typescript
    const email = req.body.email.trim().toLowerCase();
    ```
3.  **User Search:** Query the database for the user:
    ```typescript
    const user = await User.findOne({ email });
    ```
4.  **User Enumeration Protection:** If the user is not found, do **not** return a 404 error. Instead, immediately return the success response (`200 OK` with the message `"Password reset email sent if account exists."`). This prevents attackers from scanning the endpoint to verify if an email exists on the platform.
5.  **Token Generation & Hashing:**
    *   Generate a secure, random token using Node's built-in cryptographically secure random bytes generator:
        ```typescript
        const rawToken = crypto.randomBytes(32).toString('hex');
        ```
    *   To prevent offline attacks (if the database is compromised, the attacker could read the raw tokens and reset anyone's password), store only the secure SHA-256 hash of the token in the database:
        ```typescript
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
        ```
6.  **Expiry Definition:** Set an expiration window of 1 hour (or 15-30 minutes for stricter security):
        ```typescript
        const tokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        ```
7.  **Database Save:** Save the hashed token and expiration to the user document:
        ```typescript
        user.resetToken = hashedToken;
        user.resetTokenExpires = tokenExpiry;
        await user.save();
        ```
8.  **Link Construction:**
    *   Recommend the following link structure:
        ```typescript
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
        ```
9.  **Delivery Channel Routing:**
    *   Check for SMTP credentials in the environment (`process.env.SMTP_HOST`, `process.env.SMTP_PORT`, `process.env.SMTP_USER`, `process.env.SMTP_PASS`).
    *   If credentials exist, send the reset email using `nodemailer`:
        ```typescript
        const transporter = nodemailer.createTransport({ ... });
        await transporter.sendMail({
          to: user.email,
          subject: "Password Reset Request - SakhiCredit",
          html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password. This link is valid for 1 hour.</p>`
        });
        ```
    *   If credentials do not exist, log the link directly to the console (and optionally a local log database) for local testing:
        ```typescript
        console.log(`[TEST EMAIL LOG] Password Reset URL: ${resetUrl}`);
        ```

---

## 4. Reset Password Flow (`/api/auth/reset-password`)
### Endpoint Details
*   **Route:** `/api/auth/reset-password` (POST)
*   **Request Body:**
    ```json
    {
      "token": "raw_token_from_email",
      "newPassword": "SecureNewPassword123!"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "message": "Password reset successful."
    }
    ```

### Step-by-Step Implementation Design
1.  **Input Validation:** Validate the `token` and the `newPassword` length/complexity using `zod`.
2.  **Token Verification:**
    *   Hash the received `token` using SHA-256:
        ```typescript
        const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');
        ```
    *   Look up the user in the database where `resetToken` matches the hash and the expiration time is greater than the current time:
        ```typescript
        const user = await User.findOne({
          resetToken: hashedToken,
          resetTokenExpires: { $gt: new Date() }
        });
        ```
3.  **Invalid/Expired Token Handling:**
    *   If no user is found, return a `400 Bad Request` with a generic message:
        ```json
        {
          "error": "Password reset token is invalid or has expired."
        }
        ```
4.  **Password Update & Invalidation:**
    *   Assign the new plain text password to the user document:
        ```typescript
        user.password = req.body.newPassword;
        ```
    *   **Crucial Step - Clear Token to Prevent Reuse:** Immediately clear the reset token and expiry fields:
        ```typescript
        user.resetToken = undefined;
        user.resetTokenExpires = undefined;
        ```
    *   Save the user record:
        ```typescript
        await user.save();
        ```
        *Note:* The pre-save hook in `User.ts` will automatically hash `user.password` with `bcryptjs`.
5.  **Response:** Return a success response to the user.

---

## 5. Security Recommendations

### A. Reset Link Format
*   **Recommended structure:** `${FRONTEND_URL}/reset-password?token=${rawToken}`
*   **Example:** `http://localhost:5173/reset-password?token=8c6f1d...`
*   *Note:* The frontend should parse the query string, extract the token, let the user fill in their new password, and submit both to `/api/auth/reset-password`.

### B. Critical Controls and Token Lifecycle Checks
1.  **Single-Use Token:** Clearing the token database fields (`resetToken` and `resetTokenExpires`) immediately upon a successful password change blocks attackers from reusing a token.
2.  **Hashed Tokens in DB:** Never store plaintext tokens in the database. Use SHA-256 to store hashes to prevent exposure during database read access.
3.  **Token Expiration Validation:** Keep the duration short (15 to 60 minutes). The query `{ resetTokenExpires: { $gt: new Date() } }` must be strictly enforced.
4.  **Rate Limiting:** Enforce a strict rate limit on `/api/auth/forgot-password` (e.g., maximum 5 requests per hour per IP) and `/api/auth/reset-password` using `express-rate-limit`. This prevents resource consumption and brute-force email spamming.
5.  **Axios Client Configuration:** On the frontend, the axios instance (`client/src/api/client.ts`) should be updated to include `withCredentials: true` to support safe HttpOnly cookies when the session token is returned after login.
