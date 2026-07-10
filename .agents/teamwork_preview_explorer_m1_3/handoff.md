# Handoff Report: JWT Session Management Design (Milestone M1)

## 1. Observation

- **Existing API Route Design**:
  In `server/src/routes/api.routes.ts`, routes pass an insecure `sessionId` parameter in URLs:
  - Line 13: `router.get('/profile/:sessionId', profileController.getProfile.bind(profileController));`
  - Line 16: `router.get('/dashboard/:sessionId', dashboardController.getDashboard.bind(dashboardController));`
  - Line 19: `router.get('/income/:sessionId', financialController.getIncome.bind(financialController));`
  - Line 32: `router.get('/rewards/:sessionId', rewardController.getRewardBalance.bind(rewardController));`

- **Database Profile Model**:
  In `server/src/models/Profile.ts`, the schema identifies profiles via `sessionId`:
  - Line 4: `sessionId: string;`
  - Line 27: `sessionId: { type: String, required: true, unique: true }`

- **Dependencies**:
  In `server/package.json`, neither `jsonwebtoken` nor `cookie-parser` are present in `dependencies` (Lines 13-32).

---

## 2. Logic Chain

1. **Insecurity of Parameter-Based Session Tracking**: The existing routes rely entirely on URL parameters (e.g. `:sessionId`) to fetch user data. This is insecure since any client can manipulate the URL parameter to access another user's financial details.
2. **Stateless JWT Security**: Implementing JWT tokens stored in HttpOnly, SameSite, Secure cookies solves this. The client-side application cannot access the cookie, preventing XSS-based theft, and browser-enforced cookie rules handle sending it securely.
3. **Backward Compatibility**: To secure the existing code without breaking the parameterized routes right away, we can embed the existing `sessionId` inside the JWT payload alongside the MongoDB `userId` and user `email`.
4. **Middleware Validation**: When the server receives a request, the auth middleware will:
   a. Decode the token using `jsonwebtoken` after parsing cookies via `cookie-parser`.
   b. Verify the signature against `process.env.JWT_SECRET`.
   c. Compare the URL's `:sessionId` with the token's embedded `sessionId`. If they do not match, block with a `403 Forbidden` error. This bridges the existing architecture with the new secure session system seamlessly.

---

## 3. Caveats

- **Development Environment**: Local development runs on HTTP. The `Secure` cookie flag must be conditional (i.e. `Secure: process.env.NODE_ENV === 'production'`) to avoid blocking cookie transmission on localhost.
- **SessionId Reuse**: We assume `sessionId` is unique and directly mapped to the user profile, which aligns with `ProfileSchema` (`unique: true`). If a user deletes and recreates their profile, the JWT must be updated to reflect the new `sessionId`.

---

## 4. Conclusion

JWT utility helpers should be created in `server/src/utils/jwt.ts` to perform token generation, token verification, and cookie transmission/clearing. The JWT payload should consist of `userId`, `email`, and `sessionId`. The cookie configuration must include `HttpOnly: true`, `SameSite: 'strict'`, and conditional `Secure` flag, with a 24-hour expiration time.

---

## 5. Verification Method

- **Review Files**: Inspect the analysis report at `.agents/teamwork_preview_explorer_m1_3/analysis.md` for full implementation specs.
- **Implementation Validation**: When M1 implementation begins:
  - Check that `package.json` contains `"jsonwebtoken"` and `"cookie-parser"`.
  - Check that `server/src/utils/jwt.ts` defines `generateToken`, `verifyToken`, `sendTokenCookie`, and `clearTokenCookie` exactly matching the specs.
  - Run the backend compilation command `npm run build` or start development server `npm start` to check for compilation errors.
