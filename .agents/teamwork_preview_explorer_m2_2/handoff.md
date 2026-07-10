# Handoff Report: Login, Logout, and JWT Session Generation (M2)

## 1. Observation
- **User Verification Flag**: In `server/src/models/User.ts` (lines 8, 33-36):
  ```typescript
  isVerified: boolean;
  ...
  isVerified: {
    type: Boolean,
    default: false
  }
  ```
- **Login Block before Verification**: In `server/tests/tier1/auth_tier1.test.ts` (lines 319-332):
  ```typescript
  test('should prevent login before verification is completed', async () => {
    const client = new TestClient(getTestServerUrl());
    await User.create({
      email: 'prevent_login@example.com',
      password: 'Password123',
      isVerified: false
    });

    const response = await client.post('/api/auth/login', {
      email: 'prevent_login@example.com',
      password: 'Password123'
    });
    assert.strictEqual(response.status, 401);
  });
  ```
- **Login Allowed after Verification**: In `server/tests/tier1/auth_tier1.test.ts` (lines 208-234):
  ```typescript
  test('should allow user login after email has been verified', async () => {
    ...
    // Try login before verify
    const loginBefore = await client.post('/api/auth/login', { ... });
    assert.strictEqual(loginBefore.status, 401);

    // Verify
    const verifyRes = await client.get('/api/auth/verify-email?token=login-token');
    assert.strictEqual(verifyRes.status, 200);

    // Try login after verify
    const loginAfter = await client.post('/api/auth/login', { ... });
    assert.strictEqual(loginAfter.status, 200);
  });
  ```
- **HttpOnly Cookie Assertion on Login**: In `server/tests/tier1/auth_tier1.test.ts` (lines 252-256):
  ```typescript
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.match(setCookie, /token=/);
  assert.match(setCookie, /HttpOnly/i);
  ```
- **Secure and SameSite Cookie Assertion on Login**: In `server/tests/tier1/auth_tier1.test.ts` (lines 313-316):
  ```typescript
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Strict/i);
  ```
- **Cookie Clearing on Logout**: In `server/tests/tier1/auth_tier1.test.ts` (lines 635-638):
  ```typescript
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.match(setCookie, /token=;?/);
  assert.match(setCookie, /Max-Age=0/i);
  ```
- **Secure Attributes on Logout Clear**: In `server/tests/tier1/auth_tier1.test.ts` (lines 678-682):
  ```typescript
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Strict/i);
  ```
- **Logout Endpoint Method Enforcement**: In `server/tests/tier2/auth_tier2.test.ts` (lines 414-418):
  ```typescript
  test('should reject GET request to logout endpoint with 404 or 405', async () => {
    const client = new TestClient(getTestServerUrl());
    const response = await client.get('/api/auth/logout');
    assert.ok(response.status === 404 || response.status === 405);
  });
  ```

---

## 2. Logic Chain
1. **Fact**: The `User` model defines `isVerified: boolean` defaulting to `false`.
2. **Fact**: In the integration test suite (`auth_tier1.test.ts`), any user attempting to log in via `/api/auth/login` while `isVerified` is `false` returns `401 Unauthorized` (Observation: lines 319-332).
3. **Fact**: Login is only permitted (status `200`) after the verification link has been successfully queried (changing `isVerified` to `true`) (Observation: lines 208-234).
4. **Inference**: Therefore, the login endpoint MUST enforce that `isVerified === true` and block unverified login requests with `401 Unauthorized`.
5. **Fact**: The login response checks the `set-cookie` header to verify the presence of `token`, `HttpOnly`, `Secure`, and `SameSite=Strict` (Observation: lines 252-256 and 313-316).
6. **Inference**: Thus, the server must set cookie attributes to `{ httpOnly: true, secure: true, sameSite: 'strict' }`.
7. **Fact**: The logout response checks that the `token` cookie is cleared with `Max-Age=0` and maintains all secure cookie attributes (`HttpOnly`, `Secure`, `SameSite=Strict`) (Observation: lines 635-638 and 678-682).
8. **Inference**: Therefore, logout must call `res.cookie('token', '', { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 0 })`.
9. **Fact**: The test suite rejects GET requests to the logout endpoint, expecting `404` or `405` (Observation: lines 414-418).
10. **Inference**: This means `/api/auth/logout` must be defined exclusively as a POST route.

---

## 3. Caveats
- This investigation is strictly read-only and does not implement the endpoints or route middleware.
- Assumes the existence of `cookie-parser` in the main server application flow. Since `cookie-parser` is present in `package.json` but not currently registered in `server/src/app.ts`, the implementation step must add `app.use(cookieParser())`.
- Google OAuth (Milestone M3) login flow must also generate cookies in the exact same manner.

---

## 4. Conclusion
- Email verification **must** block login. Attempting to log in with `isVerified: false` must return `401 Unauthorized`.
- Login requires a POST request to `/api/auth/login` with `email` and `password`. It returns a 200 OK with the payload `{ user: { id, email, name } }` where `name` is sourced from the user's `Profile`.
- A signed JWT token must be generated via `generateToken({ userId, email, sessionId })` and sent back as a cookie: `token=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400000`.
- Logout requires a POST request to `/api/auth/logout`. It must clear the cookie via `Set-Cookie: token=; Max-Age=0; HttpOnly; Secure; SameSite=Strict` and return `200 OK` (idempotent, handling empty sessions gracefully).

---

## 5. Verification Method
1. To run tests and verify implementation, run:
   ```powershell
   npm test server/tests/tier1/auth_tier1.test.ts
   npm test server/tests/tier2/auth_tier2.test.ts
   ```
2. The verification will pass once the endpoint logic is written and tests under the block `Feature 3: Email Login` and `Feature 8: Logout` are successfully executed.
