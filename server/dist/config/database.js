"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./index");
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
async function runIndexMigrations() {
    const db = mongoose_1.default.connection.db;
    if (!db)
        return;
    const migrations = [
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
        }
        catch (err) {
            if (err?.code === 27 || err?.codeName === 'IndexNotFound') {
                // Already gone — nothing to do
            }
            else {
                console.warn(`[migration] Could not drop ${m.index} from ${m.collection}:`, err?.message ?? err);
            }
        }
    }
}
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(index_1.config.mongodbUri, MONGOOSE_OPTIONS);
        console.log('Connected to MongoDB Atlas');
        await runIndexMigrations();
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Server will start without database — retrying in 5s...');
        setTimeout(() => {
            mongoose_1.default.connect(index_1.config.mongodbUri, MONGOOSE_OPTIONS).catch((err) => {
                console.error('MongoDB retry failed:', err);
            });
        }, 5000);
    }
    mongoose_1.default.connection.on('error', (err) => {
        console.error('MongoDB runtime error:', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.log('MongoDB disconnected, reconnecting...');
        mongoose_1.default.connect(index_1.config.mongodbUri, MONGOOSE_OPTIONS).catch((err) => {
            console.error('MongoDB reconnection failed:', err);
        });
    });
}
//# sourceMappingURL=database.js.map