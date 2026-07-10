## 2026-07-10T06:59:42Z
You are the Worker agent for the E2E Testing Track of the SakhiCredit authentication system.
Your working directory is: d:\Sakhi-main\Sakhi-main\.agents\worker_tier3_4_tests

Your task is to implement the M4 (Tier 3: Cross-Feature Combinations and Tier 4: Workflows) test suites.

Implement these suites in:
1. `server/tests/tier3/auth_tier3.test.ts` (Tier 3 Pairwise coverage):
   - Test 1: Signup -> Login without verification (verify login is either blocked or isVerified flag in user payload is false, or dashboard access fails until verification is complete).
   - Test 2: Google OAuth Login (auto-creates) -> Email Signup with the same email (should fail/reject or handle gracefully, preventing duplicate accounts).
   - Test 3: Email Signup -> Google OAuth Login with the same email (should succeed and authenticate user, mapping to the same account).
   - Test 4: Forgot password -> Reset password -> Login with old password (fails) -> Login with new password (succeeds).
   - Test 5: Login -> Forgot password request while logged in -> Verify that database updates reset token, and reset password works.

2. `server/tests/tier4/auth_tier4.test.ts` (Tier 4 Real-World Application Workflows):
   - Test 1: Complete User Lifecycle: Unauthenticated guest blocked from dashboard -> Sign up -> Receive mock verification link -> Verify email -> Login -> Access dashboard, BBPS, and Rewards -> Logout -> Dashboard access blocked again.
   - Test 2: Password Recovery Flow: Attacker fails to login -> User requests password reset -> Captures reset token from DB -> Resets password -> Old password fails to login -> New password logs in successfully -> Accesses dashboard.
   - Test 3: Multi-User Isolation: User A logs in and accesses dashboard (verify it matches User A's profile details) -> User B logs in and accesses dashboard (matches User B's profile details) -> Verify that User A's session cookies cannot be used to fetch User B's profile, and sessions are isolated.
   - Test 4: Google OAuth Lifecycle: Google OAuth login first time (auto-creates user, initializes wallet/rewards to zero) -> Access dashboard -> Logout -> Google OAuth login second time (returns existing walletAddress and keeps zero balances without recreating profile).
   - Test 5: Rate Limiter Recovery: Brute-force requests to login endpoints trigger rate limits (returns 429 Too Many Requests) and verify rate limit is applied.

Important design guidelines:
- Use `node:test` and `node:assert`.
- Use the helpers in `server/tests/infra/` (`testDb`, `testServer`, `testClient`).
- You can query `User` and `Profile` models directly to verify DB state (retrieve tokens, verify verification status, check wallet/rewards balances initialized to 0, check score initialized to 0, check no mock scores or tokens are created).
- Ensure the tests compile successfully (since models are already implemented in `server/src/models/User.ts` and `Profile.ts`).
- Execute `npx tsx --test tests/tier3/auth_tier3.test.ts` and `npx tsx --test tests/tier4/auth_tier4.test.ts` to verify they compile and run (expecting them to fail with 404/401/400 at runtime since routes are not yet implemented, which is expected. The focus is to make sure they compile, make HTTP requests, and setup/teardown properly).
- Record the output and commands in `handoff.md`.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Notify me via send_message when you are done.
Your identity: worker_tier3_4_tests
Original Parent Conv ID: 593767d0-1371-4a4a-967a-0a4aeab5e46a
Parent ID: 593767d0-1371-4a4a-967a-0a4aeab5e46a
