import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.routes';
import bbpsRoutes from './routes/bbps.routes';
import adminRoutes from './routes/admin.routes';
import { requireAuth } from './middlewares/auth';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
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
