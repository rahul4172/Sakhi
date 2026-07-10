# Scope: E2E Testing Track

## Architecture
- Dual-track requirement-driven opaque-box testing.
- Target endpoints: `/api/auth/signup`, `/api/auth/verify-email`, `/api/auth/login`, `/api/auth/google`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`.
- Protected endpoints: `/api/dashboard`, `/api/bbps/pay`, `/api/rewards`.
- Test environment setup: Express App integration using `supertest` and in-memory MongoDB via `mongodb-memory-server`.
- Capturing verification and reset links via in-memory mailer array or log interceptor on the server.
- Mocking Google OAuth 2.0 with mock tokens starting with `mock-google-token-`.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| M1 | Test Harness & Infra Setup | Setup testing frameworks, dependencies, custom test runner, DB/mail/OAuth mock helpers | None | DONE |
| M2 | Tier 1: Feature Coverage | >= 5 test cases per feature (8 features, total >= 40 cases) | M1 | DONE |
| M3 | Tier 2: Boundary & Corner Cases | >= 5 test cases per feature (8 features, total >= 40 cases) | M1 | DONE |
| M4 | Tier 3 (Cross-Feature) & Tier 4 (Workflows) | Pairwise coverage (Tier 3) and full application user scenarios (Tier 4) | M2, M3 | DONE |
| M5 | Final Review & Ready | Run all test suites, compile test report, publish `TEST_READY.md` | M4 | IN_PROGRESS (worker_final_verifier) |
