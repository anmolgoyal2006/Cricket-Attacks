import axios from 'axios';

const PLAYER_LIST_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CricbuzzService {
  private searchCache: Map<string, CacheEntry<any[]>> = new Map();
  private allPlayersCache: CacheEntry<any[]> | null = null;

  private getHeaders() {
    return {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': process.env.RAPIDAPI_HOST,
    };
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

  clearCache(): void {
    this.searchCache.clear();
    this.allPlayersCache = null;
  }
}

export default new CricbuzzService();
