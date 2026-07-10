## 2026-07-10T06:54:04Z
You are the Worker agent for the E2E Testing Track of the SakhiCredit authentication system.
Your working directory is: d:\Sakhi-main\Sakhi-main\.agents\worker_e2e_infra

Your task is to implement the M1 milestone: Test Harness & Infra Setup.

Follow these steps:
1. Verify if the environment supports Node's built-in test runner on TypeScript files. You can write a temporary file and run `npx tsx --test <file>` to check.
2. Design and create the E2E test infra structure inside the folder `server/tests/infra/`. Do not modify any application code (like app.ts, server.ts, or models). Create the following files:
   - `testDb.ts`: A helper module to manage the database connection for tests. It should:
     - Check if mongoose is connected. If not, start a `MongoMemoryServer` (which is already in package.json) and connect mongoose.
     - Provide a function to clear all database collections between test cases.
     - Provide a function to close the mongoose connection and stop the in-memory server after all tests are done.
   - `testServer.ts`: A helper module to start and stop the Express app for testing. It should import `app` from `../../src/app.ts` and start it on a specific testing port (e.g. 5001).
   - `testClient.ts`: A class wrapping the built-in `fetch` that keeps track of the `Set-Cookie` headers returned by the server, parses them, and automatically adds the `Cookie` header to subsequent requests. This will emulate a cookie-preserving agent (like supertest.agent) for testing session cookies (HttpOnly, Secure JWT).
3. Create a test file `server/tests/infra/liveness.test.ts` that uses the built-in `node:test` and `node:assert` to:
   - Start the test database and server.
   - Use the `testClient` to make a GET request to `/`.
   - Assert that the response is `SakhiCredit API is running` with a 200 status code.
   - Tear down the server and database.
4. Run the test file to verify that the infra is working and compiling properly.
5. Record your commands and results in a `handoff.md` file in your working directory.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Notify me via send_message when you are done.
Your identity: worker_e2e_infra
Original Parent Conv ID: 593767d0-1371-4a4a-967a-0a4aeab5e46a
Parent ID: 593767d0-1371-4a4a-967a-0a4aeab5e46a
