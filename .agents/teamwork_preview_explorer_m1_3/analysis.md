# JWT Session Management Design - Milestone M1 Analysis

This report outlines the proposed design, directory layout, and security configuration for JWT-based session management in SakhiCredit for **Milestone M1 (User Schema & Auth Base)**.

---

## 1. Directory Structure & Placement

The Express-TypeScript backend uses a clean, module-based directory structure inside `server/src/`. To maintain this design and ensure clean separation of concerns, JWT utilities and configuration should be placed as follows:

- **Token Utilities**: `server/src/utils/jwt.ts`
  - *Purpose*: Houses stateless operations for generating, verifying, and setting/clearing cookies.
  - *Why*: Placed alongside other helper modules (`aiExplanation.js`, `scoringEngine.js`) inside `utils/`. Using a dedicated `jwt.ts` avoids bloating controllers or route files.
- **Middleware**: `server/src/middleware/auth.middleware.ts`
  - *Purpose*: Implements the authentication check by calling JWT utility functions, decoding the token, attaching `req.user`, and enforcing access control.
- **Dependencies needed**:
  - `jsonwebtoken` (production) & `@types/jsonwebtoken` (development)
  - `cookie-parser` (production) & `@types/cookie-parser` (development)

---

## 2. JWT Payload Structure

To balance security, performance, and backward compatibility with the existing profile-based API (which uses a `:sessionId` parameter across routes), the JWT payload should contain:

```typescript
export interface JWTPayload {
  userId: string;     // The MongoDB User/Profile document ObjectId
  email: string;      // The user's authenticated email (useful for logs/context without DB queries)
  sessionId: string;  // The user's Profile sessionId for backward compatibility
}
```

### Rationale:
1. **Compatibility**: Embedding `sessionId` in the payload allows `auth.middleware.ts` to seamlessly cross-reference `req.params.sessionId` with the decoded `req.user.sessionId`. This validates that users can only access their own dashboard, income, and rewards records.
2. **Minimizing Size**: The payload is kept minimal. Sensitive details (e.g. password hashes, reset tokens, private keys) are omitted, keeping the cookie size small and preventing unintended information disclosure.

---

## 3. Cookie Configuration (Production-Grade Security)

Stateless JWT tokens will be transmitted using HTTP cookies. The following settings are recommended for production-grade security:

| Cookie Flag | Recommended Setting | Security Rationale |
| :--- | :--- | :--- |
| **`HttpOnly`** | `true` | **Mitigates XSS**: Prevents client-side scripts (e.g., `document.cookie`) from reading the cookie. Even if a Cross-Site Scripting vulnerability exists, the attacker cannot steal the token. |
| **`Secure`** | `process.env.NODE_ENV === 'production'` | **Eavesdropping Prevention**: Ensures the browser only transmits the cookie over encrypted (HTTPS) connections. Set to `false` in development for local HTTP testing. |
| **`SameSite`** | `'Strict'` | **Mitigates CSRF**: The cookie is only sent in first-party contexts (requests originating from the site itself). Since Google OAuth ID token verification is sent as a same-site AJAX/fetch POST request by the frontend React app, `'Strict'` works perfectly. |
| **`Max-Age` / `Expires`** | `86400000` ms (24 hours) | **Session Lifespan**: Controls how long the browser retains the cookie. Align this value with the JWT expiration (`expiresIn: '24h'`) to avoid mismatch. |

---

## 4. Implementation Specifications

### Proposed Code for `server/src/utils/jwt.ts`:
```typescript
import jwt from 'jsonwebtoken';
import { Response } from 'express';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be defined in production environment variables.');
}

// Fallback secret for local test runs
const SECRET = JWT_SECRET || 'dev_secret_jwt_sign';

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
}

/**
 * Generates a signed JSON Web Token
 */
export const generateToken = (payload: JWTPayload, expiresIn: string | number = JWT_EXPIRES_IN): string => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

/**
 * Verifies and decodes a JSON Web Token
 */
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, SECRET) as JWTPayload;
};

/**
 * Sets the JWT token in a secure, HttpOnly cookie
 */
export const sendTokenCookie = (res: Response, token: string): void => {
  const isProduction = process.env.NODE_ENV === 'production';
  const oneDay = 24 * 60 * 60 * 1000;

  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: oneDay,
  });
};

/**
 * Clears the JWT token cookie (on Logout)
 */
export const clearTokenCookie = (res: Response): void => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    expires: new Date(0),
  });
};
```

### Proposed Environment Variables (`server/.env` modifications):
```env
# JWT Session Configuration
JWT_SECRET=super_secure_random_string_here_in_prod
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

### Proposed Application Bootstrapping (`server/src/app.ts` modifications):
To parse cookies on requests, `cookie-parser` needs to be imported and registered in `app.ts` before route definitions:
```typescript
import cookieParser from 'cookie-parser';

// ...
app.use(cors({ origin: true, credentials: true })); // Ensure credentials support is enabled if frontend/backend are on separate subdomains
app.use(cookieParser());
app.use(express.json());
// ...
```
