// ============================================
// CORE GAME TYPES
// ============================================

export type GameStatus =
  | "setup"
  | "waiting"
  | "active"
  | "paused"
  | "completed";
export type TeamStatus = "pending" | "approved" | "rejected";
export type AnswerOption = "A" | "B" | "C" | "D";
export type BetAmount = 25 | 50 | 100 | 200;
export type ThemeMode = "dark" | "light";

// ============================================
// GAME CONFIGURATION
// ============================================

export interface GameConfig {
  totalQuestions: number;
  questionTimeSeconds: number;
  initialTokenBalance: number;
  recommendedTokenBalance: number;
  bettingOptions: BetAmount[];
  payoutMultiplier: number;
  tiebreaker: "cumulativeResponseTime" | "firstToFinish";
}

export interface TokenRecommendation {
  recommended: number;
  worstCaseLoss: number;
  survivalQuestions: number;
  explanation: string;
  warnings: {
    tooLow: number;
    tooHigh: number;
  };
}

// ============================================
// GAME ENTITY
// ============================================

export interface Game {
  id: string;
  status: GameStatus;
  currentQuestionIndex: number;
  questionStartedAt: Date | null;
  config: GameConfig;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
}

// ============================================
// TEAM ENTITY
// ============================================

export interface Team {
  id: string;
  gameId: string;
  name: string;
  leaderName: string;
  members: string[];
  status: TeamStatus;
  tokenBalance: number;
  cumulativeResponseTimeMs: number;
  questionsAnswered: number;
  correctAnswers: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamRegistration {
  name: string;
  leaderName: string;
  members: string[];
}

// ============================================
// QUESTION ENTITY
// ============================================

export interface QuestionOptions {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  index: number;
  text: string;
  options: QuestionOptions;
  correctAnswer: AnswerOption;
  category: string;
  difficulty?: "easy" | "medium" | "hard";
}

// ============================================
// RESPONSE ENTITY
// ============================================

export interface TeamResponse {
  id: string;
  gameId: string;
  teamId: string;
  questionIndex: number;
  selectedAnswer: AnswerOption | null;
  betAmount: BetAmount;
  responseTimeMs: number;
  submittedAt: Date;
  isCorrect: boolean;
  tokensWon: number;
  tokenBalanceAfter: number;
}

// ============================================
// LEADERBOARD
// ============================================

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  tokenBalance: number;
  cumulativeResponseTimeMs: number;
  correctAnswers: number;
  questionsAnswered: number;
}

// ============================================
// UI THEME
// ============================================

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  accent: string;
  neon: string;
  border: string;
  success: string;
  error: string;
  warning: string;
}

export interface Theme {
  name: string;
  mode: ThemeMode;
  colors: ThemeColors;
}

// ============================================
// REAL-TIME EVENTS
// ============================================

export interface GameStateUpdate {
  type:
    | "QUESTION_START"
    | "QUESTION_END"
    | "GAME_START"
    | "GAME_END"
    | "GAME_PAUSE";
  gameId: string;
  currentQuestionIndex: number;
  timestamp: Date;
}

export interface TokenUpdate {
  teamId: string;
  previousBalance: number;
  newBalance: number;
  change: number;
  reason: "bet_won" | "bet_lost" | "timeout" | "initial";
}
