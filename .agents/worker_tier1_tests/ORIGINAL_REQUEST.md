## 2026-07-10T06:56:57Z
You are the Worker agent for the E2E Testing Track of the SakhiCredit authentication system.
Your working directory is: d:\Sakhi-main\Sakhi-main\.agents\worker_tier1_tests

Your task is to implement the M2 (Tier 1: Feature Coverage) and M3 (Tier 2: Boundary & Corner Cases) test suites.

Implement these suites in:
1. `server/tests/tier1/auth_tier1.test.ts`:
   - Feature 1: Email Signup (5 test cases: valid signup, isSHG=true, isSHG=false, different occupation enums, zero-balance profile initialization validation)
   - Feature 2: Email Verification (5 test cases: verify changes status, token cleared, multiple verifications handled gracefully, verification status stored in DB, login allowed after verification)
   - Feature 3: Email Login (5 test cases: successful login with HTTPOnly cookie, case-insensitive email lookup, returns correct user keys, cookie attributes secure/strict, prevents login or verifies state before verification depending on flow)
   - Feature 4: Google OAuth 2.0 (5 test cases: auto-registration, subsequent login, returns session cookie, mock token bypass `mock-google-token-`, returns correct user keys)
   - Feature 5: Session Management / Route Protection (5 test cases: dashboard 401 block, bbps 401 block, rewards 401 block, dashboard 200 allow with session, bbps/rewards 200 allow with session)
   - Feature 6: Forgot Password (5 test cases: exist email 200, non-exist email 200, saves token and expiry, capture token from DB, multiple forgot calls updates token/expiry)
   - Feature 7: Reset Password (5 test cases: resets password successfully, old password fails login, new password succeeds login, token is one-time use, updates database bcrypt hash)
   - Feature 8: Logout (5 test cases: clears JWT session cookie, returns 200 on logout, logout without session is graceful, protected routes fail 401 after logout, cookie attributes secure/strict on clear)

2. `server/tests/tier2/auth_tier2.test.ts`:
   - Feature 1: Email Signup Boundaries (5 test cases: invalid email format, short password, duplicate email registration, missing required fields, invalid occupation enums)
   - Feature 2: Email Verification Boundaries (5 test cases: empty/missing token, expired token, malformed token format, non-existent token, double verification)
   - Feature 3: Email Login Boundaries (5 test cases: invalid password, non-existent email, empty inputs, login rate limiter block check, NoSQL injection prevention)
   - Feature 4: Google OAuth Boundaries (5 test cases: empty/missing credential, invalid/expired token, malformed token, missing email claim, missing name claim)
   - Feature 5: Session Boundaries (5 test cases: expired JWT cookie, malformed JWT cookie, wrong secret JWT cookie, empty cookie, wrong cookie name)
   - Feature 6: Forgot Password Boundaries (5 test cases: malformed email, empty email, rate limiting check, NoSQL injection in email, mixed case email lookup)
   - Feature 7: Reset Password Boundaries (5 test cases: empty/missing token, empty newPassword, expired token, weak password format, malformed token)
   - Feature 8: Logout Boundaries (5 test cases: custom/malformed cookie header, logout rate limit check, Secure/HttpOnly flags check, expired session logout success, method check - POST only)

Important design guidelines:
- Use `node:test` and `node:assert`.
- Use the helpers in `server/tests/infra/` (`testDb`, `testServer`, `testClient`).
- You can query `User` and `Profile` models directly to verify DB state (retrieve tokens, verify verification status, check wallet/rewards balances initialized to 0, check score initialized to 0, check no mock scores or tokens are created).
- Ensure the tests compile successfully (since models are already implemented in `server/src/models/User.ts` and `Profile.ts`).
- Execute `npx tsx --test tests/tier1/auth_tier1.test.ts` and `npx tsx --test tests/tier2/auth_tier2.test.ts` to verify they compile and run (expecting them to fail with 404/401/400 at runtime since routes are not yet implemented, which is expected. The focus is to make sure they compile, make HTTP requests, and setup/teardown properly).
- Record the output and commands in `handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Notify me via send_message when you are done.
Your identity: worker_tier1_tests
Original Parent Conv ID: 593767d0-1371-4a4a-967a-0a4aeab5e46a
Parent ID: 593767d0-1371-4a4a-967a-0a4aeab5e46a
