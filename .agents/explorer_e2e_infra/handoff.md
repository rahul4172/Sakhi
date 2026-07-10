# Handoff Report — E2E Testing Track Exploration

## 1. Observation

Based on a thorough read-only analysis of the `server/` and `client/` directories, the following observations were recorded:

### Entry Points, Dependencies, and Configurations
*   **Server Entry Point:** The server entry point is defined in `server/package.json` (line 7) as `"start": "tsx src/server.ts"`.
*   **Server Dependencies:** Located in `server/package.json`, including:
    *   `express` (`^5.2.1`)
    *   `mongoose` (`^9.7.4`)
    *   `mongodb-memory-server` (`^11.2.0`)
    *   `dotenv` (`^17.4.2`)
    *   `tsx` (`^4.23.0`)
    *   `zod` (`^4.4.3`)
*   **Server Environment Configuration:** `server/.env` (lines 1-2) defines `MONGO_URI=mongodb+srv://...` and `OPENROUTER_API_KEY=...`. No server configuration templates (e.g. `.env.example`) exist.
*   **Client Entry Point:** The client entry point is `client/src/main.jsx`, which boots `client/src/App.jsx`. In `client/package.json`, scripts include `"dev": "vite"`.
*   **Client Dependencies:** In `client/package.json`, including:
    *   `react` (`^19.2.7`)
    *   `react-router-dom` (`^7.18.1`)
    *   `@tanstack/react-query` (`^5.101.2`)
    *   `axios` (`^1.18.1`)
    *   `vite` (`^8.1.1`)
*   **Client Environment Configuration:** There is no `.env` file or environment template in the `client/` directory.

### Existing Auth Entities (Routes, Models, Controllers, Middleware)
*   **Routes:** In `server/src/routes/api.routes.ts`, there are no routes matching `/api/auth/*`. The existing profile routes use `sessionId` directly:
    ```typescript
    // Profile
    router.post('/profile', profileController.createProfile.bind(profileController));
    router.get('/profile/:sessionId', profileController.getProfile.bind(profileController));
    ```
*   **Models:** In `server/src/models/`, there is no `User.ts`. There is a `Profile.ts` defining:
    ```typescript
    export interface IProfile extends Document {
      sessionId: string;
      name: string;
      occupation: 'tailoring' | 'beauty' | 'tiffin service' | 'handicrafts' | 'SHG member' | 'other';
      ...
    }
    ```
*   **Controllers:** In `server/src/controllers/`, `ProfileController.ts` processes requests with a Zod schema requiring `name`, `occupation`, and `sessionId`. No auth-related controllers exist.
*   **Middleware:** No authentication-related middleware files are present in `server/src/`. All route parameters are currently unauthenticated.

### Database Connection Logic
In `server/src/server.ts` (lines 24-33):
```typescript
let uri = process.env.MONGO_URI;
if (uri) {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB Cluster at: ' + uri.replace(/:[^@]+@/, ':****@'));
} else {
  const mongoServer = await MongoMemoryServer.create();
  uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log('MongoDB Memory Server connected at ' + uri);
}
```

### Existing Tests and Test Configurations
*   A workspace search for files containing `test` or `spec` (excluding `node_modules`) returned **0 results**.
*   Neither `server/package.json` nor `client/package.json` contains a `test` script or any test-related dependencies (e.g., `jest`, `vitest`, `supertest`, `mocha`, `cypress`, `playwright`).
*   `client/vite.config.js` does not have any test configuration.

---

## 2. Logic Chain

### Current State of Authentication
1. We observed that no `User.ts` model, `auth.routes.ts`, or authentication controllers/middleware exist.
2. We verified that existing profile endpoints use plain `sessionId` strings from the client.
3. **Conclusion:** Authentication features (Email signup, login, Google OAuth, route protection) are entirely unimplemented, matching the "PLANNED" status in `PROJECT.md` (M1–M6).

### Database Connections and In-Memory Mongo
1. We observed in `server/src/server.ts` that if `MONGO_URI` is not supplied, `MongoMemoryServer` is automatically instantiated and mongoose connects to it.
2. We verified that `mongodb-memory-server` is already present in `server/package.json` dependencies.
3. **Conclusion:** Running E2E tests against an in-memory database requires zero changes to the mongoose connection code; we just need to ensure `MONGO_URI` is blank or unset in the test environment.

