import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../services/firebase";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import "./ResultsPage.css";

interface Team {
  id: string;
  name: string;
  leaderName: string;
  tokenBalance: number;
  cumulativeResponseTimeMs: number;
  status: string;
}

interface Game {
  id: string;
  name: string;
  status: string;
  totalQuestions: number;
}

const ResultsPage: React.FC = () => {
  const { gameId, teamId } = useParams<{ gameId: string; teamId?: string }>();

  const [game, setGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame({ id: snapshot.id, ...snapshot.data() } as Game);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [gameId]);

  // Subscribe to teams updates
  useEffect(() => {
    if (!gameId) return;

    const teamsRef = collection(db, "games", gameId, "teams");
    const teamsQuery = query(teamsRef, orderBy("tokenBalance", "desc"));

    const unsubscribe = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((team: any) => team.status === "approved") as Team[];

      // Sort by tokens, then by response time (tiebreaker)
      teamsData.sort((a, b) => {
        if (b.tokenBalance !== a.tokenBalance) {
          return b.tokenBalance - a.tokenBalance;
        }
        return (
          (a.cumulativeResponseTimeMs || 0) - (b.cumulativeResponseTimeMs || 0)
        );
      });

      setTeams(teamsData);

      // Find current team
      if (teamId) {
        const team = teamsData.find((t) => t.id === teamId);
        if (team) setCurrentTeam(team);
      }
    });

    return () => unsubscribe();
  }, [gameId, teamId]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🥇";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return `#${index + 1}`;
    }
  };

  const getTeamRank = () => {
    if (!currentTeam) return null;
    const rank = teams.findIndex((t) => t.id === currentTeam.id);
    return rank >= 0 ? rank + 1 : null;
  };

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="results-page">
        <div className="results-container">
          <div className="error-state">
            <h2>Game not found</h2>
            <Link to="/" className="btn btn-primary">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const winner = teams[0];
  const rank = getTeamRank();

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <h1>🏆 GAME OVER 🏆</h1>
          <p className="game-name">{game.name}</p>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="winner-section">
            <div className="winner-trophy">🏆</div>
            <h2 className="winner-title">WINNER</h2>
            <div className="winner-name">{winner.name}</div>
            <div className="winner-tokens">
              🪙 {winner.tokenBalance.toLocaleString()} tokens
            </div>
          </div>
        )}

        {/* Current Team Result (if viewing as a team) */}
        {currentTeam && rank && (
          <div className="your-result">
            <h3>Your Result</h3>
            <div className="your-rank">
              <span className="rank-number">{getRankEmoji(rank - 1)}</span>
              <span className="rank-text">
                {rank === 1
                  ? "You Won!"
                  : rank === 2
                    ? "2nd Place!"
                    : rank === 3
                      ? "3rd Place!"
                      : `${rank}th Place`}
              </span>
            </div>
            <div className="your-tokens">
              🪙 {currentTeam.tokenBalance.toLocaleString()} tokens
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="leaderboard-section">
          <h3>📊 Final Leaderboard</h3>
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="col-rank">Rank</div>
              <div className="col-team">Team</div>
              <div className="col-tokens">Tokens</div>
              <div className="col-time">Time</div>
            </div>
            <div className="table-body">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className={`table-row ${index < 3 ? `top-${index + 1}` : ""} ${team.id === teamId ? "current-team" : ""}`}
                >
                  <div className="col-rank">
                    <span className="rank-badge">{getRankEmoji(index)}</span>
                  </div>
                  <div className="col-team">
                    <div className="team-name">{team.name}</div>
                    <div className="team-leader">{team.leaderName}</div>
                  </div>
                  <div className="col-tokens">
                    <span className="token-value">
                      🪙 {team.tokenBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-time">
                    <span className="time-value">
                      ⏱️ {formatTime(team.cumulativeResponseTimeMs || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="results-actions">
          <Link to="/" className="btn btn-primary">
            🏠 Back to Home
          </Link>
        </div>

        {/* Confetti Effect */}
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                backgroundColor: ["#00ff88", "#ffd93d", "#ff6b6b", "#00d4ff"][
                  Math.floor(Math.random() * 4)
                ],
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
