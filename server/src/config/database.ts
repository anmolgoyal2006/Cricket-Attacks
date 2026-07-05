import mongoose from 'mongoose';
import { config } from './index';

const MONGOOSE_OPTIONS = {
  tls: true,
  tlsAllowInvalidCertificates: true,
  serverSelectionTimeoutMS: 10000,
  // Disable autoIndex — we manage index creation explicitly after migrations
  // so Mongoose never silently recreates a dropped or changed index.
  autoIndex: false,
};

/**
 * Drop stale/incorrect indexes before Mongoose creates the correct ones.
 * All drops are idempotent — IndexNotFound (code 27) is silently ignored.
 *
 * Why we need this:
 * - Mongoose never auto-drops a changed index; it only adds new ones.
 * - autoIndex:false means Mongoose won't create ANY index automatically.
 * - We drop old indexes here, then call ensureIndexes() below so Mongoose
 *   creates exactly what the current schema declares — nothing more, nothing less.
 */
async function runIndexMigrations(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) return;

  const toDrop: Array<{ collection: string; index: string }> = [
    // Old non-sparse { matchId, playerId } unique index — null playerId collides
    { collection: 'playermatchstats', index: 'matchId_1_playerId_1' },
    // sparse:true version — also wrong, sparse still indexes explicit null values
    // The new schema uses partialFilterExpression instead, which truly excludes nulls
    { collection: 'playermatchstats', index: 'matchId_1_playerId_1_sparse' },
    // Balls unique index on over+ballNumber — wides/no-balls share same position
    { collection: 'balls', index: 'matchId_1_inningsId_1_over_1_ballNumber_1' },
  ];

  for (const { collection, index } of toDrop) {
    try {
      await db.collection(collection).dropIndex(index);
      console.log(`[migration] Dropped index ${index} from ${collection}`);
    } catch (err: any) {
      if (err?.code === 27 || err?.codeName === 'IndexNotFound') {
        // Already gone — nothing to do
      } else {
        console.warn(`[migration] Could not drop ${index} from ${collection}:`, err?.message ?? err);
      }
    }
  }
}

/**
 * After migrations, sync the indexes declared in each model schema to Atlas.
 * Because autoIndex:false is set, Mongoose won't do this automatically —
 * we call it explicitly here so we're in full control of the order.
 */
async function ensureAllIndexes(): Promise<void> {
  // Import models here to avoid circular-import issues at module load time.
  // Each model.ensureIndexes() creates any indexes declared in its schema
  // that don't already exist in Atlas.
  const models = Object.values(mongoose.models);
  await Promise.all(models.map((m) => m.ensureIndexes().catch((err: any) => {
    console.warn(`[indexes] ensureIndexes failed for ${m.modelName}:`, err?.message ?? err);
  })));
  console.log('[indexes] All model indexes ensured');
}

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, MONGOOSE_OPTIONS);
    console.log('Connected to MongoDB Atlas');
    // 1. Drop stale/wrong indexes
    await runIndexMigrations();
    // 2. Let Mongoose create the correct indexes from current schema declarations
    await ensureAllIndexes();
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
