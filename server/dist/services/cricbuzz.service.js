"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// Cache configuration
const CACHE_DURATION = 60 * 1000; // 60 seconds
class CricbuzzService {
    constructor() {
        this.liveMatchesCache = null;
        this.upcomingMatchesCache = null;
    }
    getHeaders() {
        return {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': process.env.RAPIDAPI_HOST,
        };
    }
    isCacheValid(cache) {
        if (!cache)
            return false;
        const now = Date.now();
        return now - cache.timestamp < CACHE_DURATION;
    }
    async fetchLiveMatches() {
        // Check cache first
        if (this.isCacheValid(this.liveMatchesCache)) {
            return {
                ...this.liveMatchesCache.data,
                cached: true,
            };
        }
        try {
            const response = await axios_1.default.get('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live', {
                headers: this.getHeaders(),
                timeout: 10000, // 10 second timeout
            });
            const matches = response.data.type === 'match'
                ? [response.data]
                : response.data.data || [];
            const result = {
                matches,
                cached: false,
                timestamp: Date.now(),
            };
            // Update cache
            this.liveMatchesCache = {
                data: result,
                timestamp: Date.now(),
            };
            return result;
        }
        catch (error) {
            console.error('Error fetching live matches from Cricbuzz API:', error);
            // Return cached data if available, even if expired
            if (this.liveMatchesCache) {
                console.log('Returning expired cached data due to API failure');
                return {
                    ...this.liveMatchesCache.data,
                    cached: true,
                };
            }
            // Return empty array if no cache available
            return {
                matches: [],
                cached: false,
                timestamp: Date.now(),
            };
        }
    }
    async fetchUpcomingMatches() {
        // Check cache first
        if (this.isCacheValid(this.upcomingMatchesCache)) {
            return {
                ...this.upcomingMatchesCache.data,
                cached: true,
            };
        }
        try {
            const response = await axios_1.default.get('https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming', {
                headers: this.getHeaders(),
                timeout: 10000, // 10 second timeout
            });
            const matches = response.data.type === 'match'
                ? [response.data]
                : response.data.data || [];
            const result = {
                matches,
                cached: false,
                timestamp: Date.now(),
            };
            // Update cache
            this.upcomingMatchesCache = {
                data: result,
                timestamp: Date.now(),
            };
            return result;
        }
        catch (error) {
            console.error('Error fetching upcoming matches from Cricbuzz API:', error);
            // Return cached data if available, even if expired
            if (this.upcomingMatchesCache) {
                console.log('Returning expired cached data due to API failure');
                return {
                    ...this.upcomingMatchesCache.data,
                    cached: true,
                };
            }
            // Return empty array if no cache available
            return {
                matches: [],
                cached: false,
                timestamp: Date.now(),
            };
        }
    }
    // Clear cache (useful for testing or manual refresh)
    clearCache() {
        this.liveMatchesCache = null;
        this.upcomingMatchesCache = null;
    }
}
exports.default = new CricbuzzService();
//# sourceMappingURL=cricbuzz.service.js.map