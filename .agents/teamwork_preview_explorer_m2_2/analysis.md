# Analysis Report: Login, Logout, and JWT Session Generation (M2)

This report details the architectural requirements, security recommendations, and integration constraints for implementing the Login and Logout endpoints for Milestone M2.

---

## 1. Overview of Authentication Base
Based on Milestone M1, the authentication base comprises:
- **User Schema (`server/src/models/User.ts`)**: Defines `email` (lowercased, trim), `password` (hashed with bcryptjs), `isVerified` (boolean, defaults to `false`), `verificationToken`, `resetToken`, and `resetTokenExpires`.
- **JWT Helpers (`server/src/utils/jwt.ts`)**:
  - `generateToken(payload: { userId: string; email: string; sessionId: string })`: Signs a JWT token with `JWT_SECRET` and sets `expiresIn` (defaulting to 24h).
  - `verifyToken(token: string)`: Decodes and verifies the JWT token.
- **Profile Schema (`server/src/models/Profile.ts`)**: Linked to the user's `_id` via the `sessionId` field (stores `userId` as a string). Contains user `name`, `occupation`, and zero-initialized financial metrics (`currentScore`, `tokenBalance`, etc.).

---

## 2. `/api/auth/login` (POST) Implementation Strategy

The Login endpoint must process email/password authentication securely, establish the user session, and handle email verification checks.

### A. Input Validation and Security
- **Required Fields**: `email` (string) and `password` (string). Return `400 Bad Request` if empty, missing, or of incorrect types.
- **NoSQL Injection Prevention**: Ensure input fields are validated (e.g., using a Zod schema or express-validator) to reject complex objects (such as `{ $ne: null }`) and enforce string type.
- **Rate Limiting**: Apply rate-limiting middleware (such as `express-rate-limit`) on this endpoint to block brute-force attacks (returns `429 Too Many Requests` on excessive failures, tested in `auth_tier2.test.ts`).

### B. User Lookup and Verification
- **Email Normalization**: The email address must be queried case-insensitively. Since email addresses are saved lowercased in the database, the query parameter should be transformed using `.toLowerCase()`.
- **Credential Checking**:
  - Look up the user by email. If the user does not exist, return a `401 Unauthorized` status.
  - Compare passwords using `await user.comparePassword(password)`. If it returns `false`, return a `401 Unauthorized` status.
- **Email Verification Constraint**:
  - **Does email verification block login?** Yes, absolutely. The login endpoint **must** verify that `user.isVerified` is `true`.
  - If `user.isVerified` is `false`, return `401 Unauthorized` and prevent the session token from being set. This is strictly validated in the test suite (`auth_tier1.test.ts` lines 217-223 and 319-332).

### C. Session & Token Cookie Generation
- **Profile Retrieval**: Retrieve the user's Profile to fetch the user's display name using `await Profile.findOne({ sessionId: user._id.toString() })` or via the `ProfileRepository`.
- **JWT Payload**: Construct the payload with `userId: user._id.toString()`, `email: user.email`, and `sessionId: user._id.toString()`.
- **Token Signing**: Generate the JWT using `generateToken(payload)`.
- **HTTP Cookie Dispatch**: Attach the token as a cookie named `token` (see Section 4 for security flags).

### D. Response Contracts
- **Headers**:
  ```http
  Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict
  ```
- **Response Body (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": "<user._id>",
      "email": "<user.email>",
      "name": "<profile.name>"
    }
  }
  ```

---

## 4. `/api/auth/logout` (POST) Implementation Strategy

The Logout endpoint terminates the session by clearing the client-side session cookie.

### A. Routing and Accessibility
- **Allowed Methods**: POST only. GET requests to `/api/auth/logout` must be rejected with `404 Not Found` or `405 Method Not Allowed` (`auth_tier2.test.ts` lines 414-418).
- **Graceful Execution**: The route must execute successfully and return `200 OK` regardless of whether the session cookie was present or valid (allows idempotent logout).

### B. Cookie Clearing
- Clear the `token` cookie by setting it to an empty string `""` (or null) and applying `maxAge: 0`.
- **Security Flags**: The clearing response must retain the exact same secure flags (`HttpOnly`, `Secure`, `SameSite=Strict`) to prevent browser security mismatches.

### C. Response Contracts
- **Headers**:
  ```http
  Set-Cookie: token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict
  ```
- **Response Body (200 OK)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

---

## 5. Secure Cookie Configuration Recommendations

To defend against XSS, CSRF, and session hijack attacks, cookies must be configured with:

| Cookie Attribute | Recommendation / Configuration | Security Purpose |
| :--- | :--- | :--- |
| **Name** | `token` | Matches the expected session key in downstream middlewares and tests. |
| **HttpOnly** | `true` | Prevents client-side scripts (e.g., `document.cookie`) from accessing the JWT, mitigating XSS token theft. |
| **Secure** | `true` | Enforces that cookies are only sent over encrypted HTTPS connections (crucial for protecting credentials in transit). |
| **SameSite** | `'strict'` | Ensures the cookie is never sent with cross-site requests, providing robust protection against Cross-Site Request Forgery (CSRF). |
| **Max-Age / Expires** | `24 * 60 * 60 * 1000` (Login)<br>`0` (Logout) | Determines cookie lifecycle. Matches JWT's 24h expiration on login, and forces immediate deletion on logout. |

### Express Code Snippet Suggestions

**On Login**:
```typescript
res.cookie('token', token, {
  httpOnly: true,
  secure: true, // Note: Enforced in testing suite
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

**On Logout**:
```typescript
res.cookie('token', '', {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 0
});
```

---

## 6. Middleware Integrations (Looking Ahead to M4)
To parse these cookies in future route protection middleware:
1. Install and register `cookie-parser` in `server/src/app.ts` (`app.use(cookieParser())`).
2. Read the cookie in the authorization middleware: `const token = req.cookies.token;`.
3. Verify the token using `verifyToken(token)` to extract the `userId` and `sessionId` for context propagation.
