import { describe, before, after, test } from 'node:test';
import assert from 'node:assert';
import { connectTestDb, closeTestDb } from './testDb';
import { startTestServer, stopTestServer, getTestServerUrl } from './testServer';
import { TestClient } from './testClient';

describe('Liveness API E2E', () => {
  before(async () => {
    await connectTestDb();
    await startTestServer();
  });

  after(async () => {
    await stopTestServer();
    await closeTestDb();
  });

  test('should return 200 and liveness message', async () => {
    const client = new TestClient(getTestServerUrl());
    const response = await client.get('/');
    
    assert.strictEqual(response.status, 200);
    const text = await response.text();
    assert.strictEqual(text, 'SakhiCredit API is running');
  });
});
