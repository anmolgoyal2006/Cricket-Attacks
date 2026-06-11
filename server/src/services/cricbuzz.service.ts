import axios from 'axios';
import {
  CricbuzzLiveMatch,
  CricbuzzUpcomingMatch,
  LiveMatchesResponse,
  UpcomingMatchesResponse,
} from '../types/cricbuzz.types';

// Cache configuration
const CACHE_DURATION = 60 * 1000; // 60 seconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CricbuzzService {
  private liveMatchesCache: CacheEntry<LiveMatchesResponse> | null = null;
  private upcomingMatchesCache: CacheEntry<UpcomingMatchesResponse> | null = null;

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

  // Clear cache (useful for testing or manual refresh)
  clearCache(): void {
    this.liveMatchesCache = null;
    this.upcomingMatchesCache = null;
  }
}

export default new CricbuzzService();
