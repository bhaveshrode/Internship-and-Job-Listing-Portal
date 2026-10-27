import mongoose from 'mongoose';

let pending;

// Connect once per process (or serverless instance), caching the in-flight
// promise so concurrent cold-start requests don't open duplicate sockets.
export function connectOnce() {
  if (mongoose.connection.readyState >= 1) return Promise.resolve();
  if (!pending) {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      return Promise.reject(new Error('MONGO_URI is not set. Add it to server/.env'));
    }
    pending = mongoose
      .connect(uri)
      .then(() => {
        console.log('MongoDB connected');
      })
      .catch((err) => {
        pending = null; // allow the next request/restart to retry
        throw err;
      });
  }
  return pending;
}

// Long-running server / CLI entry (index.js, seed.js): fail loudly at startup.
export async function connectDB() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set. Add it to server/.env');
    process.exit(1);
  }
  try {
    await connectOnce();
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
