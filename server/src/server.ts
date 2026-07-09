import 'dotenv/config';
import dns from 'dns';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createServer } from 'http';
import app from './app';
import { initSocket } from './SocketServer';
import { seedBBPS } from './seedBBPS';

// Set DNS to Google DNS to fix SRV lookup (ECONNREFUSED) for MongoDB Atlas on some ISPs/routers
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  console.warn('Failed to set custom DNS servers:', e);
}

const PORT = process.env.PORT || 5000;
const httpServer = createServer(app);

initSocket(httpServer);

async function startServer() {
  try {
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
    
    await seedBBPS();

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
