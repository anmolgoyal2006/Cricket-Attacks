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
 * One-time migration: drop the old non-sparse { matchId, playerId } unique index
 * from PlayerMatchStats. The old index treated null as a real value, causing a
 * duplicate key error (409) whenever two guest players appeared in the same match.
 * The schema now defines this index with sparse:true, but Mongoose never auto-drops
 * a changed index — we must drop it manually on startup.
 * This is a no-op once the index has been dropped (dropIndex resolves cleanly if
 * the named index doesn't exist).
 */
async function migratePlayerMatchStatsIndex() {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return;
        const collection = db.collection('playermatchstats');
        // Drop the old non-sparse compound index by its auto-generated name.
        // We catch and ignore errors for "index not found" (code 27) so this is idempotent.
        await collection.dropIndex('matchId_1_playerId_1');
        console.log('[migration] Dropped old non-sparse PlayerMatchStats index matchId_1_playerId_1');
    }
    catch (err) {
        if (err?.code === 27 || err?.codeName === 'IndexNotFound') {
            // Already gone — nothing to do
        }
        else {
            // Log but don't crash the server — Mongoose will re-create the correct sparse index
            console.warn('[migration] Could not drop PlayerMatchStats index:', err?.message ?? err);
        }
    }
}
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(index_1.config.mongodbUri, MONGOOSE_OPTIONS);
        console.log('Connected to MongoDB Atlas');
        await migratePlayerMatchStatsIndex();
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