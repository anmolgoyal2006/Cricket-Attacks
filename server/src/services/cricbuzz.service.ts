import axios from 'axios';
import {
  CricbuzzLiveMatch,
  CricbuzzUpcomingMatch,
  LiveMatchesResponse,
  UpcomingMatchesResponse,
} from '../types/cricbuzz.types';

// Cache configuration
const CACHE_DURATION = 60 * 1000; // 60 seconds
const SEARCH_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const PLAYER_LIST_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CricbuzzService {
  private liveMatchesCache: CacheEntry<LiveMatchesResponse> | null = null;
  private upcomingMatchesCache: CacheEntry<UpcomingMatchesResponse> | null = null;
  private searchCache: Map<string, CacheEntry<any[]>> = new Map();
  private allPlayersCache: CacheEntry<any[]> | null = null;

  private getHeaders() {
    return {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': process.env.RAPIDAPI_HOST,
    };
  }

  private isCacheValid<T>(cache: CacheEntry<T> | null): boolean {
    if (!cache) return false;
    const now = Date.now();
    return now - cache.timestamp < CACHE_DURATION;
  }

  async fetchLiveMatches(): Promise<LiveMatchesResponse> {
    // Check cache first
    if (this.isCacheValid(this.liveMatchesCache)) {
      return {
        ...this.liveMatchesCache!.data,
        cached: true,
      };
    }

    try {
      const response = await axios.get(
        'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
        {
          headers: this.getHeaders(),
          timeout: 10000, // 10 second timeout
        }
      );

      const matches: CricbuzzLiveMatch[] = response.data.type === 'match' 
        ? [response.data] 
        : response.data.data || [];

      const result: LiveMatchesResponse = {
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
    } catch (error) {
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

  async fetchUpcomingMatches(): Promise<UpcomingMatchesResponse> {
    // Check cache first
    if (this.isCacheValid(this.upcomingMatchesCache)) {
      return {
        ...this.upcomingMatchesCache!.data,
        cached: true,
      };
    }

    try {
      const response = await axios.get(
        'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming',
        {
          headers: this.getHeaders(),
          timeout: 10000, // 10 second timeout
        }
      );

      const matches: CricbuzzUpcomingMatch[] = response.data.type === 'match'
        ? [response.data]
        : response.data.data || [];

      const result: UpcomingMatchesResponse = {
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
    } catch (error) {
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

  private async fetchAllPlayers(): Promise<any[]> {
    if (this.allPlayersCache && Date.now() - this.allPlayersCache.timestamp < PLAYER_LIST_CACHE_DURATION) {
      return this.allPlayersCache.data;
    }

    const teamIds = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const headers = {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY as string,
      'x-rapidapi-host': 'free-cricbuzz-cricket-api.p.rapidapi.com',
    };

    try {
      const responses = await Promise.all(
        teamIds.map(id =>
          axios.get(
            'https://free-cricbuzz-cricket-api.p.rapidapi.com/cricket-players',
            { params: { teamid: id }, headers, timeout: 10000 }
          ).then(r => r.data).catch(err => {
            console.error(`Failed to fetch players for team ${id}:`, err.message);
            return null;
          })
        )
      );

      const seen = new Set<string>();
      const combined: any[] = [];

      for (const data of responses) {
        if (!data) continue;
        const list: any[] = data?.response || (Array.isArray(data) ? data : data?.players || data?.data || []);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error fetching player list from Free Cricbuzz Cricket API:', message);

      if (this.allPlayersCache) {
        console.log('Returning expired cached player list due to API failure');
        return this.allPlayersCache.data;
      }

      throw new Error(`Player list fetch failed: ${message}`);
    }
  }

  async searchPlayers(query: string): Promise<{ id: string; name: string; slug: string; image: string }[]> {
    try {
      const allPlayers = await this.fetchAllPlayers();

      const normalizedQuery = query.toLowerCase().trim();
      const filtered = normalizedQuery.length < 2
        ? allPlayers
        : allPlayers.filter((p: any) => (p.title || '').toLowerCase().includes(normalizedQuery));

      return filtered.map((p: any) => ({
        id: String(p.id || ''),
        name: p.title || '',
        slug: p.slug || '',
        image: p.image || '',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error searching players:', message);
      throw new Error(`Player search failed: ${message}`);
    }
  }

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.liveMatchesCache = null;
    this.upcomingMatchesCache = null;
    this.searchCache.clear();
    this.allPlayersCache = null;
  }
}

export default new CricbuzzService();
