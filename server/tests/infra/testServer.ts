import { createServer, Server } from 'http';
import app from '../../src/app';
import { initSocket } from '../../src/SocketServer';

let httpServer: Server | null = null;
const TEST_PORT = 5001;

/**
 * Start the test Express app and initialize SocketServer.
 */
export function startTestServer(): Promise<Server> {
  return new Promise((resolve, reject) => {
    if (httpServer) {
      return resolve(httpServer);
    }

    httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(TEST_PORT, () => {
      console.log(`Test Server running on port ${TEST_PORT}`);
      resolve(httpServer!);
    });

    httpServer.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Stop the test server.
 */
export function stopTestServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!httpServer) {
      return resolve();
    }

    httpServer.close((err) => {
      if (err) {
        return reject(err);
      }
      httpServer = null;
      resolve();
    });
  });
}

/**
 * Get the base URL of the running test server.
 */
export function getTestServerUrl(): string {
  return `http://localhost:${TEST_PORT}`;
}
