"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const index_1 = require("./index");
async function connectDatabase() {
    try {
        await mongoose_1.default.connect(index_1.config.mongodbUri);
        console.log('Connected to MongoDB Atlas');
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        console.log('Server will start without database — retrying in 5s...');
        setTimeout(() => {
            mongoose_1.default.connect(index_1.config.mongodbUri).catch((err) => {
                console.error('MongoDB retry failed:', err);
            });
        }, 5000);
    }
    mongoose_1.default.connection.on('error', (err) => {
        console.error('MongoDB runtime error:', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.log('MongoDB disconnected, reconnecting...');
        mongoose_1.default.connect(index_1.config.mongodbUri).catch((err) => {
            console.error('MongoDB reconnection failed:', err);
        });
    });
}
//# sourceMappingURL=database.js.map