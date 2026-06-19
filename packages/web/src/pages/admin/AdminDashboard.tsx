import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { db } from "../../services/firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import "./AdminDashboard.css";

interface Team {
  id: string;
  name: string;
  leaderName: string;
  members: string[];
  status: "pending" | "approved" | "rejected";
  tokenBalance: number;
  cumulativeResponseTimeMs: number;
  rejoinCode?: string;
  createdAt: any;
}

interface Game {
  id: string;
  name: string;
  status: "waiting" | "active" | "paused" | "completed";
  currentQuestionIndex: number;
  totalQuestions: number;
  questionStartedAt: any;
  createdAt: any;
  autoAdvance?: boolean;
  autoAdvanceSeconds?: number;
  config: {
    initialTokenBalance: number;
    questionTimeSeconds: number;
    bettingOptions: number[];
  };
}

const TIMER_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "45 seconds", value: 45 },
  { label: "60 seconds", value: 60 },
  { label: "90 seconds", value: 90 },
  { label: "120 seconds", value: 120 },
];

const AdminDashboard: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGame, setShowCreateGame] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [questionCount, setQuestionCount] = useState(0);

  // Auto-advance state
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState(60);
  const [customTimer, setCustomTimer] = useState("");
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<
    number | null
  >(null);
  const autoAdvanceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all games
  useEffect(() => {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Game[];
      setGames(gamesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch selected game and its teams
  useEffect(() => {
    if (!gameId) {
      setSelectedGame(null);
      setTeams([]);
      return;
    }

    // Subscribe to game updates
    const gameRef = doc(db, "games", gameId);
    const unsubGame = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setSelectedGame({ id: snapshot.id, ...snapshot.data() } as Game);
      }
    });

    // Subscribe to teams updates
    const teamsRef = collection(db, "games", gameId, "teams");
    const teamsQuery = query(teamsRef, orderBy("tokenBalance", "desc"));
    const unsubTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Team[];
      setTeams(teamsData);
    });

    return () => {
      unsubGame();
      unsubTeams();
    };
  }, [gameId]);

  // Fetch question count
  useEffect(() => {
    const fetchQuestionCount = async () => {
      const questionsRef = collection(db, "questions");
      const snapshot = await getDocs(questionsRef);
      setQuestionCount(snapshot.size);
    };
    fetchQuestionCount();
  }, []);

  // Auto-advance next question handler
  const advanceToNextQuestion = useCallback(async () => {
    if (!gameId || !selectedGame) return;

    const nextIndex = selectedGame.currentQuestionIndex + 1;

    try {
      const gameRef = doc(db, "games", gameId);

      if (nextIndex >= selectedGame.totalQuestions) {
        // Game completed - stop auto-advance
        await updateDoc(gameRef, {
          status: "completed",
          autoAdvance: false,
        });
      } else {
        await updateDoc(gameRef, {
          currentQuestionIndex: nextIndex,
          questionStartedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error advancing question:", error);
    }
  }, [gameId, selectedGame]);

  // Auto-advance timer effect
  useEffect(() => {
    // Clear any existing interval
    if (autoAdvanceIntervalRef.current) {
      clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }

    // Only run if game is active and auto-advance is enabled
    if (
      !selectedGame ||
      selectedGame.status !== "active" ||
      !selectedGame.autoAdvance
    ) {
      setAutoAdvanceCountdown(null);
      return;
    }

    const timerSeconds = selectedGame.autoAdvanceSeconds || 60;
    const questionStartedAt =
      selectedGame.questionStartedAt?.toMillis?.() || Date.now();

    // Calculate initial countdown
    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - questionStartedAt) / 1000);
      return Math.max(0, timerSeconds - elapsed);
    };

    setAutoAdvanceCountdown(calculateRemaining());

    // Start countdown interval
    autoAdvanceIntervalRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      setAutoAdvanceCountdown(remaining);

      if (remaining <= 0) {
        // Time's up - advance to next question
        advanceToNextQuestion();
      }
    }, 1000);

    return () => {
      if (autoAdvanceIntervalRef.current) {
        clearInterval(autoAdvanceIntervalRef.current);
      }
    };
  }, [
    selectedGame?.status,
    selectedGame?.autoAdvance,
    selectedGame?.currentQuestionIndex,
    selectedGame?.questionStartedAt,
    advanceToNextQuestion,
  ]);

  // Create new game
  const handleCreateGame = async () => {
    if (!newGameName.trim()) return;

    try {
      const gamesRef = collection(db, "games");
      const newGame = await addDoc(gamesRef, {
        name: newGameName,
        status: "waiting",
        currentQuestionIndex: 0,
        totalQuestions: questionCount,
        questionStartedAt: null,
        createdAt: serverTimestamp(),
        autoAdvance: false,
        autoAdvanceSeconds: 60,
        config: {
          initialTokenBalance: 3000,
          questionTimeSeconds: 60,
          bettingOptions: [25, 50, 100, 200],
        },
      });

      // Copy questions to game subcollection
      const questionsRef = collection(db, "questions");
      const questionsSnapshot = await getDocs(
        query(questionsRef, orderBy("index", "asc")),
      );

      const batch = writeBatch(db);
      questionsSnapshot.docs.forEach((questionDoc) => {
        const gameQuestionRef = doc(
          db,
          "games",
          newGame.id,
          "questions",
          questionDoc.id,
        );
        batch.set(gameQuestionRef, questionDoc.data());
      });
      await batch.commit();

      setNewGameName("");
      setShowCreateGame(false);
      navigate(`/admin/game/${newGame.id}`);
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  // Approve team
  const handleApproveTeam = async (teamId: string) => {
    if (!gameId || !selectedGame) {
      console.error("Missing gameId or selectedGame");
      return;
    }

    console.log("Approving team:", {
      gameId,
      teamId,
      initialTokenBalance: selectedGame.config.initialTokenBalance,
    });

    try {
      const teamRef = doc(db, "games", gameId, "teams", teamId);
      await updateDoc(teamRef, {
        status: "approved",
        tokenBalance: selectedGame.config.initialTokenBalance,
      });
      console.log("Team approved successfully!");
      alert("✅ Team approved successfully!");
    } catch (error: any) {
      console.error("Error approving team:", error);
      alert(
        `❌ Failed to approve team: ${error.message || "Unknown error"}\n\nCheck if Firestore rules are deployed.`,
      );
    }
  };

  // Reject team
  const handleRejectTeam = async (teamId: string) => {
    if (!gameId) return;

    try {
      const teamRef = doc(db, "games", gameId, "teams", teamId);
      await updateDoc(teamRef, { status: "rejected" });
    } catch (error) {
      console.error("Error rejecting team:", error);
    }
  };

  // Delete team
  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!gameId) return;

    const confirmed = window.confirm(
      `🗑️ DELETE TEAM?\n\nAre you sure you want to delete "${teamName}"?\n\nThis will permanently remove the team and all their responses.\n\nThis action cannot be undone!`,
    );

    if (!confirmed) return;

    try {
      // Delete team document
      const teamRef = doc(db, "games", gameId, "teams", teamId);
      await deleteDoc(teamRef);

      // Delete team's responses
      const responsesRef = collection(db, "games", gameId, "responses");
      const responsesSnapshot = await getDocs(responsesRef);

      const batch = writeBatch(db);
      responsesSnapshot.docs.forEach((responseDoc) => {
        if (responseDoc.data().teamId === teamId) {
          batch.delete(responseDoc.ref);
        }
      });
      await batch.commit();

      alert(`✅ Team "${teamName}" has been deleted.`);
    } catch (error: any) {
      console.error("Error deleting team:", error);
      alert(`❌ Failed to delete team: ${error.message || "Unknown error"}`);
    }
  };

  // Start game
  const handleStartGame = async () => {
    if (!gameId) return;

    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        status: "active",
        currentQuestionIndex: 0,
        questionStartedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // Pause game
  const handlePauseGame = async () => {
    if (!gameId) return;

    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        status: "paused",
        autoAdvance: false, // Stop auto-advance when paused
      });
    } catch (error) {
      console.error("Error pausing game:", error);
    }
  };

  // Resume game
  const handleResumeGame = async () => {
    if (!gameId) return;

    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        status: "active",
        questionStartedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error resuming game:", error);
    }
  };

  // Next question (manual)
  const handleNextQuestion = async () => {
    if (!gameId || !selectedGame) return;

    const nextIndex = selectedGame.currentQuestionIndex + 1;

    try {
      const gameRef = doc(db, "games", gameId);

      if (nextIndex >= selectedGame.totalQuestions) {
        // Game completed
        await updateDoc(gameRef, {
          status: "completed",
          autoAdvance: false,
        });
      } else {
        await updateDoc(gameRef, {
          currentQuestionIndex: nextIndex,
          questionStartedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error advancing question:", error);
    }
  };

  // Enable auto-advance
  const handleEnableAutoAdvance = async () => {
    if (!gameId) return;

    const timerValue = customTimer ? parseInt(customTimer) : selectedTimer;
    if (isNaN(timerValue) || timerValue < 10) {
      alert("Please enter a valid timer (minimum 10 seconds)");
      return;
    }

    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        autoAdvance: true,
        autoAdvanceSeconds: timerValue,
        questionStartedAt: serverTimestamp(), // Reset timer
        "config.questionTimeSeconds": timerValue, // Update config for players
      });
      setShowTimerModal(false);
      setCustomTimer("");
    } catch (error) {
      console.error("Error enabling auto-advance:", error);
    }
  };

  // Disable auto-advance
  const handleDisableAutoAdvance = async () => {
    if (!gameId) return;

    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        autoAdvance: false,
      });
    } catch (error) {
      console.error("Error disabling auto-advance:", error);
    }
  };

  // End game
  const handleEndGame = async () => {
    if (!gameId) return;

    if (window.confirm("Are you sure you want to end this game?")) {
      try {
        const gameRef = doc(db, "games", gameId);
        await updateDoc(gameRef, {
          status: "completed",
          autoAdvance: false,
        });
      } catch (error) {
        console.error("Error ending game:", error);
      }
    }
  };

  // Reset game - resets all scores and progress
  const handleResetGame = async () => {
    if (!gameId || !selectedGame) return;

    const confirmed = window.confirm(
      "⚠️ RESET GAME?\n\nThis will:\n• Reset game to waiting status\n• Reset all team token balances to initial value\n• Delete all team responses\n• Reset question progress to 0\n\nThis action cannot be undone!",
    );

    if (!confirmed) return;

    try {
      // 1. Reset game document
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        status: "waiting",
        currentQuestionIndex: 0,
        questionStartedAt: null,
        autoAdvance: false,
      });

      // 2. Reset all approved teams
      const batch = writeBatch(db);
      for (const team of teams) {
        if (team.status === "approved") {
          const teamRef = doc(db, "games", gameId, "teams", team.id);
          batch.update(teamRef, {
            tokenBalance: selectedGame.config.initialTokenBalance,
            cumulativeResponseTimeMs: 0,
          });
        }
      }
      await batch.commit();

      // 3. Delete all responses
      const responsesRef = collection(db, "games", gameId, "responses");
      const responsesSnapshot = await getDocs(responsesRef);

      // Delete in batches (Firestore limit is 500 per batch)
      const deleteBatch = writeBatch(db);
      let deleteCount = 0;

      for (const responseDoc of responsesSnapshot.docs) {
        deleteBatch.delete(responseDoc.ref);
        deleteCount++;

        // Commit every 450 to stay under limit
        if (deleteCount >= 450) {
          await deleteBatch.commit();
          deleteCount = 0;
        }
      }

      // Commit remaining deletes
      if (deleteCount > 0) {
        await deleteBatch.commit();
      }

      alert("✅ Game has been reset successfully!");
    } catch (error) {
      console.error("Error resetting game:", error);
      alert("❌ Failed to reset game. Please try again.");
    }
  };

  const pendingTeams = teams.filter((t) => t.status === "pending");
  const approvedTeams = teams.filter((t) => t.status === "approved");

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>🎮 Admin Dashboard</h1>
          <div className="admin-nav">
            <Link to="/admin/questions" className="nav-link">
              📝 Questions
            </Link>
            <Link to="/admin/users" className="nav-link">
              👥 Admins
            </Link>
          </div>
        </div>

        {!gameId ? (
          // Game List View
          <div className="games-section">
            <div className="section-header">
              <h2>Games</h2>
              <button
                className="btn btn-primary"
                onClick={() => setShowCreateGame(true)}
              >
                ➕ Create New Game
              </button>
            </div>

            {showCreateGame && (
              <div className="create-game-form">
                <input
                  type="text"
                  placeholder="Game Name (e.g., Quiz Night 2024)"
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                />
                <div className="form-info">
                  📊 {questionCount} questions available
                </div>
                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateGame}
                  >
                    Create Game
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setShowCreateGame(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {games.length === 0 ? (
              <div className="empty-state">
                <p>No games yet. Create your first game to get started!</p>
              </div>
            ) : (
              <div className="games-grid">
                {games.map((game) => (
                  <div
                    key={game.id}
                    className={`game-card ${game.status}`}
                    onClick={() => navigate(`/admin/game/${game.id}`)}
                  >
                    <div className="game-name">{game.name}</div>
                    <div className={`game-status status-${game.status}`}>
                      {game.status.toUpperCase()}
                    </div>
                    <div className="game-info">
                      <span>
                        Q: {game.currentQuestionIndex + 1}/{game.totalQuestions}
                      </span>
                      {game.autoAdvance && (
                        <span className="auto-badge">🤖 AUTO</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Game Detail View
          <div className="game-detail">
            <button
              className="btn btn-outline back-btn"
              onClick={() => navigate("/admin")}
            >
              ← Back to Games
            </button>

            {selectedGame && (
              <>
                <div className="game-header">
                  <h2>{selectedGame.name}</h2>
                  <div
                    className={`game-status-badge status-${selectedGame.status}`}
                  >
                    {selectedGame.status.toUpperCase()}
                  </div>
                  {selectedGame.autoAdvance && (
                    <div className="auto-advance-badge">
                      🤖 AUTO ({selectedGame.autoAdvanceSeconds}s)
                    </div>
                  )}
                </div>

                {/* Auto-advance countdown display */}
                {selectedGame.status === "active" &&
                  selectedGame.autoAdvance &&
                  autoAdvanceCountdown !== null && (
                    <div className="auto-advance-timer">
                      <div className="timer-label">⏱️ Next question in:</div>
                      <div className="timer-countdown">
                        {autoAdvanceCountdown}s
                      </div>
                      <div className="timer-progress">
                        <div
                          className="timer-progress-bar"
                          style={{
                            width: `${(autoAdvanceCountdown / (selectedGame.autoAdvanceSeconds || 60)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                <div className="game-controls">
                  {selectedGame.status === "waiting" && (
                    <button
                      className="btn btn-primary"
                      onClick={handleStartGame}
                      disabled={approvedTeams.length === 0}
                    >
                      🚀 Start Game
                    </button>
                  )}
                  {selectedGame.status === "active" && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={handlePauseGame}
                      >
                        ⏸️ Pause
                      </button>

                      {/* Manual next button - disabled when auto-advance is on */}
                      {!selectedGame.autoAdvance && (
                        <button
                          className="btn btn-primary"
                          onClick={handleNextQuestion}
                        >
                          ⏭️ Next Question (
                          {selectedGame.currentQuestionIndex + 1}/
                          {selectedGame.totalQuestions})
                        </button>
                      )}

                      {/* Auto-advance toggle */}
                      {selectedGame.autoAdvance ? (
                        <button
                          className="btn btn-warning"
                          onClick={handleDisableAutoAdvance}
                        >
                          ⏹️ Stop Auto-Advance
                        </button>
                      ) : (
                        <button
                          className="btn btn-accent"
                          onClick={() => setShowTimerModal(true)}
                        >
                          🤖 Automate Quiz
                        </button>
                      )}

                      <button
                        className="btn btn-danger"
                        onClick={handleEndGame}
                      >
                        🛑 End Game
                      </button>
                    </>
                  )}
                  {selectedGame.status === "paused" && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={handleResumeGame}
                      >
                        ▶️ Resume
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={handleEndGame}
                      >
                        🛑 End Game
                      </button>
                    </>
                  )}
                  {selectedGame.status === "completed" && (
                    <Link to={`/results/${gameId}`} className="btn btn-primary">
                      🏆 View Results
                    </Link>
                  )}
                  <Link
                    to={`/admin/leaderboard/${gameId}`}
                    className="btn btn-outline"
                  >
                    📊 Live Leaderboard
                  </Link>
                  <Link
                    to={`/admin/game/${gameId}/questions`}
                    className="btn btn-outline"
                  >
                    📝 Manage Questions
                  </Link>
                  {/* Reset Game Button - visible for active, paused, or completed games */}
                  {(selectedGame.status === "active" ||
                    selectedGame.status === "paused" ||
                    selectedGame.status === "completed") && (
                    <button
                      className="btn btn-warning"
                      onClick={handleResetGame}
                    >
                      🔄 Reset Game
                    </button>
                  )}
                </div>

                <div className="share-link">
                  <label>Registration Link:</label>
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/register/${gameId}`}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/register/${gameId}`,
                      );
                    }}
                  >
                    📋 Copy
                  </button>
                </div>

                {/* Pending Teams */}
                {pendingTeams.length > 0 && (
                  <div className="teams-section">
                    <h3>⏳ Pending Approval ({pendingTeams.length})</h3>
                    <div className="teams-list">
                      {pendingTeams.map((team) => (
                        <div key={team.id} className="team-card pending">
                          <div className="team-info">
                            <div className="team-name">{team.name}</div>
                            <div className="team-leader">
                              Leader: {team.leaderName}
                            </div>
                            <div className="team-members">
                              Members: {team.members.join(", ")}
                            </div>
                            {team.rejoinCode && (
                              <div className="team-rejoin-code">
                                🔑 Code: <strong>{team.rejoinCode}</strong>
                              </div>
                            )}
                          </div>
                          <div className="team-actions">
                            <button
                              className="btn btn-primary"
                              onClick={() => handleApproveTeam(team.id)}
                            >
                              ✓ Approve
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleRejectTeam(team.id)}
                            >
                              ✗ Reject
                            </button>
                            <button
                              className="btn btn-outline btn-delete"
                              onClick={() =>
                                handleDeleteTeam(team.id, team.name)
                              }
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approved Teams */}
                <div className="teams-section">
                  <h3>✅ Approved Teams ({approvedTeams.length})</h3>
                  {approvedTeams.length === 0 ? (
                    <div className="empty-state">
                      <p>No approved teams yet. Share the registration link!</p>
                    </div>
                  ) : (
                    <div className="teams-list">
                      {approvedTeams.map((team, index) => (
                        <div key={team.id} className="team-card approved">
                          <div className="team-rank">#{index + 1}</div>
                          <div className="team-info">
                            <div className="team-name">{team.name}</div>
                            <div className="team-leader">
                              Leader: {team.leaderName}
                            </div>
                            {team.rejoinCode && (
                              <div className="team-rejoin-code">
                                🔑 Code: <strong>{team.rejoinCode}</strong>
                              </div>
                            )}
                          </div>
                          <div className="team-tokens">
                            🪙 {team.tokenBalance.toLocaleString()}
                          </div>
                          <button
                            className="btn btn-outline btn-delete"
                            onClick={() => handleDeleteTeam(team.id, team.name)}
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Timer Selection Modal */}
        {showTimerModal && (
          <div
            className="modal-overlay"
            onClick={() => setShowTimerModal(false)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>🤖 Automate Quiz</h2>
              <p>
                Select how long each question should be displayed before
                automatically moving to the next:
              </p>

              <div className="timer-options">
                {TIMER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={`timer-option ${selectedTimer === option.value && !customTimer ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedTimer(option.value);
                      setCustomTimer("");
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="custom-timer">
                <label>Or enter custom time (seconds):</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  placeholder="e.g., 75"
                  value={customTimer}
                  onChange={(e) => setCustomTimer(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleEnableAutoAdvance}
                >
                  ✓ Start Auto-Advance
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowTimerModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
