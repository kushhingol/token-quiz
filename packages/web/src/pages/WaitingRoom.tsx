import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useSound } from "../contexts/SoundContext";
import "./WaitingRoom.css";

interface Team {
  id: string;
  name: string;
  leaderName: string;
  members: string[];
  status: "pending" | "approved" | "rejected";
  tokenBalance: number;
  rejoinCode?: string;
}

interface Game {
  id: string;
  name: string;
  status: "waiting" | "active" | "paused" | "completed";
  currentQuestionIndex: number;
  totalQuestions: number;
}

const WaitingRoom: React.FC = () => {
  const { gameId, teamId } = useParams<{ gameId: string; teamId: string }>();
  const navigate = useNavigate();
  const { playNotification, playGameStart, playCoin } = useSound();

  const [team, setTeam] = useState<Team | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const prevTeamStatus = useRef<string | null>(null);
  const prevGameStatus = useRef<string | null>(null);

  // Subscribe to team updates
  useEffect(() => {
    if (!gameId || !teamId) return;

    console.log("WaitingRoom: Subscribing to team updates", { gameId, teamId });

    const teamRef = doc(db, "games", gameId, "teams", teamId);
    const unsubscribe = onSnapshot(
      teamRef,
      (snapshot) => {
        console.log("WaitingRoom: Team snapshot received", {
          exists: snapshot.exists(),
          data: snapshot.data(),
        });
        if (snapshot.exists()) {
          const teamData = { id: snapshot.id, ...snapshot.data() } as Team;
          console.log("WaitingRoom: Setting team state", teamData);
          setTeam(teamData);
        }
        setLoading(false);
      },
      (error) => {
        console.error("WaitingRoom: Error listening to team:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [gameId, teamId]);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const gameRef = doc(db, "games", gameId);
    const unsubscribe = onSnapshot(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        setGame({ id: snapshot.id, ...snapshot.data() } as Game);
      }
    });

    return () => unsubscribe();
  }, [gameId]);

  // Play sounds on status changes
  useEffect(() => {
    if (team?.status && prevTeamStatus.current !== team.status) {
      if (team.status === "approved" && prevTeamStatus.current === "pending") {
        playNotification();
        playCoin();
      }
      prevTeamStatus.current = team.status;
    }
  }, [team?.status, playNotification, playCoin]);

  useEffect(() => {
    if (game?.status && prevGameStatus.current !== game.status) {
      if (game.status === "active" && prevGameStatus.current === "waiting") {
        playGameStart();
      }
      prevGameStatus.current = game.status;
    }
  }, [game?.status, playGameStart]);

  // Navigate to game page when team is approved (regardless of game status)
  useEffect(() => {
    if (team?.status === "approved") {
      navigate(`/game/${gameId}/${teamId}`);
    }
  }, [team, gameId, teamId, navigate]);

  if (loading) {
    return (
      <div className="waiting-page">
        <div className="waiting-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="waiting-page">
        <div className="waiting-container">
          <div className="error-state">
            <span className="error-icon">❌</span>
            <h2>Team Not Found</h2>
            <p>The team you're looking for doesn't exist.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (team.status === "rejected") {
    return (
      <div className="waiting-page">
        <div className="waiting-container">
          <div className="rejected-state">
            <span className="rejected-icon">🚫</span>
            <h2>Registration Rejected</h2>
            <p>Sorry, your team registration was not approved.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="waiting-page">
      <div className="waiting-container">
        <div className="waiting-card">
          <div className="waiting-header">
            <span className="waiting-icon">⏳</span>
            <h1>WAITING ROOM</h1>
          </div>

          <div className="team-info-card">
            <h2 className="team-name">{team.name}</h2>
            <p className="team-leader">Leader: {team.leaderName}</p>
            {team.members.length > 0 && (
              <p className="team-members">Members: {team.members.join(", ")}</p>
            )}
          </div>

          {/* Rejoin Code Display */}
          {team.rejoinCode && (
            <div className="rejoin-code-display">
              <div className="rejoin-code-label">🔑 Your Rejoin Code</div>
              <div className="rejoin-code-value">{team.rejoinCode}</div>
              <div className="rejoin-code-hint">
                Save this code to rejoin if you close the window!
              </div>
            </div>
          )}

          <div className="status-section">
            {team.status === "pending" ? (
              <div className="status-pending">
                <div className="pulse-dot"></div>
                <span>Waiting for admin approval...</span>
              </div>
            ) : team.status === "approved" ? (
              <div className="status-approved">
                <span className="check-icon">✅</span>
                <span>Team Approved!</span>
              </div>
            ) : null}
          </div>

          {team.status === "approved" && (
            <div className="token-display">
              <span className="token-icon">🪙</span>
              <span className="token-amount">
                {team.tokenBalance.toLocaleString()}
              </span>
              <span className="token-label">Starting Tokens</span>
            </div>
          )}

          {team.status === "approved" && game?.status === "waiting" && (
            <div className="game-status">
              <div className="waiting-for-game">
                <div className="spinner small"></div>
                <span>Waiting for game to start...</span>
              </div>
            </div>
          )}

          {team.status === "approved" && game?.status === "active" && (
            <div className="game-starting">
              <span className="game-icon">🎮</span>
              <span>Game is starting!</span>
            </div>
          )}

          <div className="waiting-tips">
            <h3>📋 Game Rules</h3>
            <ul>
              <li>🎯 Answer questions correctly to earn tokens</li>
              <li>💰 Bet 25, 50, 100, or 200 tokens per question</li>
              <li>✅ Correct answer = Double your bet</li>
              <li>❌ Wrong answer = Lose your bet</li>
              <li>⏱️ 60 seconds per question</li>
              <li>🏆 Highest tokens at the end wins!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingRoom;
