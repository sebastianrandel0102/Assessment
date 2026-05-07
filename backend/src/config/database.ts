import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDatabase = async () => {
  dns.setServers(['8.8.8.8', '8.8.4.4']);

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log('Connected to MongoDB Atlas');
};