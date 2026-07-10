# Project: SakhiCredit Authentication System

## Architecture
SakhiCredit is a modern credit and financial platform for women entrepreneurs. The authentication system consists of:
- **Client**: Vite-based React application utilizing React Router for navigation, React Query for API state, and TailwindCSS for styling.
- **Server**: Express Node.js application written in TypeScript using MongoDB (Mongoose) for storage.
- **Session Model**: Stateless JWT tokens stored in HttpOnly, Secure, SameSite cookies. Client-side JavaScript cannot access the tokens, preventing XSS-based theft.
- **OAuth**: Google OAuth 2.0. Backend receives the authorization credential/token from Google Identity Services on the frontend, validates it using google-auth-library, and establishes a JWT-based session.
- **Security Control**: Standard bcrypt password hashing, input sanitization via express-validator / zod, rate limiting on authentication routes (express-rate-limit).

```
[ Client (Vite/React) ]
         │
         │ (Secure HTTP-Only Cookie with JWT)
         ▼
[ Server (Express/Node) ] ──(Auth Middleware)──► [ Protected APIs ]
         │                                              │
         ├─► [ Google OAuth API (ID Token Check) ]      ├─► [ DB (MongoDB) ]
         └─► [ Nodemailer / SMTP Service ]              └─► [ Socket.io ]
```

## Milestones

### Implementation Track
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | User Schema & Auth Base | User/Profile Schema modifications for Auth, bcrypt hashing, JWT helpers | None | PLANNED |
| M2 | Email Auth Endpoints | Signup, Verification, Login, Logout, Forgot & Reset Password, SMTP log | M1 | PLANNED |
| M3 | Google OAuth 2.0 Auth | Google ID token verification backend route, auto-registration | M1 | PLANNED |
| M4 | Route Protection & Middleware | Auth middleware, protection of `/api/dashboard`, `/api/bbps/pay`, `/api/rewards` | M2, M3 | PLANNED |
| M5 | Frontend Route & Page Protection | Professional Login, Sign up, Forgot/Reset, verification UI. Protect dashboard pages | M4 | PLANNED |
| M6 | Security Hardening & Integration | HTTPS cookies, Rate limiting, input validation, E2E validation | M5 | PLANNED |

### E2E Testing Track
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| T1 | Test Harness & Infra Setup | Create testing framework, setup supertest/agent config, mock environments | None | PLANNED |
| T2 | Tier 1 & 2 Test Suite | Auth endpoint coverage, invalid input, boundary conditions, edge cases | T1 | PLANNED |
| T3 | Tier 3 & 4 Test Suite | Cross-feature flows (Signup -> Verify -> Login -> Access Dashboard -> Logout), E2E scenarios | T2 | PLANNED |
| T4 | Final Review & Ready | Compile test suite, run checks, publish `TEST_READY.md` | T3 | PLANNED |

## Interface Contracts

### `/api/auth/signup` (POST)
- Request: `{ "email": "...", "password": "...", "name": "...", "occupation": "...", "isSHG": true/false }`
- Response (201 Created): `{ "message": "Signup successful. Please verify your email." }`

### `/api/auth/verify-email` (GET)
- Query Params: `token=...`
- Response (200 OK): `{ "message": "Email verified successfully." }`

### `/api/auth/login` (POST)
- Request: `{ "email": "...", "password": "..." }`
- Response (200 OK): `{ "message": "Login successful", "user": { "id": "...", "email": "...", "name": "..." } }`
- Headers: `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict`

### `/api/auth/google` (POST)
- Request: `{ "credential": "<google_id_token>" }`
- Response (200 OK): `{ "message": "Google Login successful", "user": { "id": "...", "email": "...", "name": "..." } }`
- Headers: `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict`

### `/api/auth/logout` (POST)
- Request: `{}`
- Response (200 OK): `{ "message": "Logged out successfully" }`
- Headers: `Set-Cookie: token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`

### `/api/auth/forgot-password` (POST)
- Request: `{ "email": "..." }`
- Response (200 OK): `{ "message": "Password reset email sent if account exists." }`

### `/api/auth/reset-password` (POST)
- Request: `{ "token": "...", "newPassword": "..." }`
- Response (200 OK): `{ "message": "Password reset successful." }`

## Code Layout
- `server/src/models/User.ts` (or `Profile.ts` extensions)
- `server/src/controllers/AuthController.ts`
- `server/src/routes/auth.routes.ts`
- `server/src/middleware/auth.middleware.ts`
- `client/src/components/auth/Login.jsx`
- `client/src/components/auth/Signup.jsx`
- `client/src/components/auth/ForgotPassword.jsx`
- `client/src/components/auth/ResetPassword.jsx`
- `client/src/components/auth/VerifyEmail.jsx`
- `client/src/components/auth/ProtectedRoute.jsx`
