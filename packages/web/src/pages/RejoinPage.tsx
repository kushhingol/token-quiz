import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../services/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import "./RejoinPage.css";

const RejoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();

    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-character code");
      return;
    }

    try {
      setIsSearching(true);

      // Search all games for a team with this rejoin code
      const gamesRef = collection(db, "games");
      const gamesSnapshot = await getDocs(gamesRef);

      for (const gameDoc of gamesSnapshot.docs) {
        const teamsRef = collection(db, "games", gameDoc.id, "teams");
        const teamQuery = query(teamsRef, where("rejoinCode", "==", cleanCode));
        const teamSnapshot = await getDocs(teamQuery);

        if (!teamSnapshot.empty) {
          const teamDoc = teamSnapshot.docs[0];
          const teamData = teamDoc.data();

          // Found the team! Navigate based on status
          if (teamData.status === "approved") {
            navigate(`/game/${gameDoc.id}/${teamDoc.id}`);
          } else if (teamData.status === "pending") {
            navigate(`/waiting/${gameDoc.id}/${teamDoc.id}`);
          } else {
            setError("This team has been rejected from the game");
          }
          return;
        }
      }

      // No team found
      setError("No team found with this code. Please check and try again.");
    } catch (err) {
      console.error("Error searching for team:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rejoin-page">
      <div className="rejoin-container">
        <div className="rejoin-card">
          <div className="rejoin-header">
            <span className="rejoin-icon">🎮</span>
            <h1>REJOIN YOUR GAME</h1>
            <p>Enter your 6-character team code to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="rejoin-form">
            {error && (
              <div className="rejoin-error">
                <span>⚠️</span> {error}
              </div>
            )}

            <div className="code-input-container">
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().slice(0, 6))
                }
                placeholder="ABC123"
                maxLength={6}
                className="code-input"
                disabled={isSearching}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary rejoin-btn"
              disabled={isSearching || code.length !== 6}
            >
              {isSearching ? "Searching..." : "🚀 REJOIN GAME"}
            </button>
          </form>

          <div className="rejoin-info">
            <p>
              <strong>Lost your code?</strong> Contact the game administrator to
              get your team's rejoin code.
            </p>
          </div>

          <div className="rejoin-footer">
            <button className="btn btn-outline" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejoinPage;
