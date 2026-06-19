import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { db } from "../services/firebase";
import {
  doc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import type {
  Game,
  Team,
  Question,
  TeamResponse,
  LeaderboardEntry,
  BetAmount,
} from "@shared/types";
import { COLLECTIONS } from "@shared/constants";
import { sortTeamsForLeaderboard, calculateRemainingTime } from "@shared/utils";

interface GameContextType {
  // Game state
  game: Game | null;
  currentQuestion: Question | null;
  questions: Question[];
  isLoading: boolean;
  error: string | null;

  // Team state
  team: Team | null;
  teams: Team[];
  leaderboard: LeaderboardEntry[];

  // Timer state
  remainingTime: number;
  isTimerRunning: boolean;

  // Response state
  currentResponse: TeamResponse | null;
  hasSubmitted: boolean;

  // Actions
  setGameId: (id: string) => void;
  setTeamData: (team: Team) => void;
  refreshGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  // Core state
  const [gameId, setGameIdState] = useState<string | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentResponse, setCurrentResponse] = useState<TeamResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer state
  const [remainingTime, setRemainingTime] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Subscribe to game document
  useEffect(() => {
    if (!gameId) return;

    setIsLoading(true);
    const gameRef = doc(db, COLLECTIONS.games, gameId);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const gameData: Game = {
            id: snapshot.id,
            status: data.status,
            currentQuestionIndex: data.currentQuestionIndex,
            questionStartedAt: data.questionStartedAt?.toDate() || null,
            config: data.config,
            createdAt: data.createdAt?.toDate(),
            createdBy: data.createdBy,
            updatedAt: data.updatedAt?.toDate(),
          };
          setGame(gameData);
          setError(null);
        } else {
          setError("Game not found");
        }
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching game:", err);
        setError("Failed to load game");
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [gameId]);

  // Subscribe to teams collection
  useEffect(() => {
    if (!gameId) return;

    const teamsRef = collection(
      db,
      COLLECTIONS.games,
      gameId,
      COLLECTIONS.teams,
    );
    const teamsQuery = query(teamsRef, where("status", "==", "approved"));

    const unsubscribe = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const teamsData: Team[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            gameId: gameId,
            name: data.name,
            leaderName: data.leaderName,
            members: data.members || [],
            status: data.status,
            tokenBalance: data.tokenBalance,
            cumulativeResponseTimeMs: data.cumulativeResponseTimeMs || 0,
            questionsAnswered: data.questionsAnswered || 0,
            correctAnswers: data.correctAnswers || 0,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
          };
        });
        setTeams(teamsData);

        // Update current team if it exists
        if (team) {
          const updatedTeam = teamsData.find((t) => t.id === team.id);
          if (updatedTeam) {
            setTeam(updatedTeam);
          }
        }
      },
      (err) => {
        console.error("Error fetching teams:", err);
      },
    );

    return () => unsubscribe();
  }, [gameId, team?.id]);

  // Subscribe to questions collection
  useEffect(() => {
    if (!gameId) return;

    const questionsRef = collection(
      db,
      COLLECTIONS.games,
      gameId,
      COLLECTIONS.questions,
    );
    const questionsQuery = query(questionsRef, orderBy("index", "asc"));

    const unsubscribe = onSnapshot(
      questionsQuery,
      (snapshot) => {
        const questionsData: Question[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            index: data.index,
            text: data.text,
            options: data.options,
            correctAnswer: data.correctAnswer,
            category: data.category,
            difficulty: data.difficulty,
          };
        });
        setQuestions(questionsData);
      },
      (err) => {
        console.error("Error fetching questions:", err);
      },
    );

    return () => unsubscribe();
  }, [gameId]);

  // Timer logic
  useEffect(() => {
    if (!game || game.status !== "active" || !game.questionStartedAt) {
      setIsTimerRunning(false);
      return;
    }

    setIsTimerRunning(true);

    const interval = setInterval(() => {
      const remaining = calculateRemainingTime(
        game.questionStartedAt!,
        game.config.questionTimeSeconds,
      );
      setRemainingTime(remaining);

      if (remaining <= 0) {
        setIsTimerRunning(false);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [
    game?.questionStartedAt,
    game?.status,
    game?.config?.questionTimeSeconds,
  ]);

  // Computed values
  const currentQuestion =
    game && questions.length > 0
      ? questions[game.currentQuestionIndex] || null
      : null;

  const leaderboard = sortTeamsForLeaderboard(teams);

  const hasSubmitted = !!currentResponse;

  // Actions
  const setGameId = useCallback((id: string) => {
    setGameIdState(id);
  }, []);

  const setTeamData = useCallback((teamData: Team) => {
    setTeam(teamData);
  }, []);

  const refreshGame = useCallback(() => {
    if (gameId) {
      setGameIdState(gameId);
    }
  }, [gameId]);

  const value: GameContextType = {
    game,
    currentQuestion,
    questions,
    isLoading,
    error,
    team,
    teams,
    leaderboard,
    remainingTime,
    isTimerRunning,
    currentResponse,
    hasSubmitted,
    setGameId,
    setTeamData,
    refreshGame,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