### Verification and Password Reset Link Capturing
1. Since the SMTP and authentication code is not yet written, we must define the strategy for capture.
2. **Strategy Options:**
    *   *Option A (Console Log Spy):* If verification links are logged to console, the test runner can capture stdout. This is fragile to logging format changes.
    *   *Option B (In-Memory Mail Mock Service):* If the mailer service stores sent emails in a private in-memory array during testing (`process.env.NODE_ENV === 'test'`), tests can query this array directly to extract the verification link. This is robust, fast, and does not depend on file system or console manipulation.
3. **Conclusion:** We recommend implementing an in-memory mock mail store in the email service when `NODE_ENV === 'test'`.

### Google OAuth Mocking
1. Google OAuth backend verification will use `google-auth-library` to verify ID tokens.
2. Calling Google API during tests is impossible and undesirable.
3. **Bypass Strategies:**
    *   *Option A (Module Mocking):* Mock the `google-auth-library` using the test runner (e.g., `vi.mock('google-auth-library', ...)`).
    *   *Option B (Controller Bypass):* In the auth controller, if `process.env.NODE_ENV === 'test'` and the token matches a mock pattern (e.g. `mock-google-token-XYZ`), skip the Google API verification call and manually return a predefined user profile payload.
4. **Conclusion:** Option B is preferred for full E2E testing (like Playwright browser tests) because the server runs in a separate process where mock injection via test runners is complex. Option A is excellent for backend integration/unit tests.

### Testing Stack Suitability
1. The backend is an Express Node.js application using TypeScript.
2. The frontend is built on Vite + React 19 + TypeScript.
3. **Comparison of Test Frameworks:**
    *   *Jest:* Classic choice, but requires extra configuration for ESM and TypeScript in Vite environments.
    *   *Vitest:* Native support for TypeScript/ESM, incredibly fast, uses the same API as Jest, and shares Vite config settings. It is the perfect fit since the client is already on Vite.
    *   *Supertest:* Essential for Express integration tests. By importing `app.ts` into Supertest, we can test HTTP endpoints and automatically handle cookies assertions.
    *   *Playwright:* Best for true browser-based E2E tests, verifying React UI interaction combined with the actual Express server.
4. **Conclusion:** We recommend using:
    *   **Vitest** + **Supertest** for Backend APIs.
    *   **Vitest** + **React Testing Library** + **MSW** for Frontend components.
    *   **Playwright** for E2E flows (Signup -> Verify -> Login -> Dashboard).

---

## 3. Caveats

*   **No Source Code Implementation:** As a read-only investigation, no code has been modified or implemented. The recommended mocking schemes and test setup are configurations to be built by the implementer agent.
*   **Cookie Handling in Supertest:** Supertest does not automatically persist cookies across requests unless a `supertest.agent()` session is initialized. For authentication scenarios involving HttpOnly cookies, tests must use an agent instance.

---

## 4. Conclusion

1.  **Entry Points:** Server is `server/src/server.ts`; Client is `client/src/main.jsx`.
2.  **No Auth Code:** No authentication code, routes, or middleware exist. Profile is accessed via raw `sessionId`.
3.  **In-Memory Mongo:** Already supported. Clearing `process.env.MONGO_URI` triggers `mongodb-memory-server` automatically.
4.  **Email Mocking:** We recommend storing sent emails in an in-memory array on the server during test runs to allow test scripts to fetch verification/reset tokens easily.
5.  **OAuth Mocking:** We recommend a dual-approach: environment-based token bypass (starts with `mock-`) for E2E and module mocks for integration tests.
6.  **Testing Stack:** We propose **Vitest + Supertest** (Backend), **Vitest + React Testing Library** (Frontend), and **Playwright** (E2E).

---

## 5. Verification Method

Once the test framework is implemented, verify the infrastructure using:

1.  **Run backend tests:**
    ```bash
    npm run test:server
    ```
2.  **Run frontend tests:**
    ```bash
    npm run test:client
    ```
3.  **Run E2E tests:**
    ```bash
    npm run test:e2e
    ```
4.  **Invalidation Conditions:**
    *   If a real MongoDB connection is attempted during testing, verify that `MONGO_URI` is properly cleared or set to undefined in the test script.
    *   If Google OAuth token verification blocks, verify that the bypass pattern checks `process.env.NODE_ENV === 'test'`.
