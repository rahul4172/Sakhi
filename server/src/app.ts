import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/api.routes';
import bbpsRoutes from './routes/bbps.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SakhiCredit API is running');
});

app.use('/api', apiRoutes);
app.use('/api/bbps', bbpsRoutes);
app.use('/api/admin', adminRoutes);

export default app;
