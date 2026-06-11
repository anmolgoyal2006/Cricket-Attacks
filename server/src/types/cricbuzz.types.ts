// Cricbuzz API Response Types

export interface CricbuzzTeam {
  teamId: number;
  teamName: string;
  teamImg: string;
}

export interface CricbuzzMatchInfo {
  matchId: number;
  seriesName: string;
  matchDesc: string;
  state: string;
  status: string;
  venue: {
    ground: string;
    city: string;
    country: string;
  };
  startDate: number;
  endDate: number;
}

export interface CricbuzzScore {
  teamId: number;
  teamName: string;
  scores: string;
  wickets: number;
  overs: number;
}

export interface CricbuzzLiveMatch {
  matchInfo: CricbuzzMatchInfo;
  score: CricbuzzScore[];
}

export interface CricbuzzUpcomingMatch {
  matchInfo: CricbuzzMatchInfo;
}

export interface CricbuzzApiResponse<T> {
  type: string;
  data: T[];
}

export interface LiveMatchesResponse {
  matches: CricbuzzLiveMatch[];
  cached: boolean;
  timestamp: number;
}

export interface UpcomingMatchesResponse {
  matches: CricbuzzUpcomingMatch[];
  cached: boolean;
  timestamp: number;
}
