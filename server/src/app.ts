import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.routes';
import bbpsRoutes from './routes/bbps.routes';
import adminRoutes from './routes/admin.routes';
import { requireAuth } from './middlewares/auth';

const app = express();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  // Also support optional vercel previews/variations if needed
  if (process.env.FRONTEND_URL.includes('vercel.app')) {
    allowedOrigins.push(process.env.FRONTEND_URL.replace('https://', 'https://*.'));
  }
}

app.use(cors({
  origin: allowedOrigins,
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
