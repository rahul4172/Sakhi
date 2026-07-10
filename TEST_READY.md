# Test Ready - SakhiCredit Authentication System E2E Testing Track

This document details the test command, expected outcomes, coverage summary, and features checklist for the end-to-end (E2E) testing suite of the SakhiCredit authentication system.

## Test Command
To execute the E2E test suite, run the following command from the `server/` directory:
```bash
npm run test:e2e
```

## Expected Outcome
Once implementation is complete, all tests are expected to pass with exit code `0`.
During initial verification stages before the full backend API is implemented, the liveness test passes, while tiers 1-4 fail on HTTP status check assertions.

## Coverage Summary
The test suite consists of 90 test cases structured across different testing tiers:

| Tier | Test Cases | Description |
|---|---|---|
| **Tier 1** | 40 cases | Feature coverage (5 test cases per feature across 8 features) |
| **Tier 2** | 40 cases | Boundary, edge cases, and validation rules (5 test cases per feature across 8 features) |
| **Tier 3** | 5 cases | Pairwise/matrix configuration coverage (integrating different settings) |
| **Tier 4** | 5 cases | Real-world user journeys and workflows |
| **Total** | **90 cases** | Total coverage for the SakhiCredit E2E auth test suite |

## Feature Checklist
The following table shows the distribution of test cases and coverage indicators across all 8 core authentication features:

| Feature | Tier 1 (Cases) | Tier 2 (Cases) | Tier 3 (Pairwise) | Tier 4 (Workflows) |
| :--- | :---: | :---: | :---: | :---: |
| **Email Signup** | 5 | 5 | ✓ | ✓ |
| **Email Verification** | 5 | 5 | ✓ | ✓ |
| **Email Login** | 5 | 5 | ✓ | ✓ |
| **Google OAuth 2.0** | 5 | 5 | ✓ | ✓ |
| **Session Management & Route Protection** | 5 | 5 | ✓ | ✓ |
| **Forgot Password** | 5 | 5 | ✓ | ✓ |
| **Reset Password** | 5 | 5 | ✓ | ✓ |
| **Logout** | 5 | 5 | ✓ | ✓ |
