/**
 * E2E Test Suite — Aggregated Runner
 * Starts shared DB + HTTP server once, runs all tiers, then tears down.
 */
import { describe, before, beforeEach, after } from 'node:test';
import { connectTestDb, clearTestDb, closeTestDb } from './infra/testDb';
import { startTestServer, stopTestServer } from './infra/testServer';

// --- Import all test suites as plain functions ---
import './infra/liveness.test';
import './tier1/auth_tier1.test';
import './tier2/auth_tier2.test';
import './tier3/auth_tier3.test';
import './tier4/auth_tier4.test';
