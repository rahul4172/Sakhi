import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;

/**
 * Connect to MongoDB Memory Server if not already connected.
 */
export async function connectTestDb(): Promise<void> {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState === 0) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Test MongoDB Memory Server connected.');
  }
}

/**
 * Clear all collections between test cases.
 */
export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

/**
 * Close mongoose connection and stop MongoDB Memory Server.
 */
export async function closeTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
    console.log('Test MongoDB Memory Server stopped.');
  }
}
