import mongoose from 'mongoose';
import { config } from './index';

const MONGOOSE_OPTIONS = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 10000,
};

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, MONGOOSE_OPTIONS);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Server will start without database — retrying in 5s...');
    setTimeout(() => {
      mongoose.connect(config.mongodbUri, MONGOOSE_OPTIONS).catch((err) => {
        console.error('MongoDB retry failed:', err);
      });
    }, 5000);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected, reconnecting...');
    mongoose.connect(config.mongodbUri, MONGOOSE_OPTIONS).catch((err) => {
      console.error('MongoDB reconnection failed:', err);
    });
  });
}
