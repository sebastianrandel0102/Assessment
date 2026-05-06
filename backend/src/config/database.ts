import mongoose from 'mongoose';
import { env } from './env';

export function connectDatabase() {
  return mongoose
    .connect(env.mongoUri)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB Connection Error:', err));
}
