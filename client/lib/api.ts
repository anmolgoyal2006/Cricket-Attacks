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
    api<{ token: string; user: any; firstLoginBonus?: any[]; welcomeBonus?: any[] }>('/auth/register', {
      method: 'POST',
      body: data,
      auth: false,
    }),
  login: (data: { email: string; password: string }) =>
    api<{ token: string; user: any; firstLoginBonus?: { coins: number; message: string } | null }>('/auth/login', {
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
      coinsEarned: number;
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
  get: (limit?: number, season?: number) => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (season) params.set('season', season.toString());
    const qs = params.toString();
    return api<{ leaderboard: any[] }>(`/leaderboard${qs ? `?${qs}` : ''}`, { auth: false });
  },
  getMyRank: (season?: number) => {
    const qs = season ? `?season=${season}` : '';
    return api<any>(`/leaderboard/my-rank${qs}`);
  },
};

// Profile API
export const profileApi = {
  getMyProfile: () => api<{ profile: any }>('/profile/me'),
  getProfile: (id: string) => api<{ profile: any; recentMatches: any[]; recentBattles: any[] }>(`/profile/${id}`),
};

// Match History API
export const historyApi = {
  get: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ matches: any[]; pagination: any }>(`/history${query}`);
  },
  getByUser: (userId: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ matches: any[]; pagination: any }>(`/history/user/${userId}${query}`);
  },
};

// Season API
export const seasonApi = {
  getCurrent: () => api<{ season: any }>('/seasons/current', { auth: false }),
  getHistory: () => api<{ seasons: any[] }>('/seasons/history', { auth: false }),
};

// Wordle API
export const wordleApi = {
  getDaily: () =>
    api<{
      date: string;
      players: { id: string; name: string; clues: { id: number; category: string; label: string; value: string; emoji: string; type: string }[] }[];
      playerNames: string[];
      totalClues: number;
    }>('/wordle/daily', { auth: false }),
  submitGuess: (guess: string, guessNumber: number, playerId?: string) =>
    api<{
      isCorrect: boolean;
      coinsEarned: number;
      guessNumber: number;
      hintRow: Record<string, { value: any; match: string; }> | null;
      playerFound: boolean;
      answer?: {
        playerId: string;
        name: string; country: string; role: string; battingHand: string;
        bowlingStyle: string; iplTeam: string; debutEra: string;
        specialty: string; overall: number; image: string; rarity: string;
      };
    }>('/wordle/guess', { method: 'POST', body: { guess, guessNumber, playerId } }),
  getFaceReveal: () =>
    api<{
      sessionId: string;
      image: string;
      playerNames: string[];
      hints: { id: number; label: string; value: string; emoji: string }[];
      totalHints: number;
    }>('/wordle/face-reveal', { auth: false }),
  submitFaceRevealGuess: (guess: string, guessNumber: number, difficulty: string, sessionId: string) =>
    api<{
      isCorrect: boolean;
      coinsEarned: number;
      answer?: { name: string; country: string; role: string; iplTeam: string; specialty: string; image: string };
    }>('/wordle/face-reveal/guess', { method: 'POST', body: { guess, guessNumber, difficulty, sessionId } }),
};

// Quiz API
export const quizApi = {
  getQuestions: (count?: number) =>
    api<{
      questions: {
        id: string;
        quote: string;
        options: string[];
        category: string;
        difficulty: string;
      }[];
      total: number;
    }>(`/quiz/questions${count ? `?count=${count}` : ''}`, { auth: false }),
  submitAnswer: (questionId: string, answer: string) =>
    api<{
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string;
      coinsEarned: number;
    }>('/quiz/answer', { method: 'POST', body: { questionId, answer } }),
};

// Ranked Battle API
export const rankedApi = {
  completeBattle: (data: { battleId: string; opponentId: string; playerScore: number; opponentScore: number; isDraw: boolean }) =>
    api<{ winner: string; eloChange: number; newElo: number; newTier: string; playerScore: number; opponentScore: number; rewards: any }>(
      '/ranked/complete',
      { method: 'POST', body: data }
    ),
};
