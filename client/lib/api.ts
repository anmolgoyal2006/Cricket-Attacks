const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  getMe: () => api<{ user: any }>('/auth/me'),
};

// Cards API
export const cardsApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ cards: any[]; pagination: any }>(`/cards${query}`, { auth: false });
  },
  getById: (id: string) =>
    api<{ card: any }>(`/cards/${id}`, { auth: false }),
};

// User Cards API
export const userCardsApi = {
  getMyCards: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ cards: any[]; pagination: any }>(`/user-cards${query}`);
  },
  getStats: () => api<{ stats: any; rarityBreakdown: any[] }>('/user-cards/stats'),
};

// Packs API
export const packsApi = {
  getPacks: () => api<{ packs: any[] }>('/packs', { auth: false }),
  openPack: (packType: string) =>
    api<{ results: any[]; coins: number; dailyPackOpenedAt: string | null }>(
      '/packs/open',
      { method: 'POST', body: { packType } }
    ),
  getHistory: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ openings: any[]; pagination: any }>(`/packs/history${query}`);
  },
};

// Battles API
export const battlesApi = {
  startPvE: (squadCardIds: string[]) =>
    api<{
      battleId: string;
      playerCards: any[];
      aiCards: any[];
      attributeOrder: string[];
      currentRound: number;
      totalRounds: number;
    }>('/battles/pve', { method: 'POST', body: { squadCardIds } }),
  playRound: (battleId: string, playerCardId: string) =>
    api<{
      roundNumber: number;
      playerCard: any;
      computerCard: any;
      winner: string;
      playerScore: number;
      computerScore: number;
      isOver: boolean;
      battleResult?: string;
      trophiesEarned: number;
      xpEarned: number;
    }>(`/battles/${battleId}/round`, {
      method: 'POST',
      body: { playerCardId },
    }),
  getById: (id: string) => api<{ battle: any }>(`/battles/${id}`),
  getHistory: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ battles: any[]; pagination: any }>(`/battles${query}`);
  },
};

// Leaderboard API
export const leaderboardApi = {
  get: (limit?: number) =>
    api<{ leaderboard: any[] }>(`/leaderboard${limit ? `?limit=${limit}` : ''}`, {
      auth: false,
    }),
  getMyRank: () => api<{ rank: number; username: string; trophies: number; battlesWon: number; battlesPlayed: number; winRate: number }>('/leaderboard/my-rank'),
};
