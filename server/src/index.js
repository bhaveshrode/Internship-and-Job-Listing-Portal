import { app, corsOrigins } from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    const mode = process.env.NODE_ENV || 'development';
    const corsMode = corsOrigins.length
      ? `CORS restricted to ${corsOrigins.join(', ')}`
      : 'CORS open (all origins)';
    console.log(`Server running on http://localhost:${PORT} [${mode}] — ${corsMode}`);
  });
});
