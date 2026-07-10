/**
 * Global E2E Test Suite Runner
 * Spins up DB + server once, runs all test suites, then tears down.
 */
import { describe, before, after, beforeEach } from 'node:test';
import { connectTestDb, clearTestDb, closeTestDb } from './testDb';
import { startTestServer, stopTestServer } from './testServer';

export async function setupGlobal() {
  await connectTestDb();
  await startTestServer();
}

export async function teardownGlobal() {
  await stopTestServer();
  await closeTestDb();
}

export async function clearBetweenTests() {
  await clearTestDb();
}
