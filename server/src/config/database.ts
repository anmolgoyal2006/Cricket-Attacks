import mongoose from 'mongoose';
import { config } from './index';

const MONGOOSE_OPTIONS = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 10000,
};

/**
 * One-time migrations run at startup to drop stale indexes from Atlas.
 * Mongoose never auto-drops indexes that have changed — we must do it manually.
 * All drops are idempotent: IndexNotFound (code 27) is silently ignored.
 */
async function runIndexMigrations(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const migrations: Array<{ collection: string; index: string; reason: string }> = [
    {
      collection: 'playermatchstats',
      index: 'matchId_1_playerId_1',
      reason: 'old non-sparse index — null playerId causes duplicate key for guest players',
    },
    {
      collection: 'balls',
      index: 'matchId_1_inningsId_1_over_1_ballNumber_1',
      reason: 'illegal deliveries (wides/no-balls) share over+ballNumber with next legal ball',
    },
  ];

  for (const m of migrations) {
    try {
      await db.collection(m.collection).dropIndex(m.index);
      console.log(`[migration] Dropped index ${m.index} from ${m.collection}: ${m.reason}`);
    } catch (err: any) {
      if (err?.code === 27 || err?.codeName === 'IndexNotFound') {
        // Already gone — nothing to do
      } else {
        console.warn(`[migration] Could not drop ${m.index} from ${m.collection}:`, err?.message ?? err);
      }
    }
  }
}

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, MONGOOSE_OPTIONS);
    console.log('Connected to MongoDB Atlas');
    await runIndexMigrations();
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
