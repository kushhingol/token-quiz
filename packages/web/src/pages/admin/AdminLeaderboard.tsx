import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../../services/firebase";
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import "./AdminLeaderboard.css";

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
  currentQuestionIndex: number;
  totalQuestions: number;
}

const AdminLeaderboard: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    // Subscribe to game updates
    const gameRef = doc(db, "games", gameId);
    const unsubGame = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame({ id: snapshot.id, ...snapshot.data() } as Game);
      }
      setLoading(false);
    });

    // Subscribe to teams updates - sorted by token balance
    const teamsRef = collection(db, "games", gameId, "teams");
    const teamsQuery = query(teamsRef, orderBy("tokenBalance", "desc"));
    const unsubTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((team: any) => team.status === "approved") as Team[];
      setTeams(teamsData);
    });

    return () => {
      unsubGame();
      unsubTeams();
    };
  }, [gameId]);

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

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-container">
          <div className="loading">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-container">
          <div className="error">Game not found</div>
          <Link to="/admin" className="btn btn-primary">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <Link to={`/admin/game/${gameId}`} className="back-link">
            ← Back to Game
          </Link>
          <h1>📊 Live Leaderboard</h1>
          <div className="game-info">
            <span className="game-name">{game.name}</span>
            <span className={`game-status status-${game.status}`}>
              {game.status.toUpperCase()}
            </span>
            <span className="question-progress">
              Question {game.currentQuestionIndex + 1} / {game.totalQuestions}
            </span>
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="empty-state">
            <p>No teams have joined yet.</p>
          </div>
        ) : (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="col-rank">Rank</div>
              <div className="col-team">Team</div>
              <div className="col-tokens">Tokens</div>
              <div className="col-time">Response Time</div>
            </div>
            <div className="table-body">
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  className={`table-row ${index < 3 ? `top-${index + 1}` : ""}`}
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
        )}

        <div className="leaderboard-footer">
          <p className="update-note">
            🔄 Updates in real-time • Tiebreaker: Fastest cumulative response
            time
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLeaderboard;
