import type {
  TokenRecommendation,
  BetAmount,
  LeaderboardEntry,
  Team,
} from "../types";
import {
  MAX_BET,
  TOKEN_SURVIVAL_BUFFER,
  TOKEN_ROUND_TO,
  TOKEN_WARNING_LOW_MULTIPLIER,
  TOKEN_WARNING_HIGH_MULTIPLIER,
} from "../constants";

// ============================================
// TOKEN CALCULATION UTILITIES
// ============================================

/**
 * Calculate recommended initial tokens based on question count
 * Ensures teams can survive a reasonable losing streak while keeping stakes meaningful
 */
export function calculateRecommendedTokens(
  questionCount: number,
): TokenRecommendation {
  const worstCaseLoss = questionCount * MAX_BET;
  const rawRecommendation = worstCaseLoss * TOKEN_SURVIVAL_BUFFER;
  const recommended =
    Math.ceil(rawRecommendation / TOKEN_ROUND_TO) * TOKEN_ROUND_TO;
  const survivalQuestions = Math.floor(recommended / MAX_BET);

  return {
    recommended,
    worstCaseLoss,
    survivalQuestions,
    explanation: `With ${questionCount} questions and a maximum bet of ${MAX_BET} tokens per question, teams could theoretically lose up to ${worstCaseLoss.toLocaleString()} tokens if they bet maximum on every question and get them all wrong. The recommended ${recommended.toLocaleString()} tokens (50% buffer) allows teams to survive through ${survivalQuestions} maximum-bet losses, keeping the game competitive while preventing early elimination.`,
    warnings: {
      tooLow: Math.floor(recommended * TOKEN_WARNING_LOW_MULTIPLIER),
      tooHigh: Math.floor(recommended * TOKEN_WARNING_HIGH_MULTIPLIER),
    },
  };
}

/**
 * Get warning message for custom token amount
 */
export function getTokenWarningMessage(
  customTokens: number,
  recommendation: TokenRecommendation,
): { type: "low" | "high" | "ok"; message: string } | null {
  if (customTokens < recommendation.warnings.tooLow) {
    return {
      type: "low",
      message: `⚠️ Warning: ${customTokens.toLocaleString()} tokens is quite low. Teams may run out of tokens before the game ends, especially with a few unlucky bets. Consider at least ${recommendation.warnings.tooLow.toLocaleString()} tokens.`,
    };
  }

  if (customTokens > recommendation.warnings.tooHigh) {
    return {
      type: "high",
      message: `ℹ️ Note: ${customTokens.toLocaleString()} tokens is very high. This reduces betting stakes and teams may play too conservatively. The recommended amount is ${recommendation.recommended.toLocaleString()} tokens.`,
    };
  }

  return {
    type: "ok",
    message: `✅ Good balance! ${customTokens.toLocaleString()} tokens provides meaningful stakes while ensuring team survival.`,
  };
}

// ============================================
// BETTING UTILITIES
// ============================================

/**
 * Calculate tokens won/lost for a bet
 */
export function calculateBetResult(
  betAmount: BetAmount,
  isCorrect: boolean,
  payoutMultiplier: number = 2,
): number {
  if (isCorrect) {
    return betAmount * payoutMultiplier; // Returns total (original bet + winnings)
  }
  return 0; // Loses the bet
}

/**
 * Calculate net token change from a bet
 */
export function calculateNetTokenChange(
  betAmount: BetAmount,
  isCorrect: boolean,
  payoutMultiplier: number = 2,
): number {
  if (isCorrect) {
    return betAmount * (payoutMultiplier - 1); // Net profit
  }
  return -betAmount; // Net loss
}

/**
 * Check if team can afford a bet
 */
export function canAffordBet(
  currentBalance: number,
  betAmount: BetAmount,
): boolean {
  return currentBalance >= betAmount;
}

/**
 * Get available betting options based on current balance
 */
export function getAvailableBets(
  currentBalance: number,
  allOptions: BetAmount[],
): BetAmount[] {
  return allOptions.filter((bet) => currentBalance >= bet);
}

// ============================================
// LEADERBOARD UTILITIES
// ============================================

/**
 * Sort teams for leaderboard ranking
 * Primary: Token balance (descending)
 * Tiebreaker: Cumulative response time (ascending - faster is better)
 */
export function sortTeamsForLeaderboard(teams: Team[]): LeaderboardEntry[] {
  const sorted = [...teams].sort((a, b) => {
    // Primary sort: token balance (higher is better)
    if (b.tokenBalance !== a.tokenBalance) {
      return b.tokenBalance - a.tokenBalance;
    }
    // Tiebreaker: cumulative response time (lower is better)
    return a.cumulativeResponseTimeMs - b.cumulativeResponseTimeMs;
  });

  return sorted.map((team, index) => ({
    rank: index + 1,
    teamId: team.id,
    teamName: team.name,
    tokenBalance: team.tokenBalance,
    cumulativeResponseTimeMs: team.cumulativeResponseTimeMs,
    correctAnswers: team.correctAnswers,
    questionsAnswered: team.questionsAnswered,
  }));
}

// ============================================
// TIME UTILITIES
// ============================================

/**
 * Format milliseconds to readable time string
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
}

/**
 * Format seconds to MM:SS display
 */
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate remaining time from start timestamp
 */
export function calculateRemainingTime(
  startTimestamp: Date,
  durationSeconds: number,
): number {
  const now = new Date();
  const elapsed = (now.getTime() - startTimestamp.getTime()) / 1000;
  return Math.max(0, durationSeconds - elapsed);
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate team registration data
 */
export function validateTeamRegistration(data: {
  name: string;
  leaderName: string;
  members: string[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Team name must be at least 2 characters");
  }

  if (!data.leaderName || data.leaderName.trim().length < 2) {
    errors.push("Leader name must be at least 2 characters");
  }

  if (data.name && data.name.length > 30) {
    errors.push("Team name must be 30 characters or less");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// FORMAT UTILITIES
// ============================================

/**
 * Format token balance with commas
 */
export function formatTokens(amount: number): string {
  return amount.toLocaleString();
}

/**
 * Format token change with sign
 */
export function formatTokenChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toLocaleString()}`;
}

/**
 * Get ordinal suffix for rank (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
