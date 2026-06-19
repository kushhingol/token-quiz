import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import {
  doc,
  collection,
  onSnapshot,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { useSound } from "../contexts/SoundContext";
import "./GamePlay.css";

interface Question {
  index: number;
  text: string;
  options: { A: string; B: string; C: string; D: string };
  correctAnswer: "A" | "B" | "C" | "D";
  category: string;
}

interface Team {
  id: string;
  name: string;
  tokenBalance: number;
  cumulativeResponseTimeMs: number;
}

interface Game {
  id: string;
  status: "waiting" | "active" | "paused" | "completed";
  currentQuestionIndex: number;
  totalQuestions: number;
  questionStartedAt: Timestamp | null;
  config: {
    questionTimeSeconds: number;
    bettingOptions: number[];
  };
}

const BETTING_OPTIONS = [25, 50, 100, 200];

const GamePlay: React.FC = () => {
  const { gameId, teamId } = useParams<{ gameId: string; teamId: string }>();
  const navigate = useNavigate();
  const { playClick, playCorrect, playWrong, playTick, playCoin, playWhoosh } =
    useSound();

  const [game, setGame] = useState<Game | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedBet, setSelectedBet] = useState<number>(25);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    isCorrect: boolean;
    tokensWon: number;
  } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastTickTime, setLastTickTime] = useState<number>(0);
  const [resultRevealed, setResultRevealed] = useState(false);
  const [pendingTokenUpdate, setPendingTokenUpdate] = useState<{
    tokensWon: number;
    responseTimeMs: number;
  } | null>(null);
  const tokenUpdateAppliedRef = useRef(false);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = { id: snapshot.id, ...snapshot.data() } as Game;
        setGame(gameData);

        // Navigate to results if game completed
        if (gameData.status === "completed") {
          navigate(`/results/${gameId}/${teamId}`);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId, teamId, navigate]);

  // Subscribe to team updates
  useEffect(() => {
    if (!gameId || !teamId) return;

    const teamRef = doc(db, "games", gameId, "teams", teamId);
    const unsubscribe = onSnapshot(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        setTeam({ id: snapshot.id, ...snapshot.data() } as Team);
      }
    });

    return () => unsubscribe();
  }, [gameId, teamId]);

  // Fetch current question when index changes
  useEffect(() => {
    if (!gameId || !game || game.status !== "active") return;

    const questionIndex = game.currentQuestionIndex;
    console.log("Fetching question for index:", questionIndex);

    // Fetch questions from game-specific subcollection
    const questionsRef = collection(db, "games", gameId, "questions");
    const unsubscribe = onSnapshot(
      questionsRef,
      (snapshot) => {
        console.log(
          "Questions snapshot received:",
          snapshot.docs.length,
          "questions",
        );
        const questions = snapshot.docs.map((d) => d.data() as Question);
        console.log("All questions:", questions);

        // Find question by index (1-based index from QuestionManager)
        const q = questions.find((q) => q.index === questionIndex + 1);
        console.log("Found question for index", questionIndex + 1, ":", q);

        if (q) {
          setCurrentQuestion(q);
        } else {
          console.warn("No question found for index:", questionIndex + 1);
        }
      },
      (error) => {
        console.error("Error fetching questions:", error);
      },
    );

    setSelectedAnswer(null);
    setSelectedBet(25);
    setHasSubmitted(false);
    setSubmissionResult(null);
    setQuestionStartTime(Date.now());

    return () => unsubscribe();
  }, [gameId, game?.currentQuestionIndex, game?.status]);

  // Timer countdown with sound effects
  useEffect(() => {
    if (!game || game.status !== "active" || !game.questionStartedAt) return;

    const questionTimeSeconds = game.config?.questionTimeSeconds || 60;
    const startTime = game.questionStartedAt.toMillis();

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, questionTimeSeconds - elapsed);
      setTimeRemaining(remaining);

      // Play tick sound in last 10 seconds
      if (remaining <= 10 && remaining > 0 && remaining !== lastTickTime) {
        playTick();
        setLastTickTime(remaining);
      }

      // Auto-submit when time runs out
      if (remaining === 0 && !hasSubmitted) {
        handleSubmit(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [game, hasSubmitted, lastTickTime, playTick]);

  // Play sound and update tokens when result is revealed (at 3 seconds)
  useEffect(() => {
    if (
      hasSubmitted &&
      submissionResult &&
      timeRemaining <= 3 &&
      !resultRevealed
    ) {
      setResultRevealed(true);
      if (submissionResult.isCorrect) {
        playCorrect();
        playCoin();
      } else {
        playWrong();
      }

      // Update team balance in Firestore when result is revealed
      if (
        pendingTokenUpdate &&
        !tokenUpdateAppliedRef.current &&
        gameId &&
        teamId &&
        team
      ) {
        tokenUpdateAppliedRef.current = true;
        const teamRef = doc(db, "games", gameId, "teams", teamId);
        updateDoc(teamRef, {
          tokenBalance: team.tokenBalance + pendingTokenUpdate.tokensWon,
          cumulativeResponseTimeMs:
            (team.cumulativeResponseTimeMs || 0) +
            pendingTokenUpdate.responseTimeMs,
        }).catch((error) => {
          console.error("Error updating team balance:", error);
        });
      }
    }
  }, [
    hasSubmitted,
    submissionResult,
    timeRemaining,
    resultRevealed,
    playCorrect,
    playWrong,
    playCoin,
    pendingTokenUpdate,
    gameId,
    teamId,
    team,
  ]);

  // Reset result revealed and pending token update when question changes
  useEffect(() => {
    setResultRevealed(false);
    setLastTickTime(0);
    setPendingTokenUpdate(null);
    tokenUpdateAppliedRef.current = false;
    playWhoosh();
  }, [game?.currentQuestionIndex]);

  // Handle answer submission
  const handleSubmit = useCallback(
    async (isTimeout = false) => {
      if (!gameId || !teamId || !team || !currentQuestion || hasSubmitted)
        return;

      setHasSubmitted(true);

      const responseTimeMs = Date.now() - questionStartTime;
      const answer = isTimeout ? null : selectedAnswer;
      const bet = selectedBet;

      const isCorrect = answer === currentQuestion.correctAnswer;
      const tokensWon = isCorrect ? bet * 2 : -bet;

      // Save response to Firestore
      const responseId = `${teamId}_${currentQuestion.index}`;
      const responseRef = doc(db, "games", gameId, "responses", responseId);

      try {
        await setDoc(responseRef, {
          teamId,
          questionIndex: currentQuestion.index,
          selectedAnswer: answer,
          betAmount: bet,
          responseTimeMs,
          submittedAt: serverTimestamp(),
          isCorrect,
          tokensWon,
        });

        // Store pending token update - will be applied when result is revealed
        setPendingTokenUpdate({ tokensWon, responseTimeMs });
        tokenUpdateAppliedRef.current = false;

        setSubmissionResult({ isCorrect, tokensWon });
      } catch (error) {
        console.error("Error submitting answer:", error);
      }
    },
    [
      gameId,
      teamId,
      team,
      currentQuestion,
      hasSubmitted,
      selectedAnswer,
      selectedBet,
      questionStartTime,
    ],
  );

  if (loading) {
    return (
      <div className="gameplay-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game || !team) {
    return (
      <div className="gameplay-page">
        <div className="error-state">
          <h2>Game not found</h2>
          <button className="btn btn-primary" onClick={() => navigate("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (game.status === "paused") {
    return (
      <div className="gameplay-page">
        <div className="paused-state">
          <span className="pause-icon">⏸️</span>
          <h2>Game Paused</h2>
          <p>Please wait for the admin to resume the game.</p>
          <div className="token-display-small">
            🪙 {team.tokenBalance.toLocaleString()} tokens
          </div>
        </div>
      </div>
    );
  }

  // Pre-game screen when game hasn't started yet
  if (game.status === "waiting") {
    return (
      <div className="gameplay-page">
        <div className="pregame-state">
          <div className="pregame-header">
            <span className="pregame-icon">🎮</span>
            <h1>GET READY, PLAYER!</h1>
          </div>

          <div className="pregame-team">
            <div className="team-badge">
              <span className="team-emoji">🏆</span>
              <span className="team-name-display">{team.name}</span>
            </div>
          </div>

          <div className="pregame-tokens">
            <div className="token-showcase">
              <span className="token-icon-large">🪙</span>
              <span className="token-value">
                {team.tokenBalance.toLocaleString()}
              </span>
              <span className="token-label">TOKENS READY</span>
            </div>
          </div>

          <div className="pregame-messages">
            <div className="message-item">
              <span>🕹️</span> Your controllers are charged...
            </div>
            <div className="message-item">
              <span>🧠</span> Your brain cells are warmed up...
            </div>
            <div className="message-item">
              <span>⚡</span> Power level: MAXIMUM!
            </div>
            <div className="message-item">
              <span>💰</span> Tokens ready to multiply!
            </div>
          </div>

          <div className="pregame-waiting">
            <div className="pulse-container">
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
              <span className="waiting-text">
                ⏳ WAITING FOR GAME MASTER...
              </span>
            </div>
          </div>

          <div className="pregame-tips">
            <h3>🎯 QUICK TIPS</h3>
            <ul>
              <li>Bet big on questions you're confident about!</li>
              <li>Correct answer = DOUBLE your bet!</li>
              <li>Wrong answer = Lose your bet</li>
              <li>Speed matters for tiebreakers!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gameplay-page">
      {/* Token Balance Header */}
      <div className="token-header">
        <div className="team-name">{team.name}</div>
        <div className="token-balance">
          <span className="token-icon">🪙</span>
          <span className="token-amount">
            {team.tokenBalance.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar">
        <div className="progress-info">
          Question {game.currentQuestionIndex + 1} of {game.totalQuestions}
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${((game.currentQuestionIndex + 1) / game.totalQuestions) * 100}%`,
            }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="question-card">
          <div className="question-category">{currentQuestion.category}</div>
          <div className="question-text">{currentQuestion.text}</div>

          <div className="options-grid">
            {(["A", "B", "C", "D"] as const).map((option) => (
              <button
                key={option}
                className={`option-btn ${selectedAnswer === option ? "selected" : ""} ${
                  hasSubmitted && timeRemaining <= 3
                    ? option === currentQuestion.correctAnswer
                      ? "correct"
                      : selectedAnswer === option
                        ? "incorrect"
                        : ""
                    : ""
                }`}
                onClick={() => {
                  if (!hasSubmitted) {
                    playClick();
                    setSelectedAnswer(option);
                  }
                }}
                disabled={hasSubmitted}
              >
                <span className="option-letter">{option}</span>
                <span className="option-text">
                  {currentQuestion.options[option]}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Betting Section */}
      {!hasSubmitted && (
        <div className="betting-section">
          <h3>Place Your Bet</h3>
          <div className="bet-options">
            {BETTING_OPTIONS.map((bet) => (
              <button
                key={bet}
                className={`bet-btn ${selectedBet === bet ? "selected" : ""} ${bet > team.tokenBalance ? "disabled" : ""}`}
                onClick={() => {
                  if (bet <= team.tokenBalance) {
                    playClick();
                    setSelectedBet(bet);
                  }
                }}
                disabled={bet > team.tokenBalance}
              >
                🪙 {bet}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary submit-btn"
            onClick={() => handleSubmit(false)}
            disabled={!selectedAnswer}
          >
            SUBMIT ANSWER
          </button>
        </div>
      )}

      {/* Result Display - Show verification message until 3 seconds left */}
      {hasSubmitted && submissionResult && (
        <div
          className={`result-display ${timeRemaining <= 3 ? (submissionResult.isCorrect ? "correct" : "incorrect") : "verifying"}`}
        >
          {timeRemaining <= 3 ? (
            <>
              <div className="result-icon">
                {submissionResult.isCorrect ? "✅" : "❌"}
              </div>
              <div className="result-text">
                {submissionResult.isCorrect ? "CORRECT!" : "WRONG!"}
              </div>
              <div className="result-tokens">
                {submissionResult.tokensWon > 0 ? "+" : ""}
                {submissionResult.tokensWon} tokens
              </div>
              <div className="waiting-next">Waiting for next question...</div>
            </>
          ) : (
            <>
              <div className="result-icon verifying-icon">⏳</div>
              <div className="result-text">Answer Submitted!</div>
              <div className="verifying-message">Wait for verification...</div>
              <div className="verifying-countdown">
                Result in {timeRemaining - 3}s
              </div>
            </>
          )}
        </div>
      )}

      {/* Timer Clock - Bottom Right */}
      <div className={`timer-clock ${timeRemaining <= 10 ? "warning" : ""}`}>
        <svg className="timer-ring" viewBox="0 0 90 90">
          <circle
            className="timer-ring-circle"
            cx="45"
            cy="45"
            r="42"
            strokeDasharray={264}
            strokeDashoffset={
              264 -
              (timeRemaining / (game.config?.questionTimeSeconds || 60)) * 264
            }
          />
        </svg>
        <span className="timer-clock-value">{timeRemaining}</span>
        <span className="timer-clock-label">sec</span>
      </div>
    </div>
  );
};

export default GamePlay;
