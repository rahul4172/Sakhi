# Scope: Implementation Track

## Architecture
- User Authentication is handled via Email/Password and Google OAuth 2.0.
- Sessions are maintained using a JWT stored in an HttpOnly, Secure, SameSite cookie.
- Backend APIs under `/api/dashboard`, `/api/bbps/pay`, `/api/rewards` are protected via Auth Middleware.
- Frontend routes (Dashboard, BBPS, Rewards, Schemes) are protected via a client-side ProtectedRoute component.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | User Schema & Auth Base | User/Profile Schema modifications, bcrypt hashing, JWT helpers | None | DONE |
| M2 | Email Auth Endpoints | Signup, Verification, Login, Logout, Forgot & Reset Password, SMTP log | M1 | PLANNED |
| M3 | Google OAuth 2.0 Auth | Google ID token verification, auto-registration | M1 | PLANNED |
| M4 | Route Protection & Middleware | Backend Auth middleware and protection of routes | M2, M3 | PLANNED |
| M5 | Frontend Route & Page Protection | React Auth pages (Login, Signup, Reset, Verify) and ProtectedRoute | M4 | PLANNED |
| M6 | Security Hardening & Integration | HTTPS cookies, Rate limiting, input validation, integration checks | M5 | PLANNED |

## Interface Contracts
### /api/auth/signup (POST)
- Request: `{ "email": "...", "password": "...", "name": "...", "occupation": "...", "isSHG": true/false }`
- Response (201 Created): `{ "message": "Signup successful. Please verify your email." }`

### /api/auth/verify-email (GET)
- Query Params: `token=...`
- Response (200 OK): `{ "message": "Email verified successfully." }`

### /api/auth/login (POST)
- Request: `{ "email": "...", "password": "..." }`
- Response (200 OK): `{ "message": "Login successful", "user": { "id": "...", "email": "...", "name": "..." } }`
- Headers: `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict`

### /api/auth/google (POST)
- Request: `{ "credential": "<google_id_token>" }`
- Response (200 OK): `{ "message": "Google Login successful", "user": { "id": "...", "email": "...", "name": "..." } }`
- Headers: `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict`

### /api/auth/logout (POST)
- Request: `{}`
- Response (200 OK): `{ "message": "Logged out successfully" }`
- Headers: `Set-Cookie: token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict`

### /api/auth/forgot-password (POST)
- Request: `{ "email": "..." }`
- Response (200 OK): `{ "message": "Password reset email sent if account exists." }`

### /api/auth/reset-password (POST)
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
