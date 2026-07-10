## 2026-07-10T07:00:00Z

You are Explorer 3 for Milestone M2. Your working directory is d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m2_3.
Your task is to investigate the Forgot Password and Reset Password flow for Milestone M2 (Email Auth Endpoints).
1. Read the global PROJECT.md, local SCOPE.md (d:\Sakhi-main\Sakhi-main\.agents\sub_orch_implementation\SCOPE.md), and ORIGINAL_REQUEST.md (d:\Sakhi-main\Sakhi-main\.agents\ORIGINAL_REQUEST.md).
2. Investigate how `/api/auth/forgot-password` and `/api/auth/reset-password` should be implemented.
   - For Forgot Password: generate a reset token and expiration, save it to the User document, and send reset link via nodemailer (or log to console/DB).
   - For Reset Password: find user by token, check expiration, verify, hash new password, save user, clear reset token.
3. Recommend how the reset link should look, and what checks are required to prevent token reuse or expired tokens.
4. Write your findings to d:\Sakhi-main\Sakhi-main\.agents\teamwork_preview_explorer_m2_3\analysis.md.
5. Return a summary of your findings to the parent agent (conversation ID 9db1f6b0-9c88-40ae-83b5-7e74d3093b6a) using the send_message tool.
Remember: DO NOT modify any code files.
