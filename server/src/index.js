import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import opportunitiesRouter from './routes/opportunities.js';
import applicationsRouter from './routes/applications.js';
import domainsRouter from './routes/domains.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/domains', domainsRouter);
app.use('/api/admin', authRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Central error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ message: err.message });
  }
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
