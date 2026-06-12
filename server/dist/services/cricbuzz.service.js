"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
// Cache configuration
const CACHE_DURATION = 60 * 1000; // 60 seconds
const SEARCH_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const PLAYER_LIST_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes
class CricbuzzService {
    constructor() {
        this.liveMatchesCache = null;
        this.upcomingMatchesCache = null;
        this.searchCache = new Map();
        this.allPlayersCache = null;
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
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching live matches from Cricbuzz API:', message);
            // Return cached data if available, even if expired
            if (this.liveMatchesCache) {
                console.log('Returning expired cached data due to API failure');
                return {
                    ...this.liveMatchesCache.data,
                    cached: true,
                };
            }
            throw new Error(`Cricbuzz API error: ${message}`);
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
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching upcoming matches from Cricbuzz API:', message);
            // Return cached data if available, even if expired
            if (this.upcomingMatchesCache) {
                console.log('Returning expired cached data due to API failure');
                return {
                    ...this.upcomingMatchesCache.data,
                    cached: true,
                };
            }
            throw new Error(`Cricbuzz API error: ${message}`);
        }
    }
    async fetchAllPlayers() {
        if (this.allPlayersCache && Date.now() - this.allPlayersCache.timestamp < PLAYER_LIST_CACHE_DURATION) {
            return this.allPlayersCache.data;
        }
        const teamIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        const headers = {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'free-cricbuzz-cricket-api.p.rapidapi.com',
        };
        try {
            const responses = await Promise.all(teamIds.map(id => axios_1.default.get('https://free-cricbuzz-cricket-api.p.rapidapi.com/cricket-players', { params: { teamid: id }, headers, timeout: 10000 }).then(r => r.data).catch(err => {
                console.error(`Failed to fetch players for team ${id}:`, err.message);
                return null;
            })));
            const seen = new Set();
            const combined = [];
            for (const data of responses) {
                if (!data)
                    continue;
                const list = data?.response || (Array.isArray(data) ? data : data?.players || data?.data || []);
                for (const player of list) {
                    const pid = String(player.id || '');
                    if (pid && !seen.has(pid)) {
                        seen.add(pid);
                        combined.push(player);
                    }
                }
            }
            this.allPlayersCache = { data: combined, timestamp: Date.now() };
            console.log(`Cached ${combined.length} unique players from ${teamIds.length} teams`);
            return combined;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching player list from Free Cricbuzz Cricket API:', message);
            if (this.allPlayersCache) {
                console.log('Returning expired cached player list due to API failure');
                return this.allPlayersCache.data;
            }
            throw new Error(`Player list fetch failed: ${message}`);
        }
    }
    async searchPlayers(query) {
        try {
            const allPlayers = await this.fetchAllPlayers();
            const normalizedQuery = query.toLowerCase().trim();
            const filtered = normalizedQuery.length < 2
                ? allPlayers
                : allPlayers.filter((p) => (p.title || '').toLowerCase().includes(normalizedQuery));
            return filtered.map((p) => ({
                id: String(p.id || ''),
                name: p.title || '',
                slug: p.slug || '',
                image: p.image || '',
            }));
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error searching players:', message);
            throw new Error(`Player search failed: ${message}`);
        }
    }
    // Clear cache (useful for testing or manual refresh)
    clearCache() {
        this.liveMatchesCache = null;
        this.upcomingMatchesCache = null;
        this.searchCache.clear();
        this.allPlayersCache = null;
    }
}
exports.default = new CricbuzzService();
//# sourceMappingURL=cricbuzz.service.js.map