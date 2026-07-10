## 2026-07-10T07:02:25Z
<USER_REQUEST>
You are worker_m2. Your working directory is d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_worker_m2.
Your task is to implement Milestone M2: Email Auth Endpoints.
1. Read the global PROJECT.md, the local SCOPE.md (d:\Sakhi-main\Sakhi-main\.agents\sub_orch_implementation\SCOPE.md), the ORIGINAL_REQUEST.md (d:\Sakhi-main\Sakhi-main\.agents\ORIGINAL_REQUEST.md), and the Explorer reports at:
   - d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m2_1\analysis.md / handoff.md
   - d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m2_2\analysis.md / handoff.md
   - d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m2_3\analysis.md / handoff.md
2. Implement the following:
   - Modify server/src/app.ts to import and register cookie-parser middleware.
   - Create server/src/services/MailService.ts that exports sendVerificationEmail(email: string, token: string) and sendPasswordResetEmail(email: string, token: string). If SMTP credentials are not set in .env, log the verification/reset link to the console, and write an entry using the AuditLog model (storing the link) for testing.
   - Create server/src/controllers/AuthController.ts to handle:
     - signup: Create user, hash password via the pre-save hook, generate verificationToken, save, invoke ProfileService to create a zero-initialized profile (sessionId = User._id), send verification email.
     - verifyEmail: Find user by token, set isVerified to true, clear token.
     - login: Validate credentials, verify that the user is verified (isVerified must be true, otherwise return 401), generate JWT session token, send cookie.
     - logout: Clear token cookie.
     - forgotPassword: Generate a raw token, save the SHA-256 hash in DB, set 1 hour expiry, send reset email.
     - resetPassword: Find user by SHA-256 token hash, check expiry, hash new password, save user, clear token fields.
   - Create server/src/routes/auth.routes.ts and mount it under /api/auth.
3. Write integration tests verifying signup, email verification, login, logout, forgot-password, reset-password in server/src/tests/auth_m2.test.ts. Verify that the typescript compiler compiles with no errors (npx tsc --noEmit or similar).
4. Run the tests (npx tsx --test src/tests/auth_m2.test.ts) and verify they pass.
5. Write a comprehensive handoff report to d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_worker_m2\handoff.md documenting your changes, verification commands, and build results.
6. Notify the parent agent (conversation ID 9db1f6b0-9c88-40ae-83b5-7e74d3093b6a) using the send_message tool.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.
</USER_REQUEST>
