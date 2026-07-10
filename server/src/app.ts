import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.routes';
import bbpsRoutes from './routes/bbps.routes';
import adminRoutes from './routes/admin.routes';
import { requireAuth } from './middlewares/auth';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowed = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:3000'
    ];

    const isLocalhost = origin.startsWith('http://localhost:');
    const isVercel = origin.endsWith('.vercel.app');
    const isCustomFrontend = process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL;

    if (isLocalhost || isVercel || isCustomFrontend || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('SakhiCredit API is running');
});

app.use('/api', apiRoutes);
app.use('/api/bbps', requireAuth, bbpsRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

export default app;
