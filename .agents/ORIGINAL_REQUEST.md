# Original User Request

## 2026-07-10T06:48:27Z

Build a modern, secure, and production-ready authentication system for the SakhiCredit application, supporting both real Google OAuth 2.0 and Email/Password flows, with route protection on both the client and server.

Working directory: d:\Sakhi-main\Sakhi-main
Integrity mode: demo

## Requirements

### R1. Authentication Methods
- **Google OAuth 2.0:** Secure authentication using real Google accounts. Backend verifies Google ID tokens. Accounts are created automatically for first-time users. Credentials must be loaded from `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
- **Email Authentication:** standard Sign Up, Login, Forgot Password, Reset Password, and Email Verification. Passwords must be hashed using a secure algorithm (like bcrypt).
- **Email Verification & Reset Delivery:** If SMTP credentials are provided in `.env`, send actual emails via nodemailer. If not, log the verification/reset links to the server console and database for testing.
- **Profile Initialization:** Fresh user registrations must initialize wallet and reward balances to zero. No mock scores or tokens should be created.

### R2. Session Management & Route Protection
- **JWT Session Management:** Sessions must be managed using JSON Web Tokens (JWT) stored in secure, Http-Only cookies. No sensitive session tokens should be exposed to client-side JavaScript.
- **Backend Protection:** Implement auth middleware to protect API routes (like `/api/dashboard`, `/api/bbps/pay`, `/api/rewards`). Unauthenticated requests must return `401 Unauthorized`.
- **Frontend Route Protection:** Protect client-side pages (Dashboard, BBPS, Rewards, Schemes) and redirect unauthenticated users to a professional Login screen.

### R3. Production Security Hardening
- Input validation and sanitization on all authentication endpoints.
- Rate limiting and brute-force prevention on Sign Up, Login, and Forgot Password endpoints.
- Secure, HTTPS-ready cookie configuration.

## Acceptance Criteria

### Authentication Flows
- [ ] Unauthorized guest users are blocked from dashboard routes and redirected to the login screen immediately.
- [ ] Users can sign up and log in using Email and Password.
- [ ] Real Google Sign-In initiates correctly using configured Google OAuth keys.
- [ ] Token balances, wallet configurations, and credit scores are initialized to zero upon new user registration.
- [ ] Logging out clears the Http-Only JWT cookie and session variables successfully.

### Session Security & Route Protection
- [ ] Accessing protected API endpoints without a valid session cookie returns a `401 Unauthorized` response.
- [ ] Session validation securely decrypts and verifies the JWT signature on the backend.
- [ ] Verification and password reset links are printed to the console when SMTP variables are not set in `.env`.
