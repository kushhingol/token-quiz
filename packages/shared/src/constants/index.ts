import type { BetAmount, Theme } from "../types";

// ============================================
// GAME DEFAULTS
// ============================================

export const DEFAULT_GAME_CONFIG = {
  totalQuestions: 30,
  questionTimeSeconds: 60,
  initialTokenBalance: 3000,
  bettingOptions: [25, 50, 100, 200] as BetAmount[],
  payoutMultiplier: 2,
  tiebreaker: "cumulativeResponseTime" as const,
};

export const BETTING_OPTIONS: BetAmount[] = [25, 50, 100, 200];

export const MAX_BET = 200;
export const MIN_BET = 25;

// ============================================
// TOKEN CALCULATION CONSTANTS
// ============================================

export const TOKEN_SURVIVAL_BUFFER = 0.5; // 50% of worst case
export const TOKEN_ROUND_TO = 500; // Round to nearest 500
export const TOKEN_WARNING_LOW_MULTIPLIER = 0.5; // Warn if below 50% of recommended
export const TOKEN_WARNING_HIGH_MULTIPLIER = 3; // Warn if above 300% of recommended

// ============================================
// TIMER CONSTANTS
// ============================================

export const QUESTION_TIME_SECONDS = 60;
export const TIMER_UPDATE_INTERVAL_MS = 100;
export const COUNTDOWN_WARNING_SECONDS = 10;

// ============================================
// THEME DEFINITIONS
// ============================================

export const DARK_THEME: Theme = {
  name: "Arcade Night",
  mode: "dark",
  colors: {
    background: "#1a1a2e",
    surface: "#16213e",
    text: "#ffffff",
    textSecondary: "#a0a0a0",
    primary: "#00ff88",
    secondary: "#ff6b6b",
    accent: "#ffd93d",
    neon: "#00d4ff",
    border: "#00ff88",
    success: "#00ff88",
    error: "#ff4757",
    warning: "#ffa502",
  },
};

export const LIGHT_THEME: Theme = {
  name: "Retro Day",
  mode: "light",
  colors: {
    background: "#f0e6d3",
    surface: "#fff8e7",
    text: "#2d2d2d",
    textSecondary: "#666666",
    primary: "#2ecc71",
    secondary: "#e74c3c",
    accent: "#f39c12",
    neon: "#3498db",
    border: "#8b4513",
    success: "#27ae60",
    error: "#c0392b",
    warning: "#d35400",
  },
};

export const THEMES = {
  dark: DARK_THEME,
  light: LIGHT_THEME,
};

// ============================================
// QUESTION CATEGORIES
// ============================================

export const QUESTION_CATEGORIES = {
  FRONTEND_ROLLBACK: "Frontend Rollback Procedures",
  SEVERITY_LEVELS: "Severity Levels & Incident Classification",
  FEATURE_TIERS: "Feature Tiers, Postmortems & SLAs",
};

// ============================================
// GAME STATUS LABELS
// ============================================

export const GAME_STATUS_LABELS = {
  setup: "Setting Up",
  waiting: "Waiting for Players",
  active: "Game in Progress",
  paused: "Game Paused",
  completed: "Game Completed",
};

export const TEAM_STATUS_LABELS = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
};

// ============================================
// ANIMATION DURATIONS (ms)
// ============================================

export const ANIMATIONS = {
  tokenChange: 500,
  questionTransition: 300,
  resultReveal: 800,
  bounceText: 400,
  screenShake: 200,
};

// ============================================
// SOUND EFFECTS (paths)
// ============================================

export const SOUNDS = {
  correct: "/assets/sounds/correct.mp3",
  wrong: "/assets/sounds/wrong.mp3",
  tick: "/assets/sounds/tick.mp3",
  gameStart: "/assets/sounds/game-start.mp3",
  gameEnd: "/assets/sounds/game-end.mp3",
  tokenGain: "/assets/sounds/coin.mp3",
  tokenLoss: "/assets/sounds/loss.mp3",
  countdown: "/assets/sounds/countdown.mp3",
};

// ============================================
// LOCAL STORAGE KEYS
// ============================================

export const STORAGE_KEYS = {
  theme: "quiz-theme",
  teamId: "quiz-team-id",
  gameId: "quiz-game-id",
  soundEnabled: "quiz-sound-enabled",
};

// ============================================
// FIREBASE COLLECTION NAMES
// ============================================

export const COLLECTIONS = {
  games: "games",
  teams: "teams",
  questions: "questions",
  responses: "responses",
};
