## 2026-07-10T06:53:56Z
You are worker_m1. Your working directory is d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_worker_m1.
Your task is to implement Milestone M1: User Schema & Auth Base for the SakhiCredit application.
1. Read the global PROJECT.md, the local SCOPE.md (d:\Sakhi-main\Sakhi-main\.agents\sub_orch_implementation\SCOPE.md), the ORIGINAL_REQUEST.md (d:\Sakhi-main\Sakhi-main\.agents\ORIGINAL_REQUEST.md), and the Explorer reports at:
   - d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m1_1\handoff.md and analysis.md
   - d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m1_2\handoff.md and analysis.md
   - d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m1_3\handoff.md and analysis.md
2. Implement the following:
   - Install needed packages in server directory: bcryptjs, @types/bcryptjs, jsonwebtoken, @types/jsonwebtoken, cookie-parser, @types/cookie-parser, google-auth-library, express-rate-limit, nodemailer, @types/nodemailer.
   - Create User mongoose model in server/src/models/User.ts with email, password, optional googleId, isVerified, verificationToken, resetToken, and resetTokenExpires. Add a pre-save mongoose hook to hash the password using bcryptjs (salt rounds: 10). Add a comparePassword instance method to compare passwords.
   - Make sure profile creation maps Profile.sessionId to the User._id string, initializes wallet balance, currentScore to 0, tokenHistory & scoreHistory to empty list, and skips welcome minting.
   - Create JWT helpers in server/src/utils/jwt.ts: generateToken(payload: { userId: string, email: string, sessionId: string }) and verifyToken(token: string).
3. Run the typescript compilation or build checks in the server directory (e.g. npx tsc --noEmit or similar) to verify that the project compiles with no errors.
4. Write a comprehensive handoff report to d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_worker_m1\handoff.md documenting your changes, verification commands, and build results.
5. Notify the parent agent (conversation ID 9db1f6b0-9c88-40ae-83b5-7e74d3093b6a) using the send_message tool.

MANDATORY INTEGRITY WARNING:
> DO NOT CHEAT. All implementations must be genuine. DO NOT
> hardcode test results, create dummy/facade implementations, or
> circumvent the intended task. A Forensic Auditor will independently
> verify your work. Integrity violations WILL be detected and your
> work WILL be rejected.
